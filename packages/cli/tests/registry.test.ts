import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import * as registry from '../src/lib/registry.js';

function createRegistryItem(name: string, overrides: Record<string, any> = {}) {
    const files = overrides.files ?? [{
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
        registryDependencies: [],
        files,
        tailwind: {},
        cssVars: {},
        ...overrides,
    };

    return {
        ...item,
        integrity: overrides.integrity ?? computeRegistryIntegrity(item.files),
    };
}

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
            title: 'invalid',
            description: 'invalid component',
            dependencies: [],
            registryDependencies: [],
            files: {},
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-' + '0'.repeat(64),
        }, async (registryPath) => {
            await expect(registry.getItem('invalid', registryPath)).rejects.toThrow('"files" must be an array');
        });
    });

    it('should reject registry files without path or content', async () => {
        await withRegistry('invalid', {
            name: 'invalid',
            type: 'registry:ui',
            title: 'invalid',
            description: 'invalid component',
            dependencies: [],
            registryDependencies: [],
            files: [{ path: 'components/ui/invalid/Invalid.vue', type: 'registry:ui' }],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-' + '0'.repeat(64),
        }, async (registryPath) => {
            await expect(registry.getItem('invalid', registryPath)).rejects.toThrow('"content" must be a non-empty string');
        });
    });

    it('should reject registry items with invalid status', async () => {
        await withRegistry('invalid', createRegistryItem('invalid', {
            status: 'retired',
        }), async (registryPath) => {
            await expect(registry.getItem('invalid', registryPath)).rejects.toThrow('"status" must be one of');
        });
    });

    it('should require replacements for legacy registry items', async () => {
        await withRegistry('legacy', createRegistryItem('legacy', {
            status: 'legacy',
            replacement: undefined,
        }), async (registryPath) => {
            await expect(registry.getItem('legacy', registryPath)).rejects.toThrow('"replacement" is required');
        });
    });

    it('should surface dependency resolution failures with the missing dependency name', async () => {
        await withRegistry('parent', createRegistryItem('parent', {
            registryDependencies: ['missing-child'],
        }), async (registryPath) => {
            await expect(registry.resolveDeps(['parent'], registryPath)).rejects.toThrow('missing-child');
        });
    });

    it('should verify local integrity with null-separated file contents', async () => {
        const item = createRegistryItem('button', {
            files: [
                { path: 'components/ui/button/Button.vue', content: 'one', type: 'registry:ui' },
                { path: 'components/ui/button/button-variants.ts', content: 'two', type: 'registry:lib' },
            ],
        });

        await withRegistry('button', item, async (registryPath) => {
            await expect(registry.getItem('button', registryPath)).resolves.toMatchObject({
                name: 'button',
            });
        });
    });

    it('should reject local registry items with mismatched integrity', async () => {
        const item = createRegistryItem('button', {
            integrity: 'sha256-' + 'f'.repeat(64),
        });

        await withRegistry('button', item, async (registryPath) => {
            await expect(registry.getItem('button', registryPath)).rejects.toMatchObject({
                code: 'REGISTRY_INTEGRITY_FAILED',
            });
        });
    });
});

describe('resolveDeps with mocked fetch', () => {
    const mockRegistry: Record<string, any> = {
        combobox: createRegistryItem('combobox', {
            registryDependencies: ['button', 'popover'],
        }),
        button: createRegistryItem('button'),
        popover: createRegistryItem('popover'),
        a: createRegistryItem('a', {
            registryDependencies: ['b'],
        }),
        b: createRegistryItem('b', {
            registryDependencies: ['a'],
        })
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

    it('should verify remote integrity with null-separated file contents', async () => {
        const files = [
            { path: 'components/ui/button/Button.vue', content: 'one', type: 'registry:ui' },
            { path: 'components/ui/button/button-variants.ts', content: 'two', type: 'registry:lib' },
        ];
        const integrity = computeRegistryIntegrity(files);

        vi.stubGlobal('fetch', async () => ({
            ok: true,
            json: async () => createRegistryItem('button', {
                files,
                integrity,
            }),
        }));

        await expect(registry.getItem('button', 'https://registry.mock', false)).resolves.toMatchObject({
            name: 'button',
        });
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
                    ...createRegistryItem('first'),
                    dependencies: ['shared-runtime'],
                    registryDependencies: ['button'],
                },
                second: {
                    ...createRegistryItem('second'),
                    dependencies: ['shared-runtime'],
                    registryDependencies: ['button'],
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
