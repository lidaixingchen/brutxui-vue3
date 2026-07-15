import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { RegistryItem } from '../src/lib/types.js';
import {
    getManifestPath,
    readManifest,
    removeInstalledComponents,
    updateInstalledComponents,
} from '../src/lib/manifest.js';

function makeRegistryItem(name: string): RegistryItem {
    return {
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        category: 'action',
        examples: [`${name}-demo`],
        dependencies: ['vue', 'reka-ui'],
        registryDependencies: ['primitive'],
        files: [
            {
                path: `components/${name}/${name}.vue`,
                content: '<template><div /></template>',
                type: 'registry:ui',
            },
        ],
        tailwind: {},
        cssVars: {},
        integrity: `sha256-${name}`,
        status: 'legacy',
        replacement: `${name}-next`,
    };
}

describe('install manifest helpers', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-manifest-'));
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
    });

    it('writes installed component metadata with portable project-relative paths', async () => {
        await updateInstalledComponents(tmpDir, [
            {
                item: makeRegistryItem('button'),
                registrySource: 'https://example.test/registry',
                files: [
                    path.join(tmpDir, 'src', 'components', 'button', 'Button.vue'),
                    path.join(tmpDir, 'src', 'components', 'button', 'button-variants.ts'),
                ],
            },
        ]);

        const manifest = await readManifest(tmpDir);

        expect(manifest).not.toBeNull();
        expect(manifest?.version).toBe(1);
        expect(manifest?.components.button).toMatchObject({
            name: 'button',
            registrySource: 'https://example.test/registry',
            integrity: 'sha256-button',
            dependencies: ['reka-ui', 'vue'],
            registryDependencies: ['primitive'],
            category: 'action',
            examples: ['button-demo'],
            status: 'legacy',
            replacement: 'button-next',
        });
        expect(manifest?.components.button.files).toEqual([
            'src/components/button/Button.vue',
            'src/components/button/button-variants.ts',
        ]);
        expect(await fs.pathExists(getManifestPath(tmpDir))).toBe(true);
    });

    it('removes component entries without deleting the manifest file', async () => {
        await updateInstalledComponents(tmpDir, [
            {
                item: makeRegistryItem('button'),
                registrySource: 'https://example.test/registry',
                files: [path.join(tmpDir, 'src', 'components', 'button', 'Button.vue')],
            },
            {
                item: makeRegistryItem('card'),
                registrySource: 'https://example.test/registry',
                files: [path.join(tmpDir, 'src', 'components', 'card', 'Card.vue')],
            },
        ]);

        await removeInstalledComponents(tmpDir, ['button']);
        const manifest = await readManifest(tmpDir);

        expect(manifest?.components.button).toBeUndefined();
        expect(manifest?.components.card).toBeDefined();
        expect(await fs.pathExists(getManifestPath(tmpDir))).toBe(true);
    });

    it('persists the version field when provided (P0-3 version governance)', async () => {
        await updateInstalledComponents(tmpDir, [
            {
                item: makeRegistryItem('button'),
                registrySource: 'https://example.test/registry',
                files: [path.join(tmpDir, 'src', 'components', 'button', 'Button.vue')],
                version: 'v1.2.0',
            },
        ]);

        const manifest = await readManifest(tmpDir);

        expect(manifest?.components.button.version).toBe('v1.2.0');
    });

    it('omits the version field when not provided (treated as "latest" by add command)', async () => {
        await updateInstalledComponents(tmpDir, [
            {
                item: makeRegistryItem('button'),
                registrySource: 'https://example.test/registry',
                files: [path.join(tmpDir, 'src', 'components', 'button', 'Button.vue')],
            },
        ]);

        const manifest = await readManifest(tmpDir);

        expect(manifest?.components.button.version).toBeUndefined();
    });

    it('rejects an empty-string version field when reading manifest from disk', async () => {
        // updateInstalledComponents 写入时不校验（与 installedContentHash 一致），
        // 校验在 readManifest 时触发——模拟磁盘上存在非法 manifest 的场景。
        const manifestPath = getManifestPath(tmpDir);
        await fs.ensureDir(path.dirname(manifestPath));
        await fs.writeJson(manifestPath, {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    registrySource: 'https://example.test/registry',
                    integrity: 'sha256-button',
                    version: '',
                    installedAt: '2026-07-13T00:00:00.000Z',
                    files: ['src/components/button/Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                    examples: [],
                },
            },
        });

        await expect(readManifest(tmpDir)).rejects.toThrow('"version" must be a non-empty string when provided');
    });

    it('round-trips an existing version field when re-writing the manifest', async () => {
        const manifestPath = getManifestPath(tmpDir);
        await fs.ensureDir(path.dirname(manifestPath));
        await fs.writeJson(manifestPath, {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    registrySource: 'https://example.test/registry',
                    integrity: 'sha256-button',
                    version: 'v0.9.0',
                    installedAt: '2026-07-13T00:00:00.000Z',
                    files: ['src/components/button/Button.vue'],
                    dependencies: ['vue'],
                    registryDependencies: [],
                    examples: [],
                },
            },
        });

        const manifest = await readManifest(tmpDir);
        expect(manifest?.components.button.version).toBe('v0.9.0');
    });
});
