import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import { RegistryClient } from '../src/lib/registry-client.js';
import type { HttpFetcher, ResolvedComponentPlan } from '../src/lib/registry-types.js';
import { CacheStorage } from '../src/lib/storage/cache-storage.js';
import type { RegistryItem } from '../src/lib/types.js';

const REGISTRY_URL: string = 'https://registry.example.com';
const CACHE_ENTRY_LIMIT: number = 100;
const CACHE_BYTE_LIMIT: number = 10_485_760;
const CACHE_TTL_MS: number = 3_600_000;
const RESOLUTION_HANG_GUARD_MS: number = 8_000;
const EXPECTED_SINGLE_REQUEST_COUNT: number = 1;
const EXPECTED_CONCURRENT_BRANCHES: number = 2;
const HTTP_OK_STATUS: number = 200;
const HTTP_NOT_FOUND_STATUS: number = 404;

function createRegistryItem(name: string, registryDependencies: readonly string[] = []): RegistryItem {
    const item: Omit<RegistryItem, 'integrity'> = {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        dependencies: [],
        registryDependencies: [...registryDependencies],
        files: [{
            path: `components/ui/${name}/${name}.vue`,
            content: `<template>${name}</template>`,
            type: 'registry:ui',
        }],
        tailwind: {},
        cssVars: {},
    };
    return { ...item, integrity: computeRegistryIntegrity(item.files) };
}

function createJsonResponse(item: RegistryItem): Response {
    return new Response(JSON.stringify(item), { status: HTTP_OK_STATUS });
}

