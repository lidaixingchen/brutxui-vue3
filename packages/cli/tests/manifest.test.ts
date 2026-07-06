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
});
