import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import * as registry from '../src/lib/registry.js';
import { generateEd25519KeyPair, signManifestIntegrity } from '../src/lib/signature.js';
import { CliError } from '../src/lib/error.js';

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
                    json: async () => mockRegistry[name],
                    headers: new Map(),
                    status: 200,
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
            headers: new Map(),
            status: 200,
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
                json: async () => mockRegistry[name],
                headers: new Map(),
                status: 200,
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
                json: async () => mockRegistry[name],
                headers: new Map(),
                status: 200,
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
                json: async () => item,
                headers: new Map(),
                status: item ? 200 : 404,
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

describe('resolveDeps version-pinned deduplication (P0-3)', () => {
    const mockRegistry: Record<string, any> = {
        aV1: {
            ...createRegistryItem('button'),
            name: 'button',
            registryDependencies: [],
        },
        aV2: {
            ...createRegistryItem('button'),
            name: 'button',
            registryDependencies: [],
        },
        parentA: createRegistryItem('parentA', {
            registryDependencies: ['button@v1'],
        }),
        parentB: createRegistryItem('parentB', {
            registryDependencies: ['button@v2'],
        }),
    };

    beforeEach(() => {
        // 跳过磁盘缓存，确保每次都走 fetch mock（避免跨测试缓存命中导致 fetch 计数失真）
        process.env.BRUTX_NO_CACHE = '1';
    });

    afterEach(() => {
        delete process.env.BRUTX_NO_CACHE;
        vi.unstubAllGlobals();
    });

    it('should resolve both button@v1 and button@v2 without silently dropping either (bug 4 fix)', async () => {
        const fetchedUrls: string[] = [];
        vi.stubGlobal('fetch', async (url: string) => {
            fetchedUrls.push(url);
            // parentA/parentB 本身不带 @version，走默认 ref（main）；它们的依赖 button@v1/v2 走版本化 ref
            const isV1 = url.includes('/v1/');
            const isV2 = url.includes('/v2/');
            const endsWithButton = url.endsWith('/button.json');
            const endsWithParentA = url.endsWith('/parentA.json');
            const endsWithParentB = url.endsWith('/parentB.json');
            const item = isV1 && endsWithButton ? mockRegistry.aV1
                : isV2 && endsWithButton ? mockRegistry.aV2
                : endsWithParentA ? mockRegistry.parentA
                : endsWithParentB ? mockRegistry.parentB
                : null;
            return {
                ok: Boolean(item),
                statusText: 'Not Found',
                json: async () => item,
                headers: new Map(),
                status: item ? 200 : 404,
            };
        });

        const resolved = await registry.resolveDeps(['parentA', 'parentB']);
        const names = resolved.map(r => r.name);

        // 两个 button 实例都应被解析（不同 version）
        expect(names.filter(n => n === 'button').length).toBe(2);
        expect(fetchedUrls.some(u => u.includes('/v1/'))).toBe(true);
        expect(fetchedUrls.some(u => u.includes('/v2/'))).toBe(true);
    });

    it('should still deduplicate same-version dependencies (button@v1 appears once)', async () => {
        const fetchedUrls: string[] = [];
        const parentC = createRegistryItem('parentC', { registryDependencies: ['button@v1'] });
        vi.stubGlobal('fetch', async (url: string) => {
            fetchedUrls.push(url);
            const isV1 = url.includes('/v1/');
            const endsWithButton = url.endsWith('/button.json');
            const endsWithParentA = url.endsWith('/parentA.json');
            const endsWithParentC = url.endsWith('/parentC.json');
            const item = isV1 && endsWithButton ? mockRegistry.aV1
                : endsWithParentA ? mockRegistry.parentA
                : endsWithParentC ? parentC
                : null;
            return {
                ok: Boolean(item),
                statusText: 'Not Found',
                json: async () => item,
                headers: new Map(),
                status: item ? 200 : 404,
            };
        });

        const resolved = await registry.resolveDeps(['parentA', 'parentC']);
        const buttonFetchCount = fetchedUrls.filter(u => u.endsWith('/button.json') && u.includes('/v1/')).length;
        expect(buttonFetchCount).toBe(1);
        const names = resolved.map(r => r.name);
        expect(names.filter(n => n === 'button').length).toBe(1);
    });

    it('should throw REGISTRY_VERSION_UNSUPPORTED for non-GitHub raw URL with @version', async () => {
        vi.stubGlobal('fetch', async () => ({
            ok: true,
            json: async () => mockRegistry.aV1,
            headers: new Map(),
            status: 200,
        }));

        await expect(
            registry.resolveDeps(['button@v1'], 'https://non-github.example.com/registry')
        ).rejects.toMatchObject({
            code: 'REGISTRY_VERSION_UNSUPPORTED',
        });
    });
});

