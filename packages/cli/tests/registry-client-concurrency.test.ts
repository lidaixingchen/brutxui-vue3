import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { computeRegistryIntegrity, computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import { RegistryClient } from '../src/lib/registry-client.js';
import type { HttpFetcher } from '../src/lib/registry-types.js';
import { CacheStorage } from '../src/lib/storage/cache-storage.js';
import type { RegistryItem, RegistrySnapshot } from '../src/lib/types.js';

const REGISTRY_URL: string = 'https://registry.example.com';
const CACHE_ENTRY_LIMIT: number = 100;
const CACHE_BYTE_LIMIT: number = 10_485_760;
const CACHE_TTL_MS: number = 3_600_000;
const CONCURRENCY_HANG_GUARD_MS: number = 8_000;
const EXPECTED_CONCURRENT_REQUESTS: number = 2;
const FIRST_ITEM_REQUEST: number = 1;
const REGISTRY_SCHEMA_VERSION: number = 1;
const HTTP_OK_STATUS: number = 200;
const HTTP_NOT_FOUND_STATUS: number = 404;
const HTTP_SERVER_ERROR_STATUS: number = 500;
const INITIAL_REGISTRY_VERSION: string = '1.0.0';
const UPDATED_REGISTRY_VERSION: string = '2.0.0';

interface Deferred<T> {
    readonly promise: Promise<T>;
    resolve(value: T): void;
}

interface PendingResponse {
    readonly signal: AbortSignal | null;
    readonly deferred: Deferred<Response>;
}

function createDeferred<T>(): Deferred<T> {
    let resolveDeferred: (value: T) => void = (_value: T): void => undefined;
    const promise: Promise<T> = new Promise<T>((resolve: (value: T | PromiseLike<T>) => void): void => {
        resolveDeferred = (value: T): void => resolve(value);
    });
    return { promise, resolve: resolveDeferred };
}

function waitForSignal<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        return Promise.reject(new Error('Request aborted'));
    }

    return new Promise<T>(
        (
            resolve: (value: T | PromiseLike<T>) => void,
            reject: (reason?: unknown) => void,
        ): void => {
            const onAbort: () => void = (): void => {
                signal.removeEventListener('abort', onAbort);
                reject(new Error('Request aborted'));
            };
            signal.addEventListener('abort', onAbort, { once: true });
            void promise.then(
                (value: T): void => {
                    signal.removeEventListener('abort', onAbort);
                    resolve(value);
                },
                (error: unknown): void => {
                    signal.removeEventListener('abort', onAbort);
                    reject(error);
                },
            );
        },
    );
}

