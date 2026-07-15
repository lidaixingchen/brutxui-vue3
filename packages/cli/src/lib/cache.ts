import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { logger } from './logger.js';

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.brutx-vue', 'cache');
const DEFAULT_TTL = 3600000;
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

const MAX_ENTRIES_ENV = 'BRUTX_CACHE_MAX';
const MAX_BYTES_ENV = 'BRUTX_CACHE_MAX_BYTES';
const CACHE_DIR_ENV = 'BRUTX_CACHE_DIR';

/**
 * 运行时读取缓存目录，优先环境变量 BRUTX_CACHE_DIR（主要用于测试隔离）。
 * 不用模块级常量——环境变量在进程内可变，且测试需动态切换。
 */
function getCacheDir(): string {
    return process.env[CACHE_DIR_ENV] ?? DEFAULT_CACHE_DIR;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

interface CacheFileRaw<T> {
    data?: T;
    timestamp?: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

function getCacheKey(name: string, source: string): string {
    return crypto
        .createHash('sha256')
        .update(`${source}/${name}`)
        .digest('hex')
        .slice(0, 16);
}

function getCacheFilePath(name: string, source: string): string {
    return path.join(getCacheDir(), `${getCacheKey(name, source)}.json`);
}

function isCacheDisabled(): boolean {
    return process.env.BRUTX_NO_CACHE === '1';
}

/**
 * 离线模式（P1-5）：BRUTX_OFFLINE=1 或 --offline 触发。
 * 语义：只读缓存，TTL 过期也复用（但必须通过 integrity 校验）。
 * 缓存未命中时调用方应抛 REGISTRY_OFFLINE_UNAVAILABLE。
 */
export function isOfflineMode(): boolean {
    return process.env.BRUTX_OFFLINE === '1';
}

function getMaxEntries(): number {
    const raw = process.env[MAX_ENTRIES_ENV];
    if (!raw) return DEFAULT_MAX_ENTRIES;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return DEFAULT_MAX_ENTRIES;
    return parsed;
}

function getMaxBytes(): number {
    const raw = process.env[MAX_BYTES_ENV];
    if (!raw) return DEFAULT_MAX_BYTES;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1024) return DEFAULT_MAX_BYTES;
    return parsed;
}

/**
 * in-flight 去重：同一 cacheKey 的并发请求共享同一 Promise。
 * 进程级 Map，CLI 退出即清理。面向未来并发 getItem/add 路径的安全储备。
 */
const inflightRequests = new Map<string, Promise<unknown>>();

export function getInflightKey(name: string, source: string): string {
    return getCacheKey(name, source);
}

/**
 * 执行去重：若已有同名请求在飞，返回该 Promise；否则执行 fn 并缓存其 Promise。
 * fn 返回 null 时视为缓存未命中且不写入缓存（仍复用 Promise 避免重复请求）。
 */
export async function dedupeInflight<T>(
    name: string,
    source: string,
    fn: () => Promise<T | null>,
): Promise<T | null> {
    const key = getInflightKey(name, source);
    const existing = inflightRequests.get(key);
    if (existing) {
        return existing as Promise<T | null>;
    }
    const promise = (async () => {
        try {
            return await fn();
        } finally {
            inflightRequests.delete(key);
        }
    })();
    inflightRequests.set(key, promise);
    return promise;
}

/**
 * 清理超过上限的最旧缓存条目（LRU 淘汰）。
 * 按两条上限取严：条目数与字节数。
 */
async function enforceLimits(): Promise<void> {
    const maxEntries = getMaxEntries();
    const maxBytes = getMaxBytes();
    const cacheDir = getCacheDir();

    if (!(await fs.pathExists(cacheDir))) return;

    const entries = await fs.readdir(cacheDir, { withFileTypes: true });
    const files: Array<{ path: string; stat: { mtimeMs: number; size: number } }> = [];

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const fullPath = path.join(cacheDir, entry.name);
        try {
            const stat = await fs.stat(fullPath);
            files.push({ path: fullPath, stat: { mtimeMs: stat.mtimeMs, size: stat.size } });
        } catch {
            // stat 失败的文件跳过
        }
    }

    const totalBytes = files.reduce((sum, f) => sum + f.stat.size, 0);
    const needsEntryEviction = files.length > maxEntries;
    const needsByteEviction = totalBytes > maxBytes;

    if (!needsEntryEviction && !needsByteEviction) return;

    files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

    let removed = 0;
    let currentBytes = totalBytes;
    let currentCount = files.length;
    for (const file of files) {
        if (!needsEntryEviction && !needsByteEviction) break;
        if (currentCount <= maxEntries && currentBytes <= maxBytes) break;
        try {
            await fs.remove(file.path);
            currentBytes -= file.stat.size;
            currentCount -= 1;
            removed += 1;
        } catch {
            // 删除失败跳过
        }
    }

    if (removed > 0) {
        logger.debug(`Cache: evicted ${removed} entries (LRU).`);
    }
}

