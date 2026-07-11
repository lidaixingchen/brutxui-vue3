import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';
import type { BrutalistConfig, RegistryItem, InstalledComponentManifest } from '../src/lib/types.js';
import { updateInstalledComponents } from '../src/lib/manifest.js';
import {
    diffComponent,
    diffComponents,
    getInstalledComponents,
} from '../src/lib/services/diff-service.js';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const original = await importOriginal<typeof registry>();
    return {
        ...original,
        getItem: vi.fn(),
    };
});

const mockedGetItem = vi.mocked(registry.getItem);

const defaultConfig: BrutalistConfig = {
    $schema: 'https://example.com/schema.json',
    style: 'brutalism',
    tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
    aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        composables: '@/composables',
    },
};

function makeRegistryItem(
    name: string,
    files: RegistryItem['files'],
    integrity = `sha256-${name}`
): RegistryItem {
    return {
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        category: 'action',
        examples: [],
        dependencies: [],
        registryDependencies: [],
        files,
        tailwind: {},
        cssVars: {},
        integrity,
    };
}

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-diff-service-'));
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

async function writeComponentFile(
    cwd: string,
    component: string,
    fileName: string,
    content: string
): Promise<string> {
    const filePath = path.join(cwd, 'src', 'components', component, fileName);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
}

describe('diff service', () => {
    let tmpDir: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        tmpDir = await createTmpProject();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    it('reports an up-to-date component with matching registry content and portable paths', async () => {
        await writeComponentFile(tmpDir, 'button', 'Button.vue', '<template>button</template>\r\n');
        const registryItem = makeRegistryItem('button', [
            {
                path: 'components/ui/button/Button.vue',
                content: '<template>button</template>\n',
                type: 'registry:ui',
            },
        ], 'sha256-current');
        mockedGetItem.mockResolvedValue(registryItem);

        const result = await diffComponent(tmpDir, defaultConfig, 'button');

        expect(result).toMatchObject({
            component: 'button',
            status: 'up-to-date',
            latestIntegrity: 'sha256-current',
            integrityStatus: 'unknown',
        });
        expect(result.files).toEqual([
            { path: 'components/ui/button/Button.vue', status: 'unchanged' },
        ]);
    });

    it('reports modified, added, and removed files for a component', async () => {
        await writeComponentFile(tmpDir, 'button', 'Button.vue', '<template>local</template>\n');
        await writeComponentFile(tmpDir, 'button', 'local-only.ts', 'export const localOnly = true;\n');
        mockedGetItem.mockResolvedValue(makeRegistryItem('button', [
            {
                path: 'components/ui/button/Button.vue',
                content: '<template>registry</template>\n',
                type: 'registry:ui',
            },
            {
                path: 'components/ui/button/button-variants.ts',
                content: 'export const buttonVariants = {};\n',
                type: 'registry:ui',
            },
        ]));

        const result = await diffComponent(tmpDir, defaultConfig, 'button');

        expect(result.status).toBe('modified');
        expect(result.files).toEqual(expect.arrayContaining([
            expect.objectContaining({
                path: 'components/ui/button/Button.vue',
                status: 'modified',
                patch: expect.stringContaining('-<template>registry</template>'),
            }),
            { path: 'components/ui/button/button-variants.ts', status: 'added' },
            { path: 'local-only.ts', status: 'removed' },
        ]));
    });

    it('uses manifest metadata to report registry source and outdated integrity', async () => {
        await writeComponentFile(tmpDir, 'button', 'Button.vue', '<template>button</template>\n');
        const manifestEntry: InstalledComponentManifest = {
            name: 'button',
            registrySource: 'https://example.test/registry',
            integrity: 'sha256-old',
            installedAt: '2026-07-07T00:00:00.000Z',
            files: ['src/components/button/Button.vue'],
            dependencies: [],
            registryDependencies: [],
            examples: [],
        };
        mockedGetItem.mockResolvedValue(makeRegistryItem('button', [
            {
                path: 'components/ui/button/Button.vue',
                content: '<template>button</template>\n',
                type: 'registry:ui',
            },
        ], 'sha256-new'));

        const result = await diffComponent(
            tmpDir,
            defaultConfig,
            'button',
            manifestEntry.registrySource,
            manifestEntry
        );

        expect(mockedGetItem).toHaveBeenCalledWith('button', 'https://example.test/registry', true);
        expect(result).toMatchObject({
            installedIntegrity: 'sha256-old',
            latestIntegrity: 'sha256-new',
            integrityStatus: 'outdated',
            registrySource: 'https://example.test/registry',
            installedAt: '2026-07-07T00:00:00.000Z',
        });
    });

    it('diffs multiple components with their manifest registry sources', async () => {
        const buttonFile = await writeComponentFile(tmpDir, 'button', 'Button.vue', '<template>button</template>\n');
        const cardFile = await writeComponentFile(tmpDir, 'card', 'Card.vue', '<template>card</template>\n');
        await updateInstalledComponents(tmpDir, [
            {
                item: makeRegistryItem('button', [], 'sha256-button-old'),
                registrySource: 'https://example.test/a',
                files: [buttonFile],
            },
            {
                item: makeRegistryItem('card', [], 'sha256-card-old'),
                registrySource: 'https://example.test/b',
                files: [cardFile],
            },
        ]);
        mockedGetItem.mockImplementation(async (name) => makeRegistryItem(name, [
            {
                path: `components/ui/${name}/${name === 'button' ? 'Button' : 'Card'}.vue`,
                content: `<template>${name}</template>\n`,
                type: 'registry:ui',
            },
        ], `sha256-${name}-new`));

        const installed = await getInstalledComponents(tmpDir, defaultConfig);
        const results = await diffComponents(
            tmpDir,
            defaultConfig,
            installed,
            component => `https://example.test/${component === 'button' ? 'a' : 'b'}`,
            component => ({
                name: component,
                registrySource: `https://example.test/${component === 'button' ? 'a' : 'b'}`,
                integrity: `sha256-${component}-old`,
                installedAt: '2026-07-07T00:00:00.000Z',
                files: [],
                dependencies: [],
                registryDependencies: [],
                examples: [],
            })
        );

        expect(installed).toEqual(['button', 'card']);
        expect(results.map(result => result.component)).toEqual(['button', 'card']);
        expect(results.every(result => result.integrityStatus === 'outdated')).toBe(true);
        expect(mockedGetItem).toHaveBeenCalledWith('button', 'https://example.test/a', true);
        expect(mockedGetItem).toHaveBeenCalledWith('card', 'https://example.test/b', true);
    });

    it('returns registry-unreachable when registry lookup fails', async () => {
        mockedGetItem.mockRejectedValue(new Error('not found'));

        const result = await diffComponent(tmpDir, defaultConfig, 'missing');

        expect(result).toEqual({
            component: 'missing',
            status: 'registry-unreachable',
            files: [],
            installedIntegrity: undefined,
            latestIntegrity: undefined,
            integrityStatus: 'unknown',
            registrySource: undefined,
            installedAt: undefined,
            registryError: 'not found',
        });
    });
});
