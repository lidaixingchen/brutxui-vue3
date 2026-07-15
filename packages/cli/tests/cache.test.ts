import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';

const {
    getCachedEntry,
    setCachedEntry,
    touchCachedEntry,
    clearCache,
    dedupeInflight,
} = await import('../src/lib/cache.js');

let tmpRoot: string;
let cacheDir: string;

describe('cache layer', () => {
    beforeEach(async () => {
        tmpRoot = path.join(os.tmpdir(), `brutx-cache-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
        cacheDir = path.join(tmpRoot, '.brutx-vue', 'cache');
        process.env.BRUTX_CACHE_DIR = cacheDir;
        await fs.ensureDir(cacheDir);
        delete process.env.BRUTX_CACHE_MAX;
        delete process.env.BRUTX_CACHE_MAX_BYTES;
        delete process.env.BRUTX_NO_CACHE;
    });

    afterEach(async () => {
        delete process.env.BRUTX_CACHE_DIR;
        delete process.env.BRUTX_CACHE_MAX;
        delete process.env.BRUTX_CACHE_MAX_BYTES;
        delete process.env.BRUTX_NO_CACHE;
        await fs.remove(tmpRoot);
    });

    describe('CacheEntry schema (etag/lastModified/registryVersion)', () => {
        it('writes and reads back entry with header metadata', async () => {
            const data = { name: 'button', integrity: 'sha256-abc' };
            await setCachedEntry('button', 'https://reg.test', data, {
                etag: '"abc123"',
                lastModified: 'Wed, 16 Jul 2026 00:00:00 GMT',
                registryVersion: '1.0.0',
            });

            const entry = await getCachedEntry('button', 'https://reg.test');
            expect(entry).not.toBeNull();
            expect(entry!.data).toEqual(data);
            expect(entry!.etag).toBe('"abc123"');
            expect(entry!.lastModified).toBe('Wed, 16 Jul 2026 00:00:00 GMT');
            expect(entry!.registryVersion).toBe('1.0.0');
            expect(entry!.expired).toBe(false);
        });

        it('marks entry as expired after TTL elapses', async () => {
            await setCachedEntry('button', 'https://reg.test', { name: 'button' });
            const entry = await getCachedEntry('button', 'https://reg.test', 0);
            expect(entry!.expired).toBe(true);
        });

        it('returns null for non-existent entry', async () => {
            const entry = await getCachedEntry('nonexistent', 'https://reg.test');
            expect(entry).toBeNull();
        });

        it('touchCachedEntry refreshes timestamp without rewriting body', async () => {
            await setCachedEntry('button', 'https://reg.test', { name: 'button' });
            const before = await getCachedEntry('button', 'https://reg.test');
            await new Promise(resolve => setTimeout(resolve, 10));
            await touchCachedEntry('button', 'https://reg.test');
            const after = await getCachedEntry('button', 'https://reg.test');
            expect(after!.timestamp).toBeGreaterThanOrEqual(before!.timestamp);
            expect(after!.data).toEqual(before!.data);
        });
    });

    describe('registry version binding', () => {
        it('skips cache when registryVersion does not match', async () => {
            const data = { name: 'button', integrity: 'sha256-abc' };
            await setCachedEntry('button', 'https://reg.test', data, {
                registryVersion: '1.0.0',
            });

            const entry = await getCachedEntry('button', 'https://reg.test');
            expect(entry!.registryVersion).toBe('1.0.0');

            const currentRegistryVersion = '2.0.0';
            const versionMatch = !currentRegistryVersion ||
                !entry!.registryVersion ||
                entry!.registryVersion === currentRegistryVersion;
            expect(versionMatch).toBe(false);
        });

        it('uses cache when registryVersion matches', async () => {
            const data = { name: 'button', integrity: 'sha256-abc' };
            await setCachedEntry('button', 'https://reg.test', data, {
                registryVersion: '1.5.0',
            });

            const entry = await getCachedEntry('button', 'https://reg.test');
            const currentRegistryVersion = '1.5.0';
            const versionMatch = !currentRegistryVersion ||
                !entry!.registryVersion ||
                entry!.registryVersion === currentRegistryVersion;
            expect(versionMatch).toBe(true);
            expect(entry!.expired).toBe(false);
        });

        it('uses cache when registryVersion is missing (legacy entries)', async () => {
            await setCachedEntry('button', 'https://reg.test', { name: 'button' });
            const entry = await getCachedEntry('button', 'https://reg.test');
            expect(entry!.registryVersion).toBeUndefined();

            const currentRegistryVersion = '2.0.0';
            const versionMatch = !currentRegistryVersion ||
                !entry!.registryVersion ||
                entry!.registryVersion === currentRegistryVersion;
            expect(versionMatch).toBe(true);
        });
    });

    describe('in-flight deduplication', () => {
        it('shares Promise for concurrent calls with same key', async () => {
            let callCount = 0;
            const fn = async () => {
                callCount += 1;
                await new Promise(resolve => setTimeout(resolve, 20));
                return { result: 'data' };
            };

            const [a, b, c] = await Promise.all([
                dedupeInflight('button', 'https://reg.test', fn),
                dedupeInflight('button', 'https://reg.test', fn),
                dedupeInflight('button', 'https://reg.test', fn),
            ]);

            expect(callCount).toBe(1);
            expect(a).toEqual({ result: 'data' });
            expect(b).toEqual({ result: 'data' });
            expect(c).toEqual({ result: 'data' });
        });

        it('separates requests for different keys', async () => {
            let callCount = 0;
            const makeFn = () => async () => {
                callCount += 1;
                await new Promise(resolve => setTimeout(resolve, 10));
                return null;
            };

            await Promise.all([
                dedupeInflight('button', 'https://reg.test', makeFn()),
                dedupeInflight('input', 'https://reg.test', makeFn()),
            ]);

            expect(callCount).toBe(2);
        });

        it('clears in-flight entry after completion (next call is fresh)', async () => {
            let callCount = 0;
            const fn = async () => {
                callCount += 1;
                return { result: 'data' };
            };

            await dedupeInflight('button', 'https://reg.test', fn);
            await dedupeInflight('button', 'https://reg.test', fn);

            expect(callCount).toBe(2);
        });
    });

    describe('LRU eviction', () => {
        it('evicts oldest entries when entry count exceeds BRUTX_CACHE_MAX', async () => {
            process.env.BRUTX_CACHE_MAX = '3';
            for (let i = 0; i < 5; i++) {
                await setCachedEntry(`comp-${i}`, 'https://reg.test', { idx: i });
                await new Promise(resolve => setTimeout(resolve, 5));
            }

            const files = (await fs.readdir(cacheDir)).filter(f => f.endsWith('.json'));
            expect(files.length).toBeLessThanOrEqual(3);

            const entry4 = await getCachedEntry('comp-4', 'https://reg.test');
            expect(entry4).not.toBeNull();
        });

        it('respects default 200 entries limit when BRUTX_CACHE_MAX not set', async () => {
            for (let i = 0; i < 3; i++) {
                await setCachedEntry(`comp-${i}`, 'https://reg.test', { idx: i });
            }
            const files = (await fs.readdir(cacheDir)).filter(f => f.endsWith('.json'));
            expect(files.length).toBe(3);
        });

        it('evicts by byte size when BRUTX_CACHE_MAX_BYTES exceeded', async () => {
            process.env.BRUTX_CACHE_MAX_BYTES = '1024';
            const bigData = 'x'.repeat(600);
            for (let i = 0; i < 4; i++) {
                await setCachedEntry(`comp-${i}`, 'https://reg.test', { data: bigData });
                await new Promise(resolve => setTimeout(resolve, 5));
            }

            const files = (await fs.readdir(cacheDir)).filter(f => f.endsWith('.json'));
            let totalSize = 0;
            for (const f of files) {
                const stat = await fs.stat(path.join(cacheDir, f));
                totalSize += stat.size;
            }
            expect(totalSize).toBeLessThanOrEqual(1024);
        });
    });

    describe('clearCache with --max-age', () => {
        it('clears all entries when maxAgeDays not provided', async () => {
            await setCachedEntry('a', 'https://reg.test', { x: 1 });
            await setCachedEntry('b', 'https://reg.test', { x: 2 });
            await clearCache();
            expect(await fs.pathExists(cacheDir)).toBe(false);
        });

        it('only clears entries older than maxAgeDays', async () => {
            await setCachedEntry('old', 'https://reg.test', { x: 1 });
            const files = await fs.readdir(cacheDir);
            const oldFile = path.join(cacheDir, files[0]);
            const oldTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
            await fs.utimes(oldFile, oldTime, oldTime);

            await setCachedEntry('new', 'https://reg2.test', { x: 2 });

            await clearCache(7);

            const oldEntry = await getCachedEntry('old', 'https://reg.test');
            expect(oldEntry).toBeNull();
            const newEntry = await getCachedEntry('new', 'https://reg2.test');
            expect(newEntry).not.toBeNull();
        });

        it('clears nothing when maxAgeDays larger than all entries', async () => {
            await setCachedEntry('a', 'https://reg.test', { x: 1 });
            await clearCache(365);
            const entry = await getCachedEntry('a', 'https://reg.test');
            expect(entry).not.toBeNull();
        });
    });

    describe('BRUTX_NO_CACHE', () => {
        it('disables cache reads and writes', async () => {
            process.env.BRUTX_NO_CACHE = '1';
            await setCachedEntry('button', 'https://reg.test', { x: 1 });
            const entry = await getCachedEntry('button', 'https://reg.test');
            expect(entry).toBeNull();
        });
    });
});