function createRegistryItem(name: string): RegistryItem {
    const item: Omit<RegistryItem, 'integrity'> = {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        dependencies: [],
        registryDependencies: [],
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

function createManifestResponse(registryVersion: string = INITIAL_REGISTRY_VERSION): Response {
    const manifest: {
        name: string;
        schemaVersion: number;
        registryVersion: string;
        items: Record<string, { integrity?: string }>;
    } = {
        name: 'brutx-registry',
        schemaVersion: REGISTRY_SCHEMA_VERSION,
        registryVersion,
        items: {},
    };
    const integrity: string = computeRegistryManifestIntegrity(manifest);
    return new Response(JSON.stringify({ ...manifest, integrity }), { status: HTTP_OK_STATUS });
}

describe('RegistryClient request concurrency', (): void => {
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

    function createClient(httpFetcher: HttpFetcher): RegistryClient {
        return new RegistryClient({
            sources: [REGISTRY_URL],
            fsAdapter: memoryFs,
            cacheStorage,
            httpFetcher,
        });
    }

    it('isolates item requests that carry different abort signals', async (): Promise<void> => {
        const item: RegistryItem = createRegistryItem('signal-item');
        const pendingItemResponses: PendingResponse[] = [];
        const httpFetcher: HttpFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            if (!url.endsWith('/signal-item.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            const deferred: Deferred<Response> = createDeferred<Response>();
            const signal: AbortSignal | null = init?.signal ?? null;
            pendingItemResponses.push({ signal, deferred });
            return waitForSignal(deferred.promise, signal);
        };
        const client: RegistryClient = createClient(httpFetcher);
        const firstController: AbortController = new AbortController();
        const secondController: AbortController = new AbortController();
        const firstRequest: Promise<RegistryItem> = client.fetchItem('signal-item', {
            signal: firstController.signal,
        });
        const secondRequest: Promise<RegistryItem> = client.fetchItem('signal-item', {
            signal: secondController.signal,
        });

        await vi.waitFor(
            (): void => {
                expect(pendingItemResponses).toHaveLength(EXPECTED_CONCURRENT_REQUESTS);
            },
            { timeout: CONCURRENCY_HANG_GUARD_MS },
        );
        firstController.abort();
        await expect(firstRequest).rejects.toThrow('Request aborted');
        const secondPendingItem: PendingResponse | undefined = pendingItemResponses.find(
            (request: PendingResponse): boolean => request.signal === secondController.signal,
        );
        expect(secondPendingItem).toBeDefined();
        secondPendingItem!.deferred.resolve(new Response(JSON.stringify(item), { status: HTTP_OK_STATUS }));

        await expect(secondRequest).resolves.toMatchObject({ name: 'signal-item' });
        expect(pendingItemResponses.map((request: PendingResponse): AbortSignal | null => request.signal)).toEqual([
            firstController.signal,
            secondController.signal,
        ]);
    }, CONCURRENCY_HANG_GUARD_MS);

    it('keeps manifest requests with separate abort signals independent while pending', async (): Promise<void> => {
        const pendingManifests: PendingResponse[] = [];
        const httpFetcher: HttpFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
            if (!url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            const deferred: Deferred<Response> = createDeferred<Response>();
            const signal: AbortSignal | null = init?.signal ?? null;
            pendingManifests.push({ signal, deferred });
            return waitForSignal(deferred.promise, signal);
        };
        const client: RegistryClient = createClient(httpFetcher);
        const firstController: AbortController = new AbortController();
        const secondController: AbortController = new AbortController();
        const firstRequest: Promise<RegistrySnapshot | null> = client.getSnapshot(REGISTRY_URL, firstController.signal);
        const secondRequest: Promise<RegistrySnapshot | null> = client.getSnapshot(REGISTRY_URL, secondController.signal);

        await vi.waitFor(
            (): void => {
                expect(pendingManifests).toHaveLength(EXPECTED_CONCURRENT_REQUESTS);
            },
            { timeout: CONCURRENCY_HANG_GUARD_MS },
        );
        firstController.abort();
        await expect(firstRequest).rejects.toThrow('Request aborted');
        const secondPendingManifest: PendingResponse | undefined = pendingManifests.find(
            (request: PendingResponse): boolean => request.signal === secondController.signal,
        );
        expect(secondPendingManifest).toBeDefined();
        secondPendingManifest!.deferred.resolve(createManifestResponse());

        await expect(secondRequest).resolves.toMatchObject({ registryVersion: '1.0.0' });
        await expect(client.getSnapshot(REGISTRY_URL)).resolves.toMatchObject({ registryVersion: '1.0.0' });
        expect(pendingManifests).toHaveLength(2);
    }, CONCURRENCY_HANG_GUARD_MS);

    it.each([true, false])('freezes the first manifest snapshot when the first request uses a signal: %s', async (firstUsesSignal: boolean): Promise<void> => {
        const pendingManifests: PendingResponse[] = [];
        const httpFetcher: HttpFetcher = async (_url: string, init?: RequestInit): Promise<Response> => {
            const deferred: Deferred<Response> = createDeferred<Response>();
            const signal: AbortSignal | null = init?.signal ?? null;
            pendingManifests.push({ signal, deferred });
            return waitForSignal(deferred.promise, signal);
        };
        const client: RegistryClient = createClient(httpFetcher);
        const controller: AbortController = new AbortController();
        const firstSignal: AbortSignal | undefined = firstUsesSignal ? controller.signal : undefined;
        const secondSignal: AbortSignal | undefined = firstUsesSignal ? undefined : controller.signal;
        const firstRequest: Promise<RegistrySnapshot | null> = client.getSnapshot(REGISTRY_URL, firstSignal);
        const secondRequest: Promise<RegistrySnapshot | null> = client.getSnapshot(REGISTRY_URL, secondSignal);

        await vi.waitFor((): void => {
            expect(pendingManifests).toHaveLength(EXPECTED_CONCURRENT_REQUESTS);
        });
        const firstResponse: PendingResponse = pendingManifests.find(
            (request: PendingResponse): boolean => request.signal === (firstSignal ?? null),
        )!;
        const secondResponse: PendingResponse = pendingManifests.find(
            (request: PendingResponse): boolean => request.signal === (secondSignal ?? null),
        )!;
        firstResponse.deferred.resolve(createManifestResponse(INITIAL_REGISTRY_VERSION));
        await expect(firstRequest).resolves.toMatchObject({ registryVersion: INITIAL_REGISTRY_VERSION });
        secondResponse.deferred.resolve(createManifestResponse(UPDATED_REGISTRY_VERSION));

        await expect(secondRequest).resolves.toMatchObject({ registryVersion: INITIAL_REGISTRY_VERSION });
        await expect(client.getSnapshot(REGISTRY_URL)).resolves.toMatchObject({ registryVersion: INITIAL_REGISTRY_VERSION });
    });

    it('returns cached and remote data according to each concurrent cache policy', async (): Promise<void> => {
        const cachedItem: RegistryItem = createRegistryItem('cache-hit-item');
        const remoteItem: RegistryItem = { ...cachedItem, description: 'Remote component' };
        await cacheStorage.set(cachedItem.name, REGISTRY_URL, cachedItem);
        let itemRequestCount: number = 0;
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            itemRequestCount += 1;
            return new Response(JSON.stringify(remoteItem), { status: HTTP_OK_STATUS });
        };
        const client: RegistryClient = createClient(httpFetcher);
        const cachedRequest: Promise<RegistryItem> = client.fetchItem(cachedItem.name, { useCache: true });
        const remoteRequest: Promise<RegistryItem> = client.fetchItem(cachedItem.name, { useCache: false });

        await expect(cachedRequest).resolves.toMatchObject({ description: cachedItem.description });
        await expect(remoteRequest).resolves.toMatchObject({ description: remoteItem.description });
        expect(itemRequestCount).toBe(FIRST_ITEM_REQUEST);
    });

    it('does not share in-flight item requests that use different cache policies', async (): Promise<void> => {
        const item: RegistryItem = createRegistryItem('cache-policy-item');
        const pendingItemResponses: Deferred<Response>[] = [];
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            if (!url.endsWith('/cache-policy-item.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            const deferred: Deferred<Response> = createDeferred<Response>();
            pendingItemResponses.push(deferred);
            return deferred.promise;
        };
        const client: RegistryClient = createClient(httpFetcher);
        const cacheEnabledRequest: Promise<RegistryItem> = client.fetchItem('cache-policy-item', { useCache: true });
        const cacheDisabledRequest: Promise<RegistryItem> = client.fetchItem('cache-policy-item', { useCache: false });

        await vi.waitFor(
            (): void => {
                expect(pendingItemResponses).toHaveLength(EXPECTED_CONCURRENT_REQUESTS);
            },
            { timeout: CONCURRENCY_HANG_GUARD_MS },
        );
        pendingItemResponses.forEach((pendingResponse: Deferred<Response>): void => {
            pendingResponse.resolve(new Response(JSON.stringify(item), { status: HTTP_OK_STATUS }));
        });

        await expect(Promise.all([cacheEnabledRequest, cacheDisabledRequest])).resolves.toHaveLength(2);
    }, CONCURRENCY_HANG_GUARD_MS);

    it('deduplicates matching requests and clears failed in-flight entries', async (): Promise<void> => {
        const item: RegistryItem = createRegistryItem('retry-item');
        let itemRequestCount: number = 0;
        const httpFetcher: HttpFetcher = async (url: string): Promise<Response> => {
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            if (!url.endsWith('/retry-item.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND_STATUS });
            }
            itemRequestCount += 1;
            if (itemRequestCount === FIRST_ITEM_REQUEST) {
                return new Response('Server Error', { status: HTTP_SERVER_ERROR_STATUS });
            }
            return new Response(JSON.stringify(item), { status: HTTP_OK_STATUS });
        };
        const client: RegistryClient = createClient(httpFetcher);
        const firstRequest: Promise<RegistryItem> = client.fetchItem('retry-item');
        const secondRequest: Promise<RegistryItem> = client.fetchItem('retry-item');

        await expect(Promise.all([firstRequest, secondRequest])).rejects.toMatchObject({
            code: 'REGISTRY_FETCH_FAILED',
        });
        await expect(client.fetchItem('retry-item')).resolves.toMatchObject({ name: 'retry-item' });
        expect(itemRequestCount).toBe(2);
    });
});
