import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { integrityRegistryReachabilityRule } from '../../src/lib/diagnostics/rules/integrity-rules.js';
import { fetchWithSources } from '../../src/lib/registry-source.js';
import { logger } from '../../src/lib/logger.js';
import type { DiagnosticContext } from '../../src/lib/diagnostics/types.js';
import type { BrutalistConfig } from '../../src/lib/types.js';

function makeMockConfig(overrides: Partial<BrutalistConfig> = {}): BrutalistConfig {
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
        registries: ['https://mirror-a.com', 'https://mirror-b.com'],
        ...overrides,
    };
}

describe('integrityRegistryReachabilityRule (Ticket 4)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('skips network probing when offline mode is active', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);

        const ctx: DiagnosticContext = {
            cwd: '/fake/cwd',
            config: makeMockConfig(),
            projectContext: {} as any,
            installedComponents: [],
            fs: {} as any,
            offline: true,
        };

        const results = await integrityRegistryReachabilityRule.check(ctx);
        const checks = Array.isArray(results) ? results : [results];

        expect(checks).toHaveLength(2);
        for (const check of checks) {
            expect(check.status).toBe('pass');
            expect(check.message).toContain('offline mode');
        }
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('reports pass when remote registry is reachable', async () => {
        const mockResponse = { ok: true, status: 200, statusText: 'OK' } as unknown as Response;
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const ctx: DiagnosticContext = {
            cwd: '/fake/cwd',
            config: makeMockConfig({ registries: ['https://primary.example.com'] }),
            projectContext: {} as any,
            installedComponents: [],
            fs: {} as any,
            offline: false,
        };

        const results = await integrityRegistryReachabilityRule.check(ctx);
        const checks = Array.isArray(results) ? results : [results];

        expect(checks[0].status).toBe('pass');
        expect(checks[0].message).toContain('Reachable');
    });

    it('reports warn when a remote registry is unreachable', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Connection timed out')));

        const ctx: DiagnosticContext = {
            cwd: '/fake/cwd',
            config: makeMockConfig({ registries: ['https://dead-mirror.example.com'] }),
            projectContext: {} as any,
            installedComponents: [],
            fs: {} as any,
            offline: false,
        };

        const results = await integrityRegistryReachabilityRule.check(ctx);
        const checks = Array.isArray(results) ? results : [results];

        expect(checks[0].status).toBe('warn');
        expect(checks[0].message).toContain('Unreachable');
    });
});

describe('fetchWithSources Telemetry & Verbose Logging (Ticket 4)', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('emits debug trace on starting hedged race and on race completion', async () => {
        const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

        const fetcher = vi.fn(async (source: string) => `content-from-${source}`);
        await fetchWithSources(['https://source-a.com', 'https://source-b.com'], fetcher);

        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[Resilience] Starting hedged race'));
        expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('[Resilience] Source "https://source-a.com" won the race'));
    });
});
