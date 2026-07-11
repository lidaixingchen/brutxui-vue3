import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';
import { resolveDeps } from '../src/lib/registry.js';
import {
    ensureUtilsFile,
    resolveComponents,
    resolveComponentFilePath,
    writeComponentFiles,
} from '../src/lib/services/add-service.js';

vi.mock('../src/lib/registry.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/lib/registry.js')>();
    return {
        ...actual,
        resolveDeps: vi.fn(),
    };
});

const config: BrutalistConfig = {
    style: 'brutalism',
    tailwind: {
        config: '',
        css: 'src/index.css',
    },
    aliases: {
        components: '@/widgets',
        utils: '@/shared/cn',
        composables: '@/hooks',
    },
};

const badgeItem = {
    name: 'badge',
    type: 'registry:ui',
    title: 'Badge',
    description: 'Badge component',
    dependencies: [],
    registryDependencies: [],
    examples: [],
    files: [
        {
            path: 'components/ui/badge/Badge.vue',
            content: "import { cn } from '@/lib/utils'\n",
            type: 'registry:ui',
        },
    ],
} as RegistryItem;

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-add-service-'));
    await fs.ensureDir(path.join(tmpDir, 'src'));
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

describe('add service', () => {
    let tmpDir: string;

    beforeEach(async () => {
        vi.mocked(resolveDeps).mockReset();
        tmpDir = await createTmpProject();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
    });

    it('creates the utility helper at the configured alias', async () => {
        const result = await ensureUtilsFile(tmpDir, config);

        expect(result).toEqual({
            path: path.join(tmpDir, 'src', 'shared', 'cn.ts'),
            created: true,
        });
        expect(await fs.readFile(result.path, 'utf-8')).toContain('export function cn');
    });

    it('resolves components and deduplicates npm dependencies', async () => {
        const cardItem = {
            ...badgeItem,
            name: 'card',
            dependencies: ['clsx', 'reka-ui'],
        } as RegistryItem;
        vi.mocked(resolveDeps).mockResolvedValue([
            { ...badgeItem, dependencies: ['clsx'] } as RegistryItem,
            cardItem,
        ]);

        const result = await resolveComponents(['badge', 'card'], 'local-registry');

        expect(resolveDeps).toHaveBeenCalledWith(['badge', 'card'], 'local-registry', true);
        expect(result.items).toEqual([
            { ...badgeItem, dependencies: ['clsx'] },
            cardItem,
        ]);
        expect(result.dependencies).toEqual(['clsx', 'reka-ui']);
    });

    it('resolves registry component paths through configured aliases', async () => {
        const resolved = await resolveComponentFilePath('components/ui/badge/Badge.vue', config, tmpDir);

        expect(resolved).toBe(path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue'));
    });

    it('classifies unsafe resolved component paths', async () => {
        await expect(resolveComponentFilePath('../outside.ts', config, tmpDir))
            .rejects
            .toMatchObject({
                code: 'PATH_UNSAFE',
                exitCode: 2,
            });
    });

    it('writes component files and rewrites internal aliases', async () => {
        const onProgress = vi.fn();

        const result = await writeComponentFiles([badgeItem], config, tmpDir, {
            callbacks: { onProgress },
        });

        const targetPath = path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue');
        expect(result.added).toEqual(['badge']);
        expect(result.filesWritten).toEqual([targetPath]);
        expect(result.filesByComponent.badge).toEqual([targetPath]);
        expect(await fs.readFile(targetPath, 'utf-8')).toContain("from '@/shared/cn'");
        expect(onProgress).toHaveBeenCalledWith({ item: badgeItem, index: 0, total: 1 });
    });

    it('skips existing files without overwrite', async () => {
        const targetPath = path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue');
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, 'existing', 'utf-8');
        const onSkipFile = vi.fn();

        const result = await writeComponentFiles([badgeItem], config, tmpDir, {
            callbacks: { onSkipFile },
        });

        expect(result.added).toEqual([]);
        expect(result.skipped).toEqual(['badge']);
        expect(await fs.readFile(targetPath, 'utf-8')).toBe('existing');
        expect(onSkipFile).toHaveBeenCalledWith({ item: badgeItem, filePath: 'components/ui/badge/Badge.vue' });
    });

    it('reports dry-run writes without touching the filesystem', async () => {
        const onDryRunFile = vi.fn();

        const result = await writeComponentFiles([badgeItem], config, tmpDir, {
            dryRun: true,
            callbacks: { onDryRunFile },
        });

        const targetPath = path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue');
        expect(result.added).toEqual(['badge']);
        expect(result.filesWritten).toEqual([targetPath]);
        expect(await fs.pathExists(targetPath)).toBe(false);
        expect(onDryRunFile).toHaveBeenCalledWith({ item: badgeItem, targetPath });
    });

    it('rolls back written files when a later write fails', async () => {
        const badgePath = path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue');
        const helperPath = path.join(tmpDir, 'src', 'hooks', 'useBadge.ts');
        await fs.ensureDir(path.dirname(badgePath));
        await fs.writeFile(badgePath, 'existing badge', 'utf-8');

        const itemWithFailingHelper = {
            ...badgeItem,
            files: [
                ...badgeItem.files,
                {
                    path: 'composables/useBadge.ts',
                    content: 'export function useBadge() {}\n',
                    type: 'registry:component',
                },
            ],
        } as RegistryItem;

        const writeFile = vi.spyOn(fs, 'writeFile').mockImplementation(async (file, content, options) => {
            if (file === helperPath && content === 'export function useBadge() {}\n') {
                throw new Error('simulated write failure');
            }
            return fs.outputFile(file, content, options);
        });

        await expect(writeComponentFiles([itemWithFailingHelper], config, tmpDir, { overwrite: true }))
            .rejects
            .toMatchObject({
                message: 'simulated write failure',
                rollbackCount: 2,
                rollbackFailures: 0,
            });

        expect(writeFile).toHaveBeenCalled();
        expect(await fs.readFile(badgePath, 'utf-8')).toBe('existing badge');
        expect(await fs.pathExists(helperPath)).toBe(false);
    });
});
