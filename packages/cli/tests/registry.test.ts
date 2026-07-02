import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';

describe('getItem local', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should throw error when component not found in local registry', async () => {
        vi.spyOn(fs, 'pathExists').mockResolvedValue(false as never);
        await expect(registry.getItem('non-existent', '/local/registry')).rejects.toThrow('not found in local registry');
    });

    it('should reject local registry component names that escape the registry directory', async () => {
        await expect(registry.getItem('../button', '/local/registry')).rejects.toThrow('Path traversal');
    });
});

describe('getItem local validation', () => {
    async function withRegistry(
        itemName: string,
        item: unknown,
        run: (registryPath: string) => Promise<void>
    ) {
        const registryPath = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-registry-'));

        try {
            await fs.writeJson(path.join(registryPath, `${itemName}.json`), item);
            await run(registryPath);
        } finally {
            await fs.remove(registryPath);
        }
    }

    it('should reject registry items whose files field is not an array', async () => {
        await withRegistry('invalid', {
            name: 'invalid',
            type: 'registry:ui',
            files: {},
        }, async (registryPath) => {
            await expect(registry.getItem('invalid', registryPath)).rejects.toThrow('"files" must be an array');
        });
    });

    it('should reject registry files without path or content', async () => {
        await withRegistry('invalid', {
            name: 'invalid',
            type: 'registry:ui',
            files: [{ path: 'components/ui/invalid/Invalid.vue' }],
        }, async (registryPath) => {
            await expect(registry.getItem('invalid', registryPath)).rejects.toThrow('"content" must be a string');
        });
    });

    it('should surface dependency resolution failures with the missing dependency name', async () => {
        await withRegistry('parent', {
            name: 'parent',
            type: 'registry:ui',
            files: [],
            registryDependencies: ['missing-child'],
        }, async (registryPath) => {
            await expect(registry.resolveDeps(['parent'], registryPath)).rejects.toThrow('missing-child');
        });
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

    it('should de-duplicate shared registry dependencies', async () => {
        vi.stubGlobal('fetch', async (url: string) => {
            const name = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.json'));
            const item = {
                first: {
                    name: 'first',
                    type: 'registry:ui',
                    dependencies: ['shared-runtime'],
                    registryDependencies: ['button'],
                    files: []
                },
                second: {
                    name: 'second',
                    type: 'registry:ui',
                    dependencies: ['shared-runtime'],
                    registryDependencies: ['button'],
                    files: []
                },
                button: mockRegistry.button,
            }[name];

            return {
                ok: Boolean(item),
                statusText: 'Not Found',
                json: async () => item
            };
        });

        const resolved = await registry.resolveDeps(['first', 'second'], 'https://registry.mock');

        expect(resolved.map(r => r.name)).toEqual(['button', 'first', 'second']);
    });
});

describe('migrateConfig', () => {
    it('should return config unchanged when version is current', async () => {
        const raw = { $version: 1, $schema: 'https://example.com', style: 'brutalism' };
        const result = await registry.migrateConfig(raw);
        expect(result).toEqual(raw);
    });

    it('should migrate v0 config by adding $schema and $version', async () => {
        const raw = { style: 'brutalism', tailwind: { config: '', css: 'src/index.css' } };
        const result = await registry.migrateConfig(raw);
        expect(result.$version).toBe(1);
        expect(result.$schema).toBeDefined();
    });

    it('should not overwrite existing $schema during migration', async () => {
        const raw = { $version: 0, $schema: 'https://custom.schema', style: 'brutalism' };
        const result = await registry.migrateConfig(raw);
        expect(result.$schema).toBe('https://custom.schema');
        expect(result.$version).toBe(1);
    });

    it('should handle missing $version as v0', async () => {
        const raw = { style: 'brutalism' };
        const result = await registry.migrateConfig(raw);
        expect(result.$version).toBe(1);
    });
});
