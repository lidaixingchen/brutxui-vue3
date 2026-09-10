import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { computeRegistryIntegrity, computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import {
    RegistryClient,
    isComponentNotFoundError,
    isRegistrySecurityError,
} from '../src/lib/registry-client.js';
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

describe('RegistryClient Base Pipeline', () => {
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

describe('RegistryClient Dependencies & Listing', () => {
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

        const result = await client.resolve(['combobox']);
        expect(result.items.map(i => i.name)).toEqual(['button', 'popover', 'combobox']);
        expect(result.hitSources.get('button')).toBe('https://registry.example.com');
        expect(result.hitSources.get('combobox')).toBe('https://registry.example.com');
        expect(result.npmDependencies).toEqual(['@floating-ui/dom', 'clsx', 'fast-deep-equal']);
        expect(result.npmDevDependencies).toEqual(['@types/fast-deep-equal']);
        expect(result.registryDependencies).toEqual(['button', 'popover']);
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

        await expect(client.resolve(['comp-a'])).rejects.toMatchObject({
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

    it('provides type guards for component not found and security errors', () => {
        const notFoundError = new CliError('Component missing', { code: 'COMPONENT_NOT_FOUND' });
        const signatureError = new CliError('Invalid signature', { code: 'REGISTRY_SIGNATURE_INVALID' });
        const integrityError = new CliError('Integrity mismatch', { code: 'REGISTRY_INTEGRITY_FAILED' });
        const pathError = new CliError('Path traversal', { code: 'PATH_UNSAFE' });
        const otherError = new CliError('Generic failure', { code: 'REGISTRY_FETCH_FAILED' });
        const regularError = new Error('Random error');

        expect(isComponentNotFoundError(notFoundError)).toBe(true);
        expect(isComponentNotFoundError(otherError)).toBe(false);
        expect(isComponentNotFoundError(regularError)).toBe(false);

        expect(isRegistrySecurityError(signatureError)).toBe(true);
        expect(isRegistrySecurityError(integrityError)).toBe(true);
        expect(isRegistrySecurityError(pathError)).toBe(true);
        expect(isRegistrySecurityError(notFoundError)).toBe(false);
        expect(isRegistrySecurityError(regularError)).toBe(false);
    });

    it('resolves diamond dependencies concurrently without false circular dependency errors', async () => {
        const itemD = createMockItem('d');
        const itemB = createMockItem('b', { registryDependencies: ['d'] });
        const itemC = createMockItem('c', { registryDependencies: ['d'] });
        const itemA = createMockItem('a', { registryDependencies: ['b', 'c'] });

        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/a.json')) return new Response(JSON.stringify(itemA), { status: 200 });
            if (url.endsWith('/b.json')) return new Response(JSON.stringify(itemB), { status: 200 });
            if (url.endsWith('/c.json')) return new Response(JSON.stringify(itemC), { status: 200 });
            if (url.endsWith('/d.json')) return new Response(JSON.stringify(itemD), { status: 200 });
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const result = await client.resolve(['a']);
        expect(result.items.map(i => i.name)).toEqual(['d', 'b', 'c', 'a']);
    });

    it('deduplicates inflight requests between concurrent fetchItem and resolve', async () => {
        const item = createMockItem('shared-comp');
        let callCount = 0;
        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/shared-comp.json')) {
                callCount++;
                return new Response(JSON.stringify(item), { status: 200 });
            }
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        const [fetched, resolved] = await Promise.all([
            client.fetchItem('shared-comp'),
            client.resolve(['shared-comp']),
        ]);

        expect(fetched.name).toBe('shared-comp');
        expect(resolved.items[0].name).toBe('shared-comp');
        expect(callCount).toBe(1);
    });

    it('fails closed in strict signature mode when manifest fails to fetch', async () => {
        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Server Error', { status: 500 });
            }
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
            requireSignature: true,
        });

        await expect(client.fetchItem('button')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
    });

    it('throws REGISTRY_OFFLINE_UNAVAILABLE in offline mode when listing uncached remote components', async () => {
        const mockFetcher = vi.fn();
        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
            offline: true,
        });

        await expect(client.listComponents()).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
        });
        expect(mockFetcher).not.toHaveBeenCalled();
    });

    it('rejects tampered cached data during integrity validation on cache hit', async () => {
        const item = createMockItem('tampered-comp');
        const mockFetcher = vi.fn(async (url: string) => {
            if (url.endsWith('/tampered-comp.json')) {
                return new Response(JSON.stringify(item), { status: 200 });
            }
            return new Response('Not Found', { status: 404 });
        });

        const client = new RegistryClient({
            sources: ['https://registry.example.com'],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher: mockFetcher,
        });

        // 首次正常拉取并写入缓存
        await client.fetchItem('tampered-comp');

        // 直接篡改缓存中的数据内容
        const cached = await cacheStorage.get<any>('tampered-comp', 'https://registry.example.com');
        expect(cached).toBeDefined();
        cached!.data.files[0].content = '<template>malicious payload</template>';
        await cacheStorage.set('tampered-comp', 'https://registry.example.com', cached!.data);

        // 缓存命中时必须抛出 REGISTRY_INTEGRITY_FAILED
        await expect(client.fetchItem('tampered-comp')).rejects.toMatchObject({
            code: 'REGISTRY_INTEGRITY_FAILED',
        });
    });
});