// ---------------------------------------------------------------------------
// Manifest signature verification integration (P1-6)
// ---------------------------------------------------------------------------
describe('getItem with manifest signature verification (P1-6)', () => {
    let tempCacheDir: string;
    let keyPair: { keyId: string; publicKey: string; privateKey: string };

    beforeEach(() => {
        tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-sig-cache-'));
        process.env.BRUTX_CACHE_DIR = tempCacheDir;
        delete process.env.BRUTX_OFFLINE;
        delete process.env.BRUTX_NO_CACHE;
        keyPair = generateEd25519KeyPair();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        delete process.env.BRUTX_CACHE_DIR;
        delete process.env.BRUTX_REGISTRY_PUBLIC_KEYS;
        delete process.env.BRUTX_OFFLINE;
        delete process.env.BRUTX_NO_CACHE;
        if (tempCacheDir && fs.existsSync(tempCacheDir)) {
            fs.removeSync(tempCacheDir);
        }
    });

    function makeSignedManifest(integrity: string, keyId: string, privateKey: string) {
        return {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 1,
            items: {},
            integrity,
            signature: signManifestIntegrity(integrity, privateKey),
            keyId,
        };
    }

    function stubFetchWithManifest(manifest: unknown, item: unknown) {
        vi.stubGlobal('fetch', async (url: string | URL | Request) => {
            const u = typeof url === 'string' ? url : url.toString();
            if (u.endsWith('/registry-manifest.json')) {
                return {
                    ok: true,
                    json: async () => manifest,
                    headers: new Map(),
                    status: 200,
                };
            }
            if (u.endsWith('/button.json')) {
                return {
                    ok: true,
                    json: async () => item,
                    headers: new Map(),
                    status: 200,
                };
            }
            return { ok: false, statusText: 'Not Found', status: 404, headers: new Map() };
        });
    }

    it('succeeds when manifest has valid signature and matching trusted key', async () => {
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },
        ]);
        const manifestIntegrity = 'a'.repeat(64);
        const manifest = makeSignedManifest(manifestIntegrity, keyPair.keyId, keyPair.privateKey);
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-valid.mock')).resolves.toMatchObject({
            name: 'button',
        });
    });

    it('succeeds when manifest is unsigned (backward compatibility)', async () => {
        delete process.env.BRUTX_REGISTRY_PUBLIC_KEYS;
        const manifest = {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 1,
            items: {},
            integrity: 'b'.repeat(64),
            // 无 signature/keyId 字段
        };
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-unsigned.mock')).resolves.toMatchObject({
            name: 'button',
        });
    });

    it('succeeds when manifest is signed but BRUTX_REGISTRY_PUBLIC_KEYS is unset (verification skipped)', async () => {
        delete process.env.BRUTX_REGISTRY_PUBLIC_KEYS;
        const manifestIntegrity = 'c'.repeat(64);
        const manifest = makeSignedManifest(manifestIntegrity, keyPair.keyId, keyPair.privateKey);
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-nokeys.mock')).resolves.toMatchObject({
            name: 'button',
        });
    });

    it('throws REGISTRY_SIGNATURE_INVALID when signature is tampered', async () => {
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },
        ]);
        const manifestIntegrity = 'd'.repeat(64);
        const validSig = signManifestIntegrity(manifestIntegrity, keyPair.privateKey);
        // 篡改签名最后 4 个字符
        const tamperedSig = validSig.slice(0, -4) + 'XXXX';
        const manifest = {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 1,
            items: {},
            integrity: manifestIntegrity,
            signature: tamperedSig,
            keyId: keyPair.keyId,
        };
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-tampered.mock')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
    });

    it('throws REGISTRY_SIGNATURE_INVALID when keyId does not match any trusted key', async () => {
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },
        ]);
        const manifestIntegrity = 'e'.repeat(64);
        const manifest = makeSignedManifest(manifestIntegrity, keyPair.keyId, keyPair.privateKey);
        // 覆盖 keyId 为未知值
        (manifest as { keyId: string }).keyId = 'unknown-key-id';
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-unknown-key.mock')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
    });

    it('throws REGISTRY_SIGNATURE_INVALID when signature is for different integrity (content swapped)', async () => {
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },
        ]);
        // 用 integrity-A 的签名，但 manifest 的 integrity 字段是 B
        const sigForA = signManifestIntegrity('integrity-a-value', keyPair.privateKey);
        const manifest = {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 1,
            items: {},
            integrity: 'integrity-b-value',  // 不匹配签名
            signature: sigForA,
            keyId: keyPair.keyId,
        };
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-content-swap.mock')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
    });

    it('supports key rotation: new keyId signature passes when both old+new keys trusted', async () => {
        const keyPairV2 = generateEd25519KeyPair();
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },       // v1（仍在过渡期）
            { keyId: keyPairV2.keyId, publicKey: keyPairV2.publicKey },   // v2（新）
        ]);
        const manifestIntegrity = 'f'.repeat(64);
        // 用 v2 签名
        const manifest = makeSignedManifest(manifestIntegrity, keyPairV2.keyId, keyPairV2.privateKey);
        const item = createRegistryItem('button');

        stubFetchWithManifest(manifest, item);

        await expect(registry.getItem('button', 'https://sig-rotation.mock')).resolves.toMatchObject({
            name: 'button',
        });
    });

    it('REGISTRY_SIGNATURE_INVALID is a CliError instance (not generic Error)', async () => {
        process.env.BRUTX_REGISTRY_PUBLIC_KEYS = JSON.stringify([
            { keyId: keyPair.keyId, publicKey: keyPair.publicKey },
        ]);
        const manifestIntegrity = '1'.repeat(64);
        const validSig = signManifestIntegrity(manifestIntegrity, keyPair.privateKey);
        const tamperedSig = validSig.slice(0, -4) + 'YYYY';
        const manifest = {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 1,
            items: {},
            integrity: manifestIntegrity,
            signature: tamperedSig,
            keyId: keyPair.keyId,
        };

        stubFetchWithManifest(manifest, createRegistryItem('button'));

        try {
            await registry.getItem('button', 'https://sig-clierror.mock');
            throw new Error('should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(CliError);
            expect((error as CliError).code).toBe('REGISTRY_SIGNATURE_INVALID');
            expect((error as CliError).exitCode).toBe(1);
        }
    });
});

