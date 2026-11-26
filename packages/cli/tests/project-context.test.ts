import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { readConfig } from '../src/lib/config.js';
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
        expect(ctx.registry).toBeDefined();
        expect(ctx.registry).toBe(ctx.registry);
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

        const typesPath = await ctx.resolveTargetPath('types/tree.ts');
        expect(ctx.toRelativePosixPath(typesPath)).toBe('src/types/tree.ts');
        expect(ctx.transformImports("import type { TreeNode } from '@/types/tree'", 'file.ts'))
            .toContain("from '@/types/tree'");
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

        const typesPath = await ctx.resolveTargetPath('types/tree.ts');
        expect(ctx.toRelativePosixPath(typesPath)).toBe('src/shared/types/tree.ts');
        expect(ctx.transformImports("import type { TreeNode } from '@/types/tree'", 'file.ts'))
            .toContain("from '@/shared/types/tree'");
    });

    it('projects registry files and imports under a custom tsconfig alias', async () => {
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), {
            compilerOptions: { paths: { '#/*': ['./src/*'] } },
        });
        const ctx = await ProjectContext.load(projectCwd, {
            fs,
            configOverride: {
                ...sampleConfig,
                aliases: {
                    components: '#/components',
                    utils: '#/lib/utils',
                    composables: '#/composables',
                },
                sharedBase: '#/components/brutx/shared',
            },
        });

        expect(ctx.toRelativePosixPath(await ctx.resolveTargetPath('components/ui/button/Button.vue')))
            .toBe('src/components/ui/button/Button.vue');
        expect(ctx.toRelativePosixPath(await ctx.resolveTargetPath('composables/useToast.ts')))
            .toBe('src/components/brutx/shared/hooks/useToast.ts');
        expect(ctx.toRelativePosixPath(await ctx.resolveUtilsFilePath()))
            .toBe('src/components/brutx/shared/utils.ts');
        expect(ctx.transformImports("import { cn } from '@/lib/utils'", 'file.ts'))
            .toContain("from '#/components/brutx/shared/utils'");
    });

    it('prioritizes exact paths, then the longest matching wildcard prefix', async () => {
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), {
            compilerOptions: {
                paths: {
                    'app/*': ['./src/*'],
                    'app/ui/*': ['./overrides/*', './src/widgets/*'],
                    'app/ui/*.test': ['./tests/*'],
                    'app/ui/special': ['./src/special'],
                    'app/static/*': ['./src/static'],
                },
            },
        });
        await fs.ensureDir(path.join(projectCwd, 'src/widgets/button'));
        const ctx = await ProjectContext.load(projectCwd, { fs });

        const cases = {
            'app/ui/special': 'src/special',
            'app/ui/button': 'src/widgets/button',
            'app/ui/button.test': 'overrides/button.test',
            'app/elsewhere': 'src/elsewhere',
            'app/static/ignored': 'src/static',
            './app/elsewhere': 'app/elsewhere',
            'src/components': 'src/components',
        };
        for (const [specifier, expected] of Object.entries(cases)) {
            expect(ctx.toRelativePosixPath(await ctx.resolveAliasPath(specifier))).toBe(expected);
        }
    });

    it.each([
        { baseUrl: undefined, target: '../src/*' },
        { baseUrl: '../src', target: './*' },
    ])('uses the declaring tsconfig directory with baseUrl $baseUrl', async ({ baseUrl, target }) => {
        await fs.writeJson(path.join(projectCwd, 'configs/base.json'), {
            compilerOptions: { baseUrl, paths: { 'app/*': [target] } },
        });
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), { extends: './configs/base.json' });
        const ctx = await ProjectContext.load(projectCwd, { fs });

        expect(ctx.toRelativePosixPath(await ctx.resolveAliasPath('app/components'))).toBe('src/components');
    });

    it('applies inherited paths from each extends entry in order', async () => {
        await fs.writeJson(path.join(projectCwd, 'configs/common.json'), {
            compilerOptions: { paths: { '#/*': ['../src/common/*'] } },
        });
        await fs.writeJson(path.join(projectCwd, 'configs/left.json'), {
            extends: './common.json',
            compilerOptions: { paths: { '#/*': ['../src/left/*'] } },
        });
        await fs.writeJson(path.join(projectCwd, 'configs/right.json'), { extends: './common.json' });
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), {
            extends: ['./configs/left.json', './configs/right.json'],
        });
        const ctx = await ProjectContext.load(projectCwd, { fs });

        expect(ctx.toRelativePosixPath(await ctx.resolveAliasPath('#/components'))).toBe('src/common/components');
    });

    it('rejects a custom alias target outside the project', async () => {
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), {
            compilerOptions: { paths: { '#/*': ['../outside/*'] } },
        });
        const ctx = await ProjectContext.load(projectCwd, { fs });

        await expect(ctx.resolveAliasPath('#/components')).rejects.toMatchObject({ code: 'PATH_UNSAFE' });
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

    it('carries parsed locale and directive aliases into the project context', async () => {
        const customConfig: BrutalistConfig = {
            ...sampleConfig,
            aliases: {
                ...sampleConfig.aliases,
                locales: '@/i18n/locales',
                directives: '@/framework/directives',
            },
        };
        await fs.writeJson(path.join(projectCwd, 'components.json'), customConfig);

        const parsedConfig = await readConfig(projectCwd, fs);
        const context = await ProjectContext.loadUninitialized(projectCwd, {
            fs,
            configOverride: parsedConfig,
        });

        expect(context.requireConfig().aliases).toEqual(parsedConfig.aliases);
        expect(context.toRelativePosixPath(await context.resolveTargetPath('locales/zh-CN.ts')))
            .toBe('src/i18n/locales/zh-CN.ts');
        expect(context.toRelativePosixPath(await context.resolveTargetPath('directives/loading.ts')))
            .toBe('src/framework/directives/loading.ts');
        const rewritten = context.transformImports(
            "import locale from '@/locales/zh-CN';\nimport { vLoading } from '@/directives/loading';",
            'aliases.ts',
        );
        expect(rewritten).toContain("from '@/i18n/locales/zh-CN'");
        expect(rewritten).toContain("from '@/framework/directives/loading'");
    });

    it('resolves wildcard alias suffixes containing replacement markers literally', async () => {
        const context = await ProjectContext.load(projectCwd, { fs });
        const aliasPath = '@/locales/$&.ts';

        expect(context.toRelativePosixPath(await context.resolveAliasPath(aliasPath)))
            .toBe('src/locales/$&.ts');
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
