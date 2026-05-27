import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import * as registry from '../src/lib/registry.js';

describe('getItem local', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should throw error when component not found in local registry', async () => {
        vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
        await expect(registry.getItem('non-existent', '/local/registry')).rejects.toThrow('not found in local registry');
    });
});

describe('resolveDeps with mocked fetch', () => {
    const mockRegistry: Record<string, any> = {
        combobox: {
            name: 'combobox',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: ['button', 'popover'],
            files: []
        },
        button: {
            name: 'button',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: [],
            files: []
        },
        popover: {
            name: 'popover',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: [],
            files: []
        },
        a: {
            name: 'a',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: ['b'],
            files: []
        },
        b: {
            name: 'b',
            type: 'registry:ui',
            dependencies: [],
            registryDependencies: ['a'],
            files: []
        }
    };

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should recursively resolve registry dependencies in correct topological order', async () => {
        vi.stubGlobal('fetch', async (url: string) => {
            const name = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.json'));
            if (mockRegistry[name]) {
                return {
                    ok: true,
                    json: async () => mockRegistry[name]
                };
            }
            return {
                ok: false,
                statusText: 'Not Found'
            };
        });

        const resolved = await registry.resolveDeps(['combobox'], 'https://registry.mock');

        expect(resolved.map(r => r.name)).toEqual(['button', 'popover', 'combobox']);
    });

    it('should throw error when circular dependency is detected', async () => {
        vi.stubGlobal('fetch', async (url: string) => {
            const name = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.json'));
            return {
                ok: true,
                json: async () => mockRegistry[name]
            };
        });

        await expect(registry.resolveDeps(['a'], 'https://registry.mock')).rejects.toThrow('Circular dependency detected: a');
    });

    it('should correctly parse version-pinned names like component@version', async () => {
        vi.stubGlobal('fetch', async (url: string) => {
            expect(url).toContain('/v0.2.1/');
            const name = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.json'));
            return {
                ok: true,
                json: async () => mockRegistry[name]
            };
        });

        const resolved = await registry.resolveDeps(['button@v0.2.1']);
        expect(resolved.map(r => r.name)).toEqual(['button']);
    });
});
