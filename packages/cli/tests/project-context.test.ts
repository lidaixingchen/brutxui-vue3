import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import type { BrutalistConfig } from '../src/lib/types.js';

describe('ProjectContext', () => {
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

    const sampleTsConfig = {
        compilerOptions: {
            baseUrl: '.',
            paths: {
                '@/*': ['./src/*'],
            },
        },
    };

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'my-vue-app',
                dependencies: { vue: '^3.5.0' },
            }),
            [path.join(projectCwd, 'pnpm-lock.yaml')]: '',
            [path.join(projectCwd, 'tsconfig.json')]: JSON.stringify(sampleTsConfig),
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, 'src/assets/main.css')]: '@import "tailwindcss";',
        });
    });

    it('should load initialized project and detect environment', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });

        expect(ctx.isConfigured).toBe(true);
        expect(ctx.config).toEqual(sampleConfig);
        expect(ctx.requireConfig()).toEqual(sampleConfig);
        expect(ctx.env.packageManager).toBe('pnpm');
        expect(ctx.env.projectType).toBe('vite-vue-src');
        expect(ctx.env.hasSrc).toBe(true);
        expect(ctx.env.isNuxt).toBe(false);
    });

    it('should throw when loading uninitialized project via ProjectContext.load', async () => {
        await fs.remove(path.join(projectCwd, 'components.json'));

        await expect(ProjectContext.load(projectCwd, { fs })).rejects.toThrow(/components\.json not found/);
    });

    it('should load uninitialized project and support bindConfig', async () => {
        await fs.remove(path.join(projectCwd, 'components.json'));

        const ctx = await ProjectContext.loadUninitialized(projectCwd, { fs });
        expect(ctx.isConfigured).toBe(false);
        expect(ctx.config).toBeUndefined();
        expect(() => ctx.requireConfig()).toThrow(/not initialized/);

        ctx.bindConfig(sampleConfig);
        expect(ctx.isConfigured).toBe(true);
        expect(ctx.config).toEqual(sampleConfig);
        expect(ctx.requireConfig()).toEqual(sampleConfig);
    });

    it('should resolve target paths accurately for all registry types', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });

        const componentPath = await ctx.resolveTargetPath('components/ui/button/Button.vue');
        expect(ctx.toRelativePosixPath(componentPath)).toBe('src/components/ui/button/Button.vue');

        const composablePath = await ctx.resolveTargetPath('composables/useToast.ts');
        expect(ctx.toRelativePosixPath(composablePath)).toBe('src/composables/useToast.ts');

        const localePath = await ctx.resolveTargetPath('locales/zh-CN.ts');
        expect(ctx.toRelativePosixPath(localePath)).toBe('src/locales/zh-CN.ts');

        const directivePath = await ctx.resolveTargetPath('directives/loading.ts');
        expect(ctx.toRelativePosixPath(directivePath)).toBe('src/directives/loading.ts');

        const utilsPath = await ctx.resolveTargetPath('lib/utils.ts');
        expect(ctx.toRelativePosixPath(utilsPath)).toBe('src/lib/utils.ts');

        const libFilePath = await ctx.resolveTargetPath('lib/format-date.ts');
        expect(ctx.toRelativePosixPath(libFilePath)).toBe('src/lib/format-date.ts');
    });

    it('should resolve target paths with sharedBase configuration', async () => {
        const sharedConfig: BrutalistConfig = {
            ...sampleConfig,
            sharedBase: '@/shared',
        };
        await fs.writeJson(path.join(projectCwd, 'components.json'), sharedConfig);

        const ctx = await ProjectContext.load(projectCwd, { fs });

        const composablePath = await ctx.resolveTargetPath('composables/useToast.ts');
        expect(ctx.toRelativePosixPath(composablePath)).toBe('src/shared/hooks/useToast.ts');

        const utilsPath = await ctx.resolveTargetPath('lib/utils.ts');
        expect(ctx.toRelativePosixPath(utilsPath)).toBe('src/shared/utils.ts');

        const libPath = await ctx.resolveTargetPath('lib/math.ts');
        expect(ctx.toRelativePosixPath(libPath)).toBe('src/shared/lib/math.ts');
    });

    it('should resolve import aliases in source code', async () => {
        const customConfig: BrutalistConfig = {
            ...sampleConfig,
            aliases: {
                components: '@/ui/components',
                utils: '@/custom/utils',
                composables: '@/custom/composables',
            },
        };
        await fs.writeJson(path.join(projectCwd, 'components.json'), customConfig);

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const sourceCode = `
<script setup lang="ts">
import { cn } from '@/lib/utils';
import { useToast } from '@/composables/useToast';
import { Button } from '@/components/ui/button';
</script>
<template><Button /></template>
`;

        const rewritten = ctx.resolveImportAlias(sourceCode);
        expect(rewritten).toContain("import { cn } from '@/custom/utils';");
        expect(rewritten).toContain("import { useToast } from '@/custom/composables/useToast';");
        expect(rewritten).toContain("import { Button } from '@/ui/components/ui/button';");
    });

    it('should create FileTransaction bound to context VFS', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const tx = ctx.createTransaction();

        const testFile = path.join(projectCwd, 'src/test.txt');
        await tx.writeFile(testFile, 'hello tx');
        await tx.commit();

        expect(await fs.readFile(testFile)).toBe('hello tx');
    });
});
