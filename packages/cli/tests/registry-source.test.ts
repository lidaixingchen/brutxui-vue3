import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    resolveRegistrySources,
    isOfflineRequested,
    buildAuthHeaders,
    fetchWithSources,
    withOfflineScope,
} from '../src/lib/registry-source.js';
import { DEFAULT_REGISTRY_URL } from '../src/lib/constants.js';
import { CliError } from '../src/lib/error.js';
import type { BrutalistConfig } from '../src/lib/types.js';

function makeConfig(overrides: Partial<BrutalistConfig> = {}): BrutalistConfig {
    return {
        $schema: 'https://example.com/schema.json',
        $version: 1,
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: '@/styles/globals.css' },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
        ...overrides,
    };
}

const ENV_KEYS = ['BRUTX_OFFLINE', 'BRUTX_REGISTRY_TOKEN', 'BRUTX_REGISTRY_HEADERS'] as const;

describe('resolveRegistrySources (P1-5)', () => {
    it('returns only override when provided, ignoring config and default', () => {
        const config = makeConfig({ registries: ['https://config.example.com'] });
        expect(resolveRegistrySources(config, 'https://override.example.com')).toEqual([
            'https://override.example.com',
        ]);
    });

    it('returns config.registries when override is absent and registries is non-empty', () => {
        const config = makeConfig({
            registries: ['https://primary.example.com', 'https://mirror.example.com'],
        });
        expect(resolveRegistrySources(config)).toEqual([
            'https://primary.example.com',
            'https://mirror.example.com',
        ]);
    });

    it('falls back to DEFAULT_REGISTRY_URL when override and registries are both absent', () => {
        const config = makeConfig();
        expect(resolveRegistrySources(config)).toEqual([DEFAULT_REGISTRY_URL]);
    });

    it('falls back to DEFAULT_REGISTRY_URL when config is null', () => {
        expect(resolveRegistrySources(null)).toEqual([DEFAULT_REGISTRY_URL]);
    });

    it('filters out empty strings and non-strings from config.registries', () => {
        const config = makeConfig({
            // @ts-expect-error: deliberately malformed entries for filtering test
            registries: ['', 'https://valid.example.com', null, undefined],
        });
        expect(resolveRegistrySources(config)).toEqual(['https://valid.example.com']);
    });

    it('falls back to default when all registries entries are empty strings', () => {
        const config = makeConfig({ registries: ['', '', ''] });
        expect(resolveRegistrySources(config)).toEqual([DEFAULT_REGISTRY_URL]);
    });
});

describe('isOfflineRequested (P1-5)', () => {
    beforeEach(() => {
        delete process.env.BRUTX_OFFLINE;
    });

    afterEach(() => {
        delete process.env.BRUTX_OFFLINE;
    });

    it('returns true when --offline flag is true', () => {
        expect(isOfflineRequested(true)).toBe(true);
    });

    it('returns false when --offline flag is false and env var is unset', () => {
        expect(isOfflineRequested(false)).toBe(false);
    });

    it('returns true when BRUTX_OFFLINE=1 is set, regardless of flag', () => {
        process.env.BRUTX_OFFLINE = '1';
        expect(isOfflineRequested(false)).toBe(true);
        expect(isOfflineRequested(undefined)).toBe(true);
    });

    it('returns false when BRUTX_OFFLINE is set to a non-1 value', () => {
        process.env.BRUTX_OFFLINE = '0';
        expect(isOfflineRequested(false)).toBe(false);
    });
});

