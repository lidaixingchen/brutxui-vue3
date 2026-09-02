import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { computeRegistryIntegrity, computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import { RegistryClient } from '../src/lib/registry-client.js';
import { CacheStorage } from '../src/lib/storage/cache-storage.js';
import { CliError } from '../src/lib/error.js';
import { generateEd25519KeyPair, signManifestIntegrity } from '../src/lib/signature.js';

function createMockItem(name: string, overrides: Record<string, unknown> = {}) {
    const files = (overrides.files as any) ?? [{
        path: `components/ui/${name}/${name}.vue`,
        content: `<template>${name}</template>`,
        type: 'registry:ui',
    }];
    const item = {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        dependencies: [],
        devDependencies: [],
        registryDependencies: [],
        files,
        tailwind: {},
        cssVars: {},
        ...overrides,
    };
    return {
        ...item,
        integrity: (overrides.integrity as string) ?? computeRegistryIntegrity(item.files),
    };
}

describe('RegistryClient Base Pipeline (Ticket 2 / #106)', () => {
    let memoryFs: MemoryFileSystemAdapter;
    let cacheStorage: CacheStorage;

    beforeEach(() => {
        memoryFs = new MemoryFileSystemAdapter();
        cacheStorage = new CacheStorage({
            fs: memoryFs,
            cacheDir: '/cache',
            maxEntries: 100,
            maxBytes: 10 * 1024 * 1024,
            defaultTtl: 3600000,
            disabled: false,
            offline: false,
        });
    });

    it('fetches component over HTTP mock fetcher (200 OK)', async () => {
        const item = createMockItem('button');
        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/button.json')) {
                return new Response(JSON.stringify(item), {
                    status: 200,
                    headers: { 'content-type': 'application/json' },
                });
            }
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const result = await client.fetchItem('button');
        expect(result.name).toBe('button');
        expect(result.integrity).toBe(item.integrity);
        expect(mockFetcher).toHaveBeenCalledWith('https://registry.example.com/button.json', expect.anything());
    });

    it('handles HTTP 304 Not Modified conditional request', async () => {
        const item = createMockItem('card');
        let requestCount = 0;

        const mockFetcher = vi.fn(async (url: string, init?: RequestInit) => {
            requestCount++;
            const headers = (init?.headers as Record<string, string>) ?? {};
            if (headers['If-None-Match'] === '"etag-123"') {
                return new Response(null, { status: 304 });
            }
            return new Response(JSON.stringify(item), {
                status: 200,
                headers: { etag: '"etag-123"', 'content-type': 'application/json' },
            });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        // 首次请求：200 写入缓存
        const first = await client.fetchItem('card');
        expect(first.name).toBe('card');

        // 第二次请求：发送 If-None-Match，返回 304，复用缓存
        const second = await client.fetchItem('card');
        expect(second.name).toBe('card');
        expect(requestCount).toBe(2);
    });

    it('resolves version-pinned specifier on GitHub raw source', async () => {
        const itemV1 = createMockItem('button', { version: '1.0.0' });
        const fetchedUrls: string[] = [];

        const mockFetcher = vi.fn(async (url: string) => {
            fetchedUrls.push(url);
            return new Response(JSON.stringify(itemV1), { status: 200 });
        });

        const client = new RegistryClient({
            sources: ['https://raw.githubusercontent.com/org/repo/main/registry'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const result = await client.fetchItem('button@v1.0.0');
        expect(result.name).toBe('button');
        expect(fetchedUrls).toContain('https://raw.githubusercontent.com/org/repo/v1.0.0/registry/button.json');
    });

    it('fetches from local file system source and protects against path traversal', async () => {
        const localItem = createMockItem('badge');
        await memoryFs.ensureDir('/local-registry');
        await memoryFs.writeFile('/local-registry/badge.json', JSON.stringify(localItem, null, 2));

        const client = new RegistryClient({
            sources: ['/local-registry'],
            fsAdapter: memoryFs,
            cacheStorage,
        });

        const result = await client.fetchItem('badge');
        expect(result.name).toBe('badge');

        // 路径穿越拦截
        await expect(client.fetchItem('../secret')).rejects.toMatchObject({
            code: 'PATH_UNSAFE',
        });

        // 未知组件拦截
        await expect(client.fetchItem('missing')).rejects.toMatchObject({
            code: 'COMPONENT_NOT_FOUND',
        });
    });

    it('enforces Ed25519 signature verification in strict mode', async () => {
        const keyPair = generateEd25519KeyPair();
        const item = createMockItem('alert');

        const base = {
            name: 'brutx-registry',
            schemaVersion: 1,
            registryVersion: '1.0.0',
            items: { alert: { integrity: item.integrity } },
        };
        const integrity = computeRegistryManifestIntegrity(base);
        const manifest = {
            ...base,
            integrity,
            keyId: keyPair.keyId,
            signature: signManifestIntegrity(integrity, keyPair.privateKey).slice(0, -4) + 'XXXX',
        };

        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('registry-manifest.json')) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            return new Response(JSON.stringify(item), { status: 200 });
        });

        const strictClient = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
            requireSignature: true,
            trustedPublicKeys: [keyPair],
        });

        await expect(strictClient.fetchItem('alert')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
    });

    it('respects offline mode by serving only from cache and rejecting misses without network calls', async () => {
        const cachedItem = createMockItem('cached-box');
        await cacheStorage.set('cached-box', 'https://registry.example.com', cachedItem);

        const mockFetcher = vi.fn(async () => new Response('network unreachable', { status: 500 }));

        const offlineClient = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
            offline: true,
        });

        // 缓存命中成功
        const hit = await offlineClient.fetchItem('cached-box');
        expect(hit.name).toBe('cached-box');
        expect(mockFetcher).not.toHaveBeenCalled();

        // 缓存未命中抛出 REGISTRY_OFFLINE_UNAVAILABLE 且不触网
        await expect(offlineClient.fetchItem('not-cached')).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
        });
        expect(mockFetcher).not.toHaveBeenCalled();
    });
});