export interface CacheReadResult<T> {
    data: T;
    timestamp: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
    expired: boolean;
}

/**
 * 读取缓存。返回完整 entry（含 header 与 registryVersion），以及 expired 标记。
 * TTL 过期时不立即删除——调用方可据 etag/lastModified 发条件请求，304 则复用 body。
 */
export async function getCachedEntry<T>(
    name: string,
    source: string,
    ttl: number = DEFAULT_TTL,
): Promise<CacheReadResult<T> | null> {
    if (isCacheDisabled()) return null;

    const filePath = getCacheFilePath(name, source);

    try {
        if (!(await fs.pathExists(filePath))) return null;

        const raw = await fs.readJson(filePath) as CacheFileRaw<T>;
        if (typeof raw.timestamp !== 'number') return null;

        const expired = Date.now() - raw.timestamp >= ttl;
        return {
            data: raw.data as T,
            timestamp: raw.timestamp,
            etag: raw.etag,
            lastModified: raw.lastModified,
            registryVersion: raw.registryVersion,
            expired,
        };
    } catch {
        return null;
    }
}

export interface CacheWriteInput {
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

/**
 * 写入缓存。写入后触发 LRU 上限检查。
 */
export async function setCachedEntry<T>(
    name: string,
    source: string,
    data: T,
    meta?: CacheWriteInput,
): Promise<void> {
    if (isCacheDisabled()) return;

    const filePath = getCacheFilePath(name, source);
    await fs.ensureDir(getCacheDir());

    const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        etag: meta?.etag,
        lastModified: meta?.lastModified,
        registryVersion: meta?.registryVersion,
    };

    await fs.writeJson(filePath, entry);
    await enforceLimits().catch(() => {});
}

/**
 * 刷新已缓存条目的 timestamp（不重写 body），用于 304 响应时续期。
 */
export async function touchCachedEntry(name: string, source: string): Promise<void> {
    if (isCacheDisabled()) return;

    const filePath = getCacheFilePath(name, source);
    if (!(await fs.pathExists(filePath))) return;

    try {
        const raw = await fs.readJson(filePath) as CacheFileRaw<unknown>;
        if (typeof raw.timestamp !== 'number') return;
        raw.timestamp = Date.now();
        await fs.writeJson(filePath, raw);
    } catch {
        // touch 失败不影响主流程
    }
}

// --- 向后兼容旧 API -------------------------------------------------------
// getCached/setCache 保留给尚未改造的调用方使用；新代码应直接用 getCachedEntry/setCachedEntry。

export async function getCached<T>(name: string, source: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
    const result = await getCachedEntry<T>(name, source, ttl);
    if (!result) return null;
    if (result.expired) return null;
    return result.data;
}

export async function setCache<T>(name: string, source: string, data: T): Promise<void> {
    await setCachedEntry(name, source, data);
}

/**
 * 清空整个缓存目录，或只清理超过 maxAgeDays 天的条目。
 * @param maxAgeDays 可选，提供时只清理超过该天数的条目；不提供时清空全部。
 */
export async function clearCache(maxAgeDays?: number): Promise<void> {
    const cacheDir = getCacheDir();
    if (!(await fs.pathExists(cacheDir))) return;

    if (maxAgeDays === undefined || maxAgeDays <= 0) {
        await fs.remove(cacheDir);
        return;
    }

    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const entries = await fs.readdir(cacheDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const fullPath = path.join(cacheDir, entry.name);
        try {
            const stat = await fs.stat(fullPath);
            if (now - stat.mtimeMs > maxAgeMs) {
                await fs.remove(fullPath);
            }
        } catch {
            // stat 失败跳过
        }
    }
}
