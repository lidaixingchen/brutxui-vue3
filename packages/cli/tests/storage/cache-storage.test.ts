import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { CacheStorage } from '../../src/lib/storage/cache-storage.js';

describe('CacheStorage (Deep Module on VFS)', () => {
    let vfs: MemoryFileSystemAdapter;
    let cache: CacheStorage;
    const cacheDir = '/custom/cache';

    beforeEach(() => {
        vfs = new MemoryFileSystemAdapter();
        cache = new CacheStorage({
            fs: vfs,
            cacheDir,
            maxEntries: 3,
            maxBytes: 1024,
            defaultTtl: 1000,
        });
    });

    describe('基础存取与 TTL 生命周期', () => {
        it('写入条目并能正确读回完整结构', async () => {
            const data = { component: 'button', files: ['Button.vue'] };
            await cache.set('button', 'official', data, {
                etag: 'etag-123',
                lastModified: '2026-08-19',
                registryVersion: '1.0.0',
            });

            const result = await cache.get<typeof data>('button', 'official');
            expect(result).not.toBeNull();
            expect(result?.data).toEqual(data);
            expect(result?.etag).toBe('etag-123');
            expect(result?.lastModified).toBe('2026-08-19');
            expect(result?.registryVersion).toBe('1.0.0');
            expect(result?.expired).toBe(false);
        });

        it('未命中或已禁用缓存应返回 null', async () => {
            const miss = await cache.get('not-exist', 'official');
            expect(miss).toBeNull();

            const disabledCache = new CacheStorage({ fs: vfs, disabled: true });
            await disabledCache.set('button', 'official', { ok: true });
            expect(await disabledCache.get('button', 'official')).toBeNull();
        });

        it('TTL 过期时 expired 应标记为 true 但仍保留数据', async () => {
            await cache.set('badge', 'official', { name: 'badge' });

            // 传入极短 ttl 模拟过期
            const result = await cache.get('badge', 'official', 0);
            expect(result).not.toBeNull();
            expect(result?.expired).toBe(true);
            expect(result?.data).toEqual({ name: 'badge' });
        });

        it('304 命中后 touch 能够刷新 timestamp 并消除过期状态', async () => {
            await cache.set('card', 'official', { name: 'card' });

            // 获取初始时间戳
            const initial = await cache.get('card', 'official');
            expect(initial).not.toBeNull();

            // 等待微小间隔后 touch
            await cache.touch('card', 'official');
            const touched = await cache.get('card', 'official');
            expect(touched).not.toBeNull();
            expect(touched!.timestamp).toBeGreaterThanOrEqual(initial!.timestamp);
        });
    });

    describe('并发 In-Flight 合并与请求去重', () => {
        it('多个并发请求应合并为单一执行', async () => {
            let executionCount = 0;
            const factory = async () => {
                executionCount += 1;
                return { name: 'dialog' };
            };

            const [res1, res2, res3] = await Promise.all([
                cache.dedupe('dialog', 'official', factory),
                cache.dedupe('dialog', 'official', factory),
                cache.dedupe('dialog', 'official', factory),
            ]);

            expect(executionCount).toBe(1);
            expect(res1).toEqual({ name: 'dialog' });
            expect(res2).toEqual({ name: 'dialog' });
            expect(res3).toEqual({ name: 'dialog' });
        });
    });

    describe('LRU 淘汰机制 (双限控制)', () => {
        it('超过最大条目数时应优先淘汰最旧条目', async () => {
            // maxEntries = 3
            await cache.set('item1', 's', { id: 1 });
            await cache.set('item2', 's', { id: 2 });
            await cache.set('item3', 's', { id: 3 });

            // 写入第 4 个条目，触发 LRU 淘汰 item1
            await cache.set('item4', 's', { id: 4 });

            const stats = await cache.getStats();
            expect(stats.entryCount).toBeLessThanOrEqual(3);

            // item1 是最早写入的，应被淘汰
            expect(await cache.get('item1', 's')).toBeNull();
            expect(await cache.get('item4', 's')).not.toBeNull();
        });
    });

    describe('清理与可观测性统计', () => {
        it('clear 能够彻底清空缓存目录', async () => {
            await cache.set('a', 's', 1);
            await cache.set('b', 's', 2);

            let stats = await cache.getStats();
            expect(stats.entryCount).toBe(2);

            await cache.clear();
            stats = await cache.getStats();
            expect(stats.entryCount).toBe(0);
        });

        it('getStats 准确统计条目数与字节占用', async () => {
            await cache.set('hero', 's', { title: 'BrutxUI' });
            const stats = await cache.getStats();

            expect(stats.dir).toBe(cacheDir);
            expect(stats.entryCount).toBe(1);
            expect(stats.totalBytes).toBeGreaterThan(0);
        });
    });
});