describe('RegistryClient dependency graph resolution', (): void => {
    let memoryFs: MemoryFileSystemAdapter;
    let cacheStorage: CacheStorage;

    beforeEach((): void => {
        memoryFs = new MemoryFileSystemAdapter();
        cacheStorage = new CacheStorage({
            fs: memoryFs,
            cacheDir: '/cache',
            maxEntries: CACHE_ENTRY_LIMIT,
            maxBytes: CACHE_BYTE_LIMIT,
            defaultTtl: CACHE_TTL_MS,
            disabled: false,
            offline: false,
        });
    });

    function createClient(
        httpFetcher: HttpFetcher,
        sources: readonly string[] = [REGISTRY_URL],
    ): RegistryClient {
        return new RegistryClient({
            sources,
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher,
        });
    }

    it('rejects cross-branch dependency cycles without waiting on sibling subtrees', async (): Promise<void> => {
        const itemA: RegistryItem = createRegistryItem('a', ['b', 'c']);
        const itemB: RegistryItem = createRegistryItem('b', ['c']);
        const itemC: RegistryItem = createRegistryItem('c', ['b']);
        const items: readonly RegistryItem[] = [itemA, itemB, itemC];
        const requestCounts: Map<string, number> = new Map();
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            const item: RegistryItem | undefined = items.find(
                (candidate: RegistryItem): boolean => url.endsWith(`/${candidate.name}.json`),
            );
            if (!item) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            requestCounts.set(item.name, (requestCounts.get(item.name) ?? 0) + 1);
            return createJsonResponse(item);
        };
        const client: RegistryClient = createClient(httpFetcher);

        await expect(client.resolve(['a'])).rejects.toMatchObject({
            code: 'INVALID_REGISTRY',
            message: expect.stringContaining('Circular dependency detected'),
        });
        expect(requestCounts).toEqual(new Map([
            ['a', EXPECTED_SINGLE_REQUEST_COUNT],
            ['b', EXPECTED_SINGLE_REQUEST_COUNT],
            ['c', EXPECTED_SINGLE_REQUEST_COUNT],
        ]));
    }, RESOLUTION_HANG_GUARD_MS);

    it('reports a simple dependency cycle', async (): Promise<void> => {
        const itemA: RegistryItem = createRegistryItem('cycle-a', ['cycle-b']);
        const itemB: RegistryItem = createRegistryItem('cycle-b', ['cycle-a']);
        const items: readonly RegistryItem[] = [itemA, itemB];
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            const item: RegistryItem | undefined = items.find(
                (candidate: RegistryItem): boolean => url.endsWith(`/${candidate.name}.json`),
            );
            return item ? createJsonResponse(item) : new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
        };
        const client: RegistryClient = createClient(httpFetcher);

        await expect(client.resolve(['cycle-a'])).rejects.toMatchObject({
            code: 'INVALID_REGISTRY',
            message: expect.stringContaining('cycle-a -> cycle-b -> cycle-a'),
        });
    }, RESOLUTION_HANG_GUARD_MS);

    it('loads a shared diamond dependency once and returns dependencies first', async (): Promise<void> => {
        const itemA: RegistryItem = createRegistryItem('diamond-a', ['diamond-b', 'diamond-c']);
        const itemB: RegistryItem = createRegistryItem('diamond-b', ['diamond-d']);
        const itemC: RegistryItem = createRegistryItem('diamond-c', ['diamond-d']);
        const itemD: RegistryItem = createRegistryItem('diamond-d');
        const items: readonly RegistryItem[] = [itemA, itemB, itemC, itemD];
        const requestCounts: Map<string, number> = new Map();
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            const item: RegistryItem | undefined = items.find(
                (candidate: RegistryItem): boolean => url.endsWith(`/${candidate.name}.json`),
            );
            if (!item) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            requestCounts.set(item.name, (requestCounts.get(item.name) ?? 0) + 1);
            return createJsonResponse(item);
        };
        const client: RegistryClient = createClient(httpFetcher);

        const result: ResolvedComponentPlan = await client.resolve(['diamond-a']);

        expect(result.items.map((item: RegistryItem): string => item.name)).toEqual([
            'diamond-d',
            'diamond-b',
            'diamond-c',
            'diamond-a',
        ]);
        expect(requestCounts).toEqual(new Map([
            ['diamond-a', EXPECTED_SINGLE_REQUEST_COUNT],
            ['diamond-b', EXPECTED_SINGLE_REQUEST_COUNT],
            ['diamond-c', EXPECTED_SINGLE_REQUEST_COUNT],
            ['diamond-d', EXPECTED_SINGLE_REQUEST_COUNT],
        ]));
        expect(result.hitSources.get('diamond-a')).toBe(REGISTRY_URL);
    }, RESOLUTION_HANG_GUARD_MS);

    it('inherits the winning source and resolves dependency version specifiers', async (): Promise<void> => {
        const baseSource: string = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const versionedSource: string = 'https://raw.githubusercontent.com/org/repo/v2.0.0/registry';
        const itemRoot: RegistryItem = createRegistryItem('versioned-root', ['versioned-dep@2.0.0']);
        const itemDependency: RegistryItem = createRegistryItem('versioned-dep');
        const requestedUrls: string[] = [];
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            requestedUrls.push(url);
            if (url.endsWith('/versioned-root.json')) {
                return createJsonResponse(itemRoot);
            }
            if (url.endsWith('/versioned-dep.json')) {
                return createJsonResponse(itemDependency);
            }
            return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
        };
        const client: RegistryClient = createClient(httpFetcher, [baseSource]);

        const result: ResolvedComponentPlan = await client.resolve(['versioned-root']);

        expect(requestedUrls).toContain(`${baseSource}/versioned-root.json`);
        expect(requestedUrls).toContain(`${versionedSource}/versioned-dep.json`);
        expect(result.hitSources.get('versioned-dep')).toBe(versionedSource);
    }, RESOLUTION_HANG_GUARD_MS);

    it('loads independent dependency branches concurrently', async (): Promise<void> => {
        const itemA: RegistryItem = createRegistryItem('parallel-a', ['parallel-b', 'parallel-c']);
        const itemB: RegistryItem = createRegistryItem('parallel-b');
        const itemC: RegistryItem = createRegistryItem('parallel-c');
        const items: readonly RegistryItem[] = [itemA, itemB, itemC];
        const branchNames: Set<string> = new Set();
        let releaseBranches: (() => void) | undefined;
        const branchesReady: Promise<void> = new Promise<void>((resolve: () => void): void => {
            releaseBranches = resolve;
        });
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            const item: RegistryItem | undefined = items.find(
                (candidate: RegistryItem): boolean => url.endsWith(`/${candidate.name}.json`),
            );
            if (!item) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            if (item.name === itemB.name || item.name === itemC.name) {
                branchNames.add(item.name);
                if (branchNames.size === EXPECTED_CONCURRENT_BRANCHES) {
                    releaseBranches?.();
                }
                await branchesReady;
            }
            return createJsonResponse(item);
        };
        const client: RegistryClient = createClient(httpFetcher);

        const result: ResolvedComponentPlan = await client.resolve(['parallel-a']);

        expect(branchNames).toEqual(new Set(['parallel-b', 'parallel-c']));
        expect(result.items.map((item: RegistryItem): string => item.name)).toEqual([
            'parallel-b',
            'parallel-c',
            'parallel-a',
        ]);
    }, RESOLUTION_HANG_GUARD_MS);
});