describe('buildAuthHeaders (P1-5)', () => {
    beforeEach(() => {
        delete process.env.BRUTX_REGISTRY_TOKEN;
        delete process.env.BRUTX_REGISTRY_HEADERS;
    });

    afterEach(() => {
        delete process.env.BRUTX_REGISTRY_TOKEN;
        delete process.env.BRUTX_REGISTRY_HEADERS;
    });

    it('returns empty object for non-http(s) sources (local path)', () => {
        expect(buildAuthHeaders('/tmp/registry')).toEqual({});
        expect(buildAuthHeaders('./registry')).toEqual({});
    });

    it('returns empty object for https source when no token or headers env set', () => {
        expect(buildAuthHeaders('https://public.example.com')).toEqual({});
    });

    it('injects Bearer token from BRUTX_REGISTRY_TOKEN for https source', () => {
        process.env.BRUTX_REGISTRY_TOKEN = 'secret-token-123';
        expect(buildAuthHeaders('https://private.example.com')).toEqual({
            Authorization: 'Bearer secret-token-123',
        });
    });

    it('injects Bearer token for http source as well', () => {
        process.env.BRUTX_REGISTRY_TOKEN = 'tok';
        expect(buildAuthHeaders('http://insecure.example.com')).toEqual({
            Authorization: 'Bearer tok',
        });
    });

    it('uses BRUTX_REGISTRY_HEADERS JSON object when valid, overriding token', () => {
        process.env.BRUTX_REGISTRY_TOKEN = 'should-be-ignored';
        process.env.BRUTX_REGISTRY_HEADERS = JSON.stringify({
            Authorization: 'Basic abc==',
            'X-Custom-Header': 'value',
        });
        expect(buildAuthHeaders('https://private.example.com')).toEqual({
            Authorization: 'Basic abc==',
            'X-Custom-Header': 'value',
        });
    });

    it('falls back to token when BRUTX_REGISTRY_HEADERS is not valid JSON', () => {
        process.env.BRUTX_REGISTRY_TOKEN = 'fallback-tok';
        process.env.BRUTX_REGISTRY_HEADERS = '{invalid json';
        expect(buildAuthHeaders('https://private.example.com')).toEqual({
            Authorization: 'Bearer fallback-tok',
        });
    });

    it('falls back to token when BRUTX_REGISTRY_HEADERS is valid JSON but not an object', () => {
        process.env.BRUTX_REGISTRY_TOKEN = 'fallback-tok';
        process.env.BRUTX_REGISTRY_HEADERS = JSON.stringify(['not', 'an', 'object']);
        expect(buildAuthHeaders('https://private.example.com')).toEqual({
            Authorization: 'Bearer fallback-tok',
        });
    });

    it('returns empty when BRUTX_REGISTRY_HEADERS is a JSON primitive (e.g. number)', () => {
        process.env.BRUTX_REGISTRY_HEADERS = '42';
        expect(buildAuthHeaders('https://private.example.com')).toEqual({});
    });
});

