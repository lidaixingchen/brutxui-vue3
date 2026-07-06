import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';
import {
    ensureUtilsFile,
    resolveComponentFilePath,
    writeComponentFiles,
} from '../src/lib/services/add-service.js';

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

    it('resolves registry component paths through configured aliases', async () => {
        const resolved = await resolveComponentFilePath('components/ui/badge/Badge.vue', config, tmpDir);

        expect(resolved).toBe(path.join(tmpDir, 'src', 'widgets', 'ui', 'badge', 'Badge.vue'));
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
});
