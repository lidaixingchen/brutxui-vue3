import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import { RegistryClient } from '../src/lib/registry-client.js';
import { RegistrySourceTracker } from '../src/lib/resilience/source-tracker.js';
import { CacheStorage } from '../src/lib/storage/cache-storage.js';
import type { RegistryItem } from '../src/lib/types.js';

const PRIMARY_SOURCE = 'https://primary.example.com';
const MIRROR_SOURCE = 'https://mirror.example.com';
const REFERENCE_SOURCE = 'https://reference.example.com';
const UNTESTED_SOURCE = 'https://untested.example.com';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;
const HTTP_SERVICE_UNAVAILABLE = 503;
const ZERO_MS = 0;
const CANCELLATION_OBSERVATION_DELAY_MS = 100;

function createItem(name: string): RegistryItem {
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

describe('RegistryClient source health', () => {
    let fs: MemoryFileSystemAdapter;
    let cache: CacheStorage;

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
        cache = new CacheStorage({ fs, cacheDir: '/cache' });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('keeps a slower source healthy when another source wins the hedge', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, 0);
        const item = createItem('winner-cancelled');
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE, MIRROR_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
            httpFetcher: async (url, init) => {
                if (url.endsWith('/registry-manifest.json')) {
                    return new Response('Not Found', { status: 404 });
                }
                if (url.startsWith(PRIMARY_SOURCE)) {
                    return new Promise<Response>((_resolve, reject) => {
                        init?.signal?.addEventListener('abort', () => {
                            const error = new Error('aborted by faster mirror');
                            error.name = 'AbortError';
                            reject(error);
                        }, { once: true });
                    });
                }
                return new Response(JSON.stringify(item), { status: 200 });
            },
        });

        const resultPromise = client.fetchItem(item.name, { useCache: false });
        await vi.advanceTimersToNextTimerAsync();
        await expect(resultPromise).resolves.toMatchObject({ integrity: item.integrity });

        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE, MIRROR_SOURCE])).toEqual([
            MIRROR_SOURCE,
            PRIMARY_SOURCE,
            UNTESTED_SOURCE,
        ]);
    });

    it('keeps a slower source healthy when the default transport aborts the hedge loser', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, 0);
        tracker.recordSuccess(REFERENCE_SOURCE, 0);
        const item = createItem('default-transport-winner-cancelled');
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = String(input);
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND });
            }
            if (url.startsWith(PRIMARY_SOURCE)) {
                return new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        reject(init?.signal?.reason);
                    }, { once: true });
                });
            }
            return new Response(JSON.stringify(item), { status: HTTP_OK });
        });
        vi.stubGlobal('fetch', fetchMock);

        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE, MIRROR_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
        });
        const resultPromise = client.fetchItem(item.name, { useCache: false });
        await vi.advanceTimersToNextTimerAsync();
        await expect(resultPromise).resolves.toMatchObject({ integrity: item.integrity });

        const rankedSources = tracker.rankSources([
            PRIMARY_SOURCE,
            REFERENCE_SOURCE,
            UNTESTED_SOURCE,
            MIRROR_SOURCE,
        ]);
        expect(rankedSources.indexOf(REFERENCE_SOURCE)).toBeLessThan(rankedSources.indexOf(PRIMARY_SOURCE));
        expect(rankedSources.indexOf(MIRROR_SOURCE)).toBeLessThan(rankedSources.indexOf(PRIMARY_SOURCE));
        expect(rankedSources.indexOf(PRIMARY_SOURCE)).toBeLessThan(rankedSources.indexOf(UNTESTED_SOURCE));
    });

    it('keeps source health unchanged when the caller cancels a pending request', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, 0);
        const controller = new AbortController();
        const itemStarted = Promise.withResolvers<void>();
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE, MIRROR_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
            httpFetcher: async (url, init) => {
                if (url.endsWith('/registry-manifest.json')) {
                    return new Response('Not Found', { status: 404 });
                }
                itemStarted.resolve();
                return new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () => {
                        const error = new Error('aborted by caller');
                        error.name = 'AbortError';
                        reject(error);
                    }, { once: true });
                });
            },
        });

        const resultPromise = client.fetchItem('caller-cancelled', {
            signal: controller.signal,
            useCache: false,
        });
        await itemStarted.promise;
        await vi.advanceTimersByTimeAsync(CANCELLATION_OBSERVATION_DELAY_MS);
        controller.abort(new Error('User interrupted'));
        await expect(resultPromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        await vi.advanceTimersByTimeAsync(0);

        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE])).toEqual([
            PRIMARY_SOURCE,
            UNTESTED_SOURCE,
        ]);
    });

    it('keeps source health unchanged when the default transport receives caller cancellation', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, ZERO_MS);
        tracker.recordSuccess(REFERENCE_SOURCE, ZERO_MS);
        const controller = new AbortController();
        const itemStarted = Promise.withResolvers<void>();
        const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const url = String(input);
            if (url.endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND });
            }
            itemStarted.resolve();
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(init?.signal?.reason);
                }, { once: true });
            });
        });
        vi.stubGlobal('fetch', fetchMock);
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE, MIRROR_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
        });

        const resultPromise = client.fetchItem('default-transport-caller-cancelled', {
            signal: controller.signal,
            useCache: false,
        });
        await itemStarted.promise;
        await vi.advanceTimersByTimeAsync(CANCELLATION_OBSERVATION_DELAY_MS);
        controller.abort(new Error('User interrupted'));
        await expect(resultPromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });
        await vi.advanceTimersByTimeAsync(ZERO_MS);

        expect(tracker.rankSources([PRIMARY_SOURCE, REFERENCE_SOURCE])).toEqual([
            PRIMARY_SOURCE,
            REFERENCE_SOURCE,
        ]);
    });

    it('keeps source health unchanged when the default transport sees a pre-aborted request', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, ZERO_MS);
        const controller = new AbortController();
        controller.abort(new Error('User interrupted'));
        const fetchMock = vi.fn(async (): Promise<Response> => new Response('Not Found', {
            status: HTTP_NOT_FOUND,
        }));
        vi.stubGlobal('fetch', fetchMock);
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
        });

        await expect(client.fetchItem('pre-aborted', {
            signal: controller.signal,
            useCache: false,
        })).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE])).toEqual([
            PRIMARY_SOURCE,
            UNTESTED_SOURCE,
        ]);
    });

    it('keeps source health unchanged when the caller aborts during retry backoff', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, ZERO_MS);
        const controller = new AbortController();
        const requestStarted = Promise.withResolvers<void>();
        const responseGate = Promise.withResolvers<Response>();
        const fetchMock = vi.fn(async (): Promise<Response> => {
            requestStarted.resolve();
            return responseGate.promise;
        });
        vi.stubGlobal('fetch', fetchMock);
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
        });
        const resultPromise = client.fetchItem('backoff-cancelled', {
            signal: controller.signal,
            useCache: false,
        });

        await requestStarted.promise;
        responseGate.resolve(new Response('Unavailable', { status: HTTP_SERVICE_UNAVAILABLE }));
        await Promise.resolve();
        await Promise.resolve();
        controller.abort(new Error('User interrupted'));
        await expect(resultPromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });

        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE])).toEqual([
            PRIMARY_SOURCE,
            UNTESTED_SOURCE,
        ]);
    });

    it('records a network failure when it settles after the caller aborts', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, ZERO_MS);
        const controller = new AbortController();
        const itemRequestStarted = Promise.withResolvers<void>();
        const networkFailure = Promise.withResolvers<Response>();
        const fetchMock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
            if (String(input).endsWith('/registry-manifest.json')) {
                return new Response('Not Found', { status: HTTP_NOT_FOUND });
            }
            itemRequestStarted.resolve();
            return networkFailure.promise;
        });
        vi.stubGlobal('fetch', fetchMock);
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
        });
        const resultPromise = client.fetchItem('network-error-after-cancel', {
            signal: controller.signal,
            useCache: false,
        });

        await itemRequestStarted.promise;
        controller.abort(new Error('User interrupted'));
        networkFailure.reject(new TypeError('network unavailable'));
        await expect(resultPromise).rejects.toMatchObject({ code: 'REGISTRY_FETCH_FAILED' });

        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE])).toEqual([
            UNTESTED_SOURCE,
            PRIMARY_SOURCE,
        ]);
    });

    it('still degrades a source after a real network failure', async () => {
        const tracker = new RegistrySourceTracker();
        tracker.recordSuccess(PRIMARY_SOURCE, 0);
        const item = createItem('network-failure');
        const client = new RegistryClient({
            sources: [PRIMARY_SOURCE, MIRROR_SOURCE],
            fsAdapter: fs,
            cacheStorage: cache,
            tracker,
            httpFetcher: async (url) => {
                if (url.endsWith('/registry-manifest.json')) {
                    return new Response('Not Found', { status: 404 });
                }
                if (url.startsWith(PRIMARY_SOURCE)) throw new TypeError('network unavailable');
                return new Response(JSON.stringify(item), { status: 200 });
            },
        });

        await expect(client.fetchItem(item.name, { useCache: false })).resolves.toMatchObject({
            integrity: item.integrity,
        });

        expect(tracker.rankSources([PRIMARY_SOURCE, UNTESTED_SOURCE, MIRROR_SOURCE])).toEqual([
            MIRROR_SOURCE,
            UNTESTED_SOURCE,
            PRIMARY_SOURCE,
        ]);
    });
});
