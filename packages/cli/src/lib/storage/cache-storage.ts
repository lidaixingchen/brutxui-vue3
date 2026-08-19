import crypto from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import type { FileSystemAdapter } from 'brutx-shared-vue/fs';

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.brutx-vue', 'cache');
const DEFAULT_TTL = 3600000;
const DEFAULT_MAX_ENTRIES = 200;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

export interface CacheFileRaw<T> {
    data?: T;
    timestamp?: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

export interface CacheReadResult<T> {
    data: T;
    timestamp: number;
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
    expired: boolean;
}

export interface CacheWriteInput {
    etag?: string;
    lastModified?: string;
    registryVersion?: string;
}

export interface CacheStats {
    dir: string;
    entryCount: number;
    totalBytes: number;
}

export interface CacheStorageOptions {
    fs: FileSystemAdapter;
    cacheDir?: string;
    maxEntries?: number;
    maxBytes?: number;
    defaultTtl?: number;
    disabled?: boolean;
    offline?: boolean;
}

export class CacheStorage {
    private static readonly sharedInflightRequests = new Map<string, Promise<unknown>>();
    private readonly fs: FileSystemAdapter;
    private readonly cacheDir: string;
    private readonly maxEntries: number;
    private readonly maxBytes: number;
    private readonly defaultTtl: number;
    private readonly disabled: boolean;
    private readonly inflightRequests: Map<string, Promise<unknown>>;

    constructor(options: CacheStorageOptions) {
        this.fs = options.fs;
        this.cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
        this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
        this.maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
        this.defaultTtl = options.defaultTtl ?? DEFAULT_TTL;
        this.disabled = options.disabled ?? false;
        this.inflightRequests = CacheStorage.sharedInflightRequests;
    }

    private getCacheKey(name: string, source: string): string {
        return crypto
            .createHash('sha256')
            .update(`${source}/${name}`)
            .digest('hex')
            .slice(0, 16);
    }

    private getCacheFilePath(name: string, source: string): string {
        return path.join(this.cacheDir, `${this.getCacheKey(name, source)}.json`);
    }

    private async writeCacheFileAtomic<T>(filePath: string, entry: CacheFileRaw<T>): Promise<void> {
        const tempPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
        try {
            await this.fs.writeJson(tempPath, entry);
            await this.fs.copy(tempPath, filePath);
            await this.fs.remove(tempPath).catch(() => {});
        } catch (error) {
            await this.fs.remove(tempPath).catch(() => {});
            throw error;
        }
    }

    private async enforceLimits(): Promise<void> {
        if (!(await this.fs.pathExists(this.cacheDir))) return;

        const entries = await this.fs.readdir(this.cacheDir, { withFileTypes: true });
        const files: Array<{ path: string; stat: { mtimeMs: number; size: number } }> = [];

        const stats = await Promise.all(
            entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
                .map(async (entry) => {
                    const fullPath = path.join(this.cacheDir, entry.name);
                    try {
                        const stat = await this.fs.stat(fullPath);
                        return { path: fullPath, stat: { mtimeMs: stat.mtimeMs, size: stat.size } };
                    } catch {
                        return null;
                    }
                }),
        );
        files.push(...stats.filter((s): s is NonNullable<typeof s> => s !== null));

        const totalBytes = files.reduce((sum, f) => sum + f.stat.size, 0);
        const needsEntryEviction = files.length > this.maxEntries;
        const needsByteEviction = totalBytes > this.maxBytes;

        if (!needsEntryEviction && !needsByteEviction) return;

        files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

        const toRemove: string[] = [];
        let currentBytes = totalBytes;
        let currentCount = files.length;
        for (const file of files) {
            if (currentCount <= this.maxEntries && currentBytes <= this.maxBytes) break;
            toRemove.push(file.path);
            currentBytes -= file.stat.size;
            currentCount -= 1;
        }

        await Promise.all(toRemove.map(filePath => this.fs.remove(filePath).catch(() => {})));
    }

    public async get<T>(name: string, source: string, ttl: number = this.defaultTtl): Promise<CacheReadResult<T> | null> {
        if (this.disabled) return null;

        const filePath = this.getCacheFilePath(name, source);
        try {
            if (!(await this.fs.pathExists(filePath))) return null;

            const raw = await this.fs.readJson<CacheFileRaw<T>>(filePath);
            if (typeof raw.timestamp !== 'number' || raw.data === undefined) return null;

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

    public async set<T>(name: string, source: string, data: T, meta?: CacheWriteInput): Promise<void> {
        if (this.disabled) return;

        const filePath = this.getCacheFilePath(name, source);
        await this.fs.ensureDir(this.cacheDir);

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            etag: meta?.etag,
            lastModified: meta?.lastModified,
            registryVersion: meta?.registryVersion,
        };

        await this.writeCacheFileAtomic(filePath, entry);
        await this.enforceLimits().catch(() => {});
    }

    public async dedupe<T>(name: string, source: string, fn: () => Promise<T | null>): Promise<T | null> {
        const key = this.getCacheKey(name, source);
        const existing = this.inflightRequests.get(key);
        if (existing) {
            return existing as Promise<T | null>;
        }
        const promise = (async () => {
            try {
                return await fn();
            } finally {
                this.inflightRequests.delete(key);
            }
        })();
        this.inflightRequests.set(key, promise);
        return promise;
    }

    public async touch(name: string, source: string): Promise<void> {
        if (this.disabled) return;

        const filePath = this.getCacheFilePath(name, source);
        if (!(await this.fs.pathExists(filePath))) return;

        try {
            const raw = await this.fs.readJson<CacheFileRaw<unknown>>(filePath);
            if (typeof raw.timestamp !== 'number' || raw.data === undefined) return;
            raw.timestamp = Date.now();
            await this.writeCacheFileAtomic(filePath, raw);
        } catch {
            // touch 失败不阻塞
        }
    }

    public async clear(maxAgeDays?: number): Promise<void> {
        if (!(await this.fs.pathExists(this.cacheDir))) return;

        if (maxAgeDays === undefined || maxAgeDays <= 0) {
            await this.fs.remove(this.cacheDir);
            return;
        }

        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const entries = await this.fs.readdir(this.cacheDir, { withFileTypes: true });

        const staleFiles = await Promise.all(
            entries
                .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
                .map(async (entry) => {
                    const fullPath = path.join(this.cacheDir, entry.name);
                    try {
                        const stat = await this.fs.stat(fullPath);
                        return now - stat.mtimeMs > maxAgeMs ? fullPath : null;
                    } catch {
                        return null;
                    }
                }),
        );
        await Promise.all(
            staleFiles
                .filter((p: string | null): p is string => p !== null)
                .map((fullPath: string) => this.fs.remove(fullPath).catch(() => {})),
        );
    }

    public async getStats(): Promise<CacheStats> {
        let entryCount = 0;
        let totalBytes = 0;

        if (await this.fs.pathExists(this.cacheDir)) {
            const entries = await this.fs.readdir(this.cacheDir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
                try {
                    const stat = await this.fs.stat(path.join(this.cacheDir, entry.name));
                    entryCount += 1;
                    totalBytes += stat.size;
                } catch {
                    // stat 失败跳过
                }
            }
        }

        return { dir: this.cacheDir, entryCount, totalBytes };
    }
}
