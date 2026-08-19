import os from 'node:os';
import path from 'node:path';
import { DiskFileSystemAdapter, type FileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    CacheStorage,
    type CacheReadResult,
    type CacheWriteInput,
    type CacheStats,
} from './storage/cache-storage.js';

export {
    type CacheReadResult,
    type CacheWriteInput,
    type CacheStats,
    CacheStorage,
};

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.brutx-vue', 'cache');
const DEFAULT_TTL = 3600000;
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

const MAX_ENTRIES_ENV = 'BRUTX_CACHE_MAX';
const MAX_BYTES_ENV = 'BRUTX_CACHE_MAX_BYTES';
const CACHE_DIR_ENV = 'BRUTX_CACHE_DIR';

function getCacheDir(): string {
    return process.env[CACHE_DIR_ENV] ?? DEFAULT_CACHE_DIR;
}

function isCacheDisabled(): boolean {
    return process.env.BRUTX_NO_CACHE === '1';
}

export function isOfflineMode(): boolean {
    return process.env.BRUTX_OFFLINE === '1';
}

function getMaxEntries(): number {
    const raw = process.env[MAX_ENTRIES_ENV];
    if (!raw) return DEFAULT_MAX_ENTRIES;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) || parsed < 1 ? DEFAULT_MAX_ENTRIES : parsed;
}

function getMaxBytes(): number {
    const raw = process.env[MAX_BYTES_ENV];
    if (!raw) return DEFAULT_MAX_BYTES;
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) || parsed < 1024 ? DEFAULT_MAX_BYTES : parsed;
}

/** 默认磁盘适配器单例 */
const defaultDiskFs = new DiskFileSystemAdapter();

/** 创建基于当前环境变量与传入 VFS 适配器的 CacheStorage 实例 */
export function createDefaultCacheStorage(fsAdapter: FileSystemAdapter = defaultDiskFs): CacheStorage {
    return new CacheStorage({
        fs: fsAdapter,
        cacheDir: getCacheDir(),
        maxEntries: getMaxEntries(),
        maxBytes: getMaxBytes(),
        defaultTtl: DEFAULT_TTL,
        disabled: isCacheDisabled(),
        offline: isOfflineMode(),
    });
}

export async function dedupeInflight<T>(
    name: string,
    source: string,
    fn: () => Promise<T | null>,
): Promise<T | null> {
    return createDefaultCacheStorage().dedupe(name, source, fn);
}

export async function getCachedEntry<T>(
    name: string,
    source: string,
    ttl: number = DEFAULT_TTL,
): Promise<CacheReadResult<T> | null> {
    return createDefaultCacheStorage().get<T>(name, source, ttl);
}

export async function setCachedEntry<T>(
    name: string,
    source: string,
    data: T,
    meta?: CacheWriteInput,
): Promise<void> {
    return createDefaultCacheStorage().set<T>(name, source, data, meta);
}

export async function touchCachedEntry(name: string, source: string): Promise<void> {
    return createDefaultCacheStorage().touch(name, source);
}

export async function getCached<T>(name: string, source: string, ttl: number = DEFAULT_TTL): Promise<T | null> {
    const result = await getCachedEntry<T>(name, source, ttl);
    if (!result || result.expired) return null;
    return result.data;
}

export async function setCache<T>(name: string, source: string, data: T): Promise<void> {
    return setCachedEntry(name, source, data);
}

export async function clearCache(maxAgeDays?: number): Promise<void> {
    return createDefaultCacheStorage().clear(maxAgeDays);
}

export async function getCacheStats(): Promise<CacheStats> {
    return createDefaultCacheStorage().getStats();
}
