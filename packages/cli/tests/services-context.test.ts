import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { writeComponentFiles, ensureUtilsFile } from '../src/lib/services/add-service.js';
import { initializeProjectFiles } from '../src/lib/services/init-service.js';
import { prepareRemoveComponents, removeComponents } from '../src/lib/services/remove-service.js';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';

describe('Services with ProjectContext (VFS)', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/my-vue-app' : '/workspace/my-vue-app';

    const sampleConfig: BrutalistConfig = {
        $schema: 'https://brutx.dev/schema.json',
        $version: '1.0.0',
        style: 'brutalism',
        tailwind: {
            config: 'tailwind.config.js',
            css: 'src/assets/main.css',
            baseColor: 'slate',
            cssVariables: true,
        },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'my-vue-app',
                dependencies: { vue: '^3.5.0' },
            }),
            [path.join(projectCwd, 'pnpm-lock.yaml')]: '',
            [path.join(projectCwd, 'tsconfig.json')]: JSON.stringify({
                compilerOptions: {
                    baseUrl: '.',
                    paths: { '@/*': ['./src/*'] },
                },
            }),
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, 'src/assets/main.css')]: '@import "tailwindcss";\n',
        });
    });

    it('should initialize project files via ProjectContext and VFS', async () => {
        const freshFs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'my-vue-app',
                dependencies: { vue: '^3.5.0' },
            }),
            [path.join(projectCwd, 'pnpm-lock.yaml')]: '',
            [path.join(projectCwd, 'src/assets/main.css')]: '@import "tailwindcss";\n',
        });

        const ctx = await ProjectContext.loadUninitialized(projectCwd, { fs: freshFs });
        const result = await initializeProjectFiles({
            cwd: projectCwd,
            projectType: ctx.env.projectType,
            settings: {
                tailwind: sampleConfig.tailwind,
                aliases: sampleConfig.aliases,
            },
            context: ctx,
        });

        expect(result.utilsCreated).toBe(true);
        expect(await freshFs.pathExists(path.join(projectCwd, 'components.json'))).toBe(true);
        expect(await freshFs.pathExists(path.join(projectCwd, 'src/lib/utils.ts'))).toBe(true);
        expect(ctx.isConfigured).toBe(true);
    });

    it('should write component files and commit transaction via ProjectContext', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });
        await ensureUtilsFile(ctx);

        const items: RegistryItem[] = [
            {
                name: 'button',
                dependencies: ['reka-ui'],
                files: [
                    {
                        path: 'components/ui/button/Button.vue',
                        content: '<script setup lang="ts">\nimport { cn } from "@/lib/utils";\n</script>\n<template><button :class="cn()"><slot /></button></template>',
                        type: 'components:ui',
                    },
                ],
            },
        ];

        const writeResult = await writeComponentFiles(ctx, items);
        expect(writeResult.added).toEqual(['button']);

        await writeResult.transaction?.commit();

        const targetFile = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFile)).toBe(true);
        const writtenContent = await fs.readFile(targetFile);
        expect(writtenContent).toContain('import { cn } from "@/lib/utils";');
    });

    it('should remove components and orphaned files via ProjectContext and VFS', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });

        const items: RegistryItem[] = [
            {
                name: 'button',
                dependencies: [],
                files: [
                    {
                        path: 'components/ui/button/Button.vue',
                        content: '<template><button /></template>',
                        type: 'components:ui',
                    },
                ],
            },
        ];

        const writeResult = await writeComponentFiles(ctx, items);
        await writeResult.transaction?.commit();

        const manifest = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '1.0.0',
                    registrySource: 'https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download',
                    integrity: 'sha256-dummyintegrityvalueforbuttoncomponent',
                    dependencies: [],
                    registryDependencies: [],
                    installedAt: '2026-08-18',
                    files: ['src/components/ui/button/Button.vue'],
                },
            },
        };
        await fs.writeJson(path.join(projectCwd, '.brutx/manifest.json'), manifest);

        const removal = await prepareRemoveComponents(ctx, ['button'], manifest as any);
        expect(removal.toRemove).toEqual(['button']);

        const result = await removeComponents(ctx, removal.toRemove, removal.orphanedFiles, {
            removeOrphaned: true,
        });

        expect(result.totalRemoved).toBe(1);
        const buttonFile = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(buttonFile)).toBe(false);
    });
});
