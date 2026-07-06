import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';
import { readManifest, updateInstalledComponents } from '../src/lib/manifest.js';
import {
    prepareRemoveComponents,
    removeComponents,
} from '../src/lib/services/remove-service.js';

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

function makeRegistryItem(name: string, registryDependencies: string[] = []): RegistryItem {
    return {
        name,
        type: 'registry:ui',
        title: name,
        description: `${name} component`,
        category: 'action',
        examples: [],
        dependencies: [],
        registryDependencies,
        files: [],
        tailwind: {},
        cssVars: {},
        integrity: `sha256-${name}`,
    };
}

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-remove-service-'));
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

async function writeComponent(
    cwd: string,
    componentName: string,
    files: Record<string, string>
): Promise<string[]> {
    const componentDir = path.join(cwd, 'src', 'components', componentName);
    await fs.ensureDir(componentDir);

    const writtenFiles: string[] = [];
    for (const [fileName, content] of Object.entries(files)) {
        const filePath = path.join(componentDir, fileName);
        await fs.writeFile(filePath, content, 'utf-8');
        writtenFiles.push(filePath);
    }

    return writtenFiles;
}

async function seedProject(cwd: string): Promise<{ buttonFiles: string[]; cardFiles: string[]; orphanFile: string }> {
    const buttonFiles = await writeComponent(cwd, 'button', {
        'Button.vue': "import { useButton } from '@/composables/useButton';\n<template><button /></template>",
        'button-variants.ts': 'export const buttonVariants = {};',
    });
    const cardFiles = await writeComponent(cwd, 'card', {
        'Card.vue': '<template><div /></template>',
    });
    const orphanFile = path.join(cwd, 'src', 'composables', 'useButton.ts');
    await fs.ensureDir(path.dirname(orphanFile));
    await fs.writeFile(orphanFile, 'export function useButton() {}', 'utf-8');

    await updateInstalledComponents(cwd, [
        {
            item: makeRegistryItem('button'),
            registrySource: 'https://example.test/registry',
            files: [...buttonFiles, orphanFile],
        },
        {
            item: makeRegistryItem('card', ['button']),
            registrySource: 'https://example.test/registry',
            files: cardFiles,
        },
    ]);

    return { buttonFiles, cardFiles, orphanFile };
}

describe('remove service', () => {
    let tmpDir: string;

    beforeEach(async () => {
        vi.clearAllMocks();
        tmpDir = await createTmpProject();
        mockedGetItem.mockImplementation(async (name: string) => {
            if (name === 'card') return makeRegistryItem('card', ['button']);
            if (name === 'button') return makeRegistryItem('button');
            throw new Error(`Unknown component: ${name}`);
        });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    it('prepares installed, missing, dependent, and orphaned component state', async () => {
        const { orphanFile } = await seedProject(tmpDir);
        const manifest = await readManifest(tmpDir);

        const removal = await prepareRemoveComponents(
            tmpDir,
            defaultConfig,
            ['button', 'missing'],
            manifest
        );

        expect(removal.toRemove).toEqual(['button']);
        expect(removal.notFound).toEqual(['missing']);
        expect(removal.remaining).toEqual(['card']);
        expect(removal.dependents.get('button')).toEqual(['card']);
        expect(removal.orphanedFiles).toEqual([orphanFile]);
    });

    it('removes component files and keeps orphaned files when requested', async () => {
        const { orphanFile } = await seedProject(tmpDir);
        const componentDir = path.join(tmpDir, 'src', 'components', 'button');

        const result = await removeComponents(
            tmpDir,
            defaultConfig,
            ['button'],
            [orphanFile],
            { removeOrphaned: false }
        );

        expect(result).toEqual({ totalRemoved: 2, orphanedRemoved: 0 });
        expect(await fs.pathExists(componentDir)).toBe(false);
        expect(await fs.pathExists(orphanFile)).toBe(true);

        const manifest = await readManifest(tmpDir);
        expect(manifest?.components.button).toBeUndefined();
        expect(manifest?.components.card).toBeDefined();
    });

    it('removes orphaned files when requested', async () => {
        const { orphanFile } = await seedProject(tmpDir);

        const result = await removeComponents(
            tmpDir,
            defaultConfig,
            ['button'],
            [orphanFile],
            { removeOrphaned: true }
        );

        expect(result).toEqual({ totalRemoved: 2, orphanedRemoved: 1 });
        expect(await fs.pathExists(orphanFile)).toBe(false);
    });
});