describe('RegistryClient Dependencies & Listing (Ticket 3 / #107)', () => {
    let memoryFs: MemoryFileSystemAdapter;
    let cacheStorage: CacheStorage;

    beforeEach(() => {
        memoryFs = new MemoryFileSystemAdapter();
        cacheStorage = new CacheStorage({
            fs: memoryFs,
            cacheDir: '/cache',
            maxEntries: 100,
            maxBytes: 10 * 1024 * 1024,
            defaultTtl: 3600000,
            disabled: false,
            offline: false,
        });
    });

    it('topologically sorts dependencies and deduplicates shared components', async () => {
        const button = createMockItem('button', {
            dependencies: ['clsx'],
        });
        const popover = createMockItem('popover', {
            registryDependencies: ['button'],
            dependencies: ['@floating-ui/dom'],
        });
        const combobox = createMockItem('combobox', {
            registryDependencies: ['button', 'popover'],
            dependencies: ['@floating-ui/dom', 'fast-deep-equal'],
            devDependencies: ['@types/fast-deep-equal'],
        });

        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/combobox.json')) return new Response(JSON.stringify(combobox), { status: 200 });
            if (url.endsWith('/popover.json')) return new Response(JSON.stringify(popover), { status: 200 });
            if (url.endsWith('/button.json')) return new Response(JSON.stringify(button), { status: 200 });
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const result = await client.resolveDependencies(['combobox']);
        expect(result.items.map(i => i.name)).toEqual(['button', 'popover', 'combobox']);
        expect(result.hitSources.get('button')).toBe('https://registry.example.com');
        expect(result.hitSources.get('combobox')).toBe('https://registry.example.com');
        expect(result.dependencies).toEqual(['@floating-ui/dom', 'clsx', 'fast-deep-equal']);
        expect(result.devDependencies).toEqual(['@types/fast-deep-equal']);
    });

    it('detects and prevents circular dependencies with diagnostic path', async () => {
        const itemA = createMockItem('comp-a', { registryDependencies: ['comp-b'] });
        const itemB = createMockItem('comp-b', { registryDependencies: ['comp-a'] });

        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/comp-a.json')) return new Response(JSON.stringify(itemA), { status: 200 });
            if (url.endsWith('/comp-b.json')) return new Response(JSON.stringify(itemB), { status: 200 });
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        await expect(client.resolveDependencies(['comp-a'])).rejects.toMatchObject({
            code: 'INVALID_REGISTRY',
            message: expect.stringContaining('Circular dependency detected'),
        });
    });

    it('lists components from local file system directory', async () => {
        await memoryFs.ensureDir('/custom-local-registry');
        await memoryFs.writeFile('/custom-local-registry/button.json', '{}');
        await memoryFs.writeFile('/custom-local-registry/dialog.json', '{}');
        await memoryFs.writeFile('/custom-local-registry/registry-manifest.json', '{}');
        await memoryFs.writeFile('/custom-local-registry/index.json', '{}');

        const client = new RegistryClient({
            sources: ['/custom-local-registry'],
            fsAdapter: memoryFs,
            cacheStorage,
        });

        const components = await client.listComponents();
        expect(components).toEqual(['button', 'dialog']);
    });

    it('lists components from remote registry manifest when available', async () => {
        const manifest = {
            name: 'brutx-registry',
            schemaVersion: 1,
            registryVersion: '1.0.0',
            items: {
                table: {},
                select: {},
                badge: {},
            },
        };

        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('registry-manifest.json')) {
                return new Response(JSON.stringify(manifest), { status: 200 });
            }
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const components = await client.listComponents();
        expect(components).toEqual(['badge', 'select', 'table']);
    });
});