describe('fetchWithSources (P1-5)', () => {
    beforeEach(() => {
        delete process.env.BRUTX_OFFLINE;
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete process.env.BRUTX_OFFLINE;
    });

    it('throws REGISTRY_FETCH_FAILED when sources array is empty', async () => {
        await expect(fetchWithSources([], async () => 'x')).rejects.toMatchObject({
            code: 'REGISTRY_FETCH_FAILED',
        });
    });

    it('returns first source result when fetcher succeeds on first try', async () => {
        const fetcher = vi.fn(async (source: string) => `data-from-${source}`);
        const result = await fetchWithSources(
            ['https://a.example.com', 'https://b.example.com'],
            fetcher,
        );
        expect(result).toEqual({
            result: 'data-from-https://a.example.com',
            source: 'https://a.example.com',
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('falls back to next source when first fails (online mode)', async () => {
        const fetcher = vi.fn(async (source: string) => {
            if (source === 'https://a.example.com') {
                throw new Error('network down');
            }
            return `data-from-${source}`;
        });
        const result = await fetchWithSources(
            ['https://a.example.com', 'https://b.example.com'],
            fetcher,
        );
        expect(result.source).toBe('https://b.example.com');
        expect(result.result).toBe('data-from-https://b.example.com');
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('aggregates failures into REGISTRY_FETCH_FAILED when all sources fail', async () => {
        const fetcher = vi.fn(async () => {
            throw new Error('always fails');
        });
        await expect(
            fetchWithSources(['https://a.example.com', 'https://b.example.com'], fetcher),
        ).rejects.toMatchObject({
            code: 'REGISTRY_FETCH_FAILED',
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('bubbles REGISTRY_OFFLINE_UNAVAILABLE immediately in offline mode', async () => {
        const fetcher = vi.fn(async () => {
            throw new CliError('offline miss', { code: 'REGISTRY_OFFLINE_UNAVAILABLE' });
        });
        await expect(
            fetchWithSources(
                ['https://a.example.com', 'https://b.example.com'],
                fetcher,
                { offline: true },
            ),
        ).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
        });
        // 应当在第一个源抛错后立即冒泡，不尝试后续源
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('throws REGISTRY_OFFLINE_UNAVAILABLE when all sources fail in offline mode', async () => {
        const fetcher = vi.fn(async () => {
            throw new Error('not in cache');
        });
        await expect(
            fetchWithSources(
                ['https://a.example.com', 'https://b.example.com'],
                fetcher,
                { offline: true },
            ),
        ).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('preserves first CliError as cause when all sources fail in offline mode', async () => {
        const firstCliError = new CliError('cache miss for primary', {
            code: 'REGISTRY_FETCH_FAILED',
        });
        const fetcher = vi.fn(async (source: string) => {
            if (source === 'https://a.example.com') throw firstCliError;
            throw new Error('generic failure');
        });
        await expect(
            fetchWithSources(
                ['https://a.example.com', 'https://b.example.com'],
                fetcher,
                { offline: true },
            ),
        ).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
            cause: firstCliError,
        });
    });

    it('keeps cause null when offline failures are non-CliError', async () => {
        const fetcher = vi.fn(async () => {
            throw new Error('not in cache');
        });
        await expect(
            fetchWithSources(
                ['https://a.example.com', 'https://b.example.com'],
                fetcher,
                { offline: true },
            ),
        ).rejects.toMatchObject({
            code: 'REGISTRY_OFFLINE_UNAVAILABLE',
            cause: null,
        });
    });

    it('returns first cached source in offline mode when fetcher succeeds', async () => {
        const fetcher = vi.fn(async (source: string) => `cached-${source}`);
        const result = await fetchWithSources(
            ['https://a.example.com', 'https://b.example.com'],
            fetcher,
            { offline: true },
        );
        expect(result).toEqual({
            result: 'cached-https://a.example.com',
            source: 'https://a.example.com',
        });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
});

describe('withOfflineScope (P1-5)', () => {
    afterEach(() => {
        delete process.env.BRUTX_OFFLINE;
    });

    it('sets BRUTX_OFFLINE=1 when offline=true and restores on callback', () => {
        delete process.env.BRUTX_OFFLINE;
        const restore = withOfflineScope(true);
        expect(process.env.BRUTX_OFFLINE).toBe('1');
        restore();
        expect(process.env.BRUTX_OFFLINE).toBeUndefined();
    });

    it('does nothing when offline=false', () => {
        delete process.env.BRUTX_OFFLINE;
        const restore = withOfflineScope(false);
        expect(process.env.BRUTX_OFFLINE).toBeUndefined();
        restore();
        expect(process.env.BRUTX_OFFLINE).toBeUndefined();
    });

    it('restores previous value when BRUTX_OFFLINE was already set', () => {
        process.env.BRUTX_OFFLINE = 'previous';
        const restore = withOfflineScope(true);
        expect(process.env.BRUTX_OFFLINE).toBe('1');
        restore();
        expect(process.env.BRUTX_OFFLINE).toBe('previous');
    });

    it('no-op restore function when offline=false can be called safely', () => {
        const restore = withOfflineScope(false);
        expect(() => restore()).not.toThrow();
    });
});
