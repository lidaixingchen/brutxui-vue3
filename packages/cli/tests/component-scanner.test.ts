import { describe, it, expect } from 'vitest';
import { MemoryFileSystemAdapter } from 'brutx-shared-vue/fs';
import { ProjectContext } from '../src/lib/project-context.js';
import { ComponentScanner, mapWithConcurrency, extractDependencies } from '../src/lib/component-scanner.js';
import type { BrutalistConfig } from '../src/lib/types.js';

function createMockConfig(): BrutalistConfig {
    return {
        $schema: 'https://example.com/schema.json',
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
    };
}

describe('ComponentScanner', () => {
    it('scans installed components directly via ProjectContext and VFS', async () => {
        const fs = new MemoryFileSystemAdapter();
        const cwd = '/test-project';

        await fs.ensureDir(`${cwd}/src/components/button`);
        await fs.writeFile(
            `${cwd}/src/components/button/button.vue`,
            '<template><button><slot /></button></template>',
        );
        await fs.writeFile(
            `${cwd}/src/components/button/index.ts`,
            "import { ref } from 'vue';\nimport { clsx } from 'clsx';\nexport const x = 1;",
        );

        await fs.ensureDir(`${cwd}/src/components/badge`);
        await fs.writeFile(
            `${cwd}/src/components/badge/badge.vue`,
            '<template><span><slot /></span></template>',
        );

        const ctx = await ProjectContext.loadUninitialized(cwd, {
            fs,
            configOverride: createMockConfig(),
        });

        const scanner = new ComponentScanner(ctx);
        const names = await scanner.getInstalledNames();
        expect(names).toEqual(['badge', 'button']);

        const infos = await scanner.getInstalledInfos();
        expect(infos).toHaveLength(2);

        const buttonInfo = infos.find(i => i.name === 'button');
        expect(buttonInfo).toBeDefined();
        expect(buttonInfo?.dependencies).toContain('vue');
        expect(buttonInfo?.dependencies).toContain('clsx');
        expect(buttonInfo?.files).toEqual(expect.arrayContaining(['button.vue', 'index.ts']));

        // 测试 ProjectContext 上的聚合门面方法
        const facadeNames = await ctx.getInstalledComponentNames();
        expect(facadeNames).toEqual(['badge', 'button']);

        const facadeInfos = await ctx.getInstalledComponentInfos();
        expect(facadeInfos).toHaveLength(2);
    });

    it('merges manifest metadata when manifest exists', async () => {
        const fs = new MemoryFileSystemAdapter();
        const cwd = '/test-project';

        await fs.ensureDir(`${cwd}/src/components/avatar`);
        await fs.writeFile(
            `${cwd}/src/components/avatar/avatar.vue`,
            '<template><img /></template>',
        );

        await fs.ensureDir(`${cwd}/.brutx`);
        await fs.writeJson(`${cwd}/.brutx/manifest.json`, {
            version: 1,
            components: {
                avatar: {
                    name: 'avatar',
                    version: '1.0.0',
                    registrySource: 'https://example.com/registry',
                    integrity: 'sha256-test',
                    dependencies: ['vue', '@radix-vue/avatar'],
                    registryDependencies: [],
                    examples: [],
                    files: ['avatar.vue'],
                    installedAt: '2026-09-10T00:00:00.000Z',
                },
            },
        });

        const ctx = await ProjectContext.loadUninitialized(cwd, {
            fs,
            configOverride: createMockConfig(),
        });

        const infos = await ctx.getInstalledComponentInfos();
        expect(infos).toHaveLength(1);
        expect(infos[0].name).toBe('avatar');
        expect(infos[0].version).toBe('1.0.0');
        expect(infos[0].managed).toBe(true);
        expect(infos[0].dependencies).toEqual(expect.arrayContaining(['vue', '@radix-vue/avatar']));
    });

    it('safely handles mapWithConcurrency when limit is zero or negative', async () => {
        const items = [1, 2, 3];
        const mapped = await mapWithConcurrency(items, 0, async (x) => x * 2);
        expect(mapped).toEqual([2, 4, 6]);
    });

    it('ignores virtual and framework aliases when extracting dependencies', async () => {
        const fs = new MemoryFileSystemAdapter();
        const componentDir = '/test-project/src/components/nuxt-box';

        await fs.ensureDir(componentDir);
        await fs.writeFile(
            `${componentDir}/nuxt-box.vue`,
            [
                '<script setup>',
                "import { ref } from 'vue';",
                "import { useNuxtApp } from '#app';",
                "import { myHelper } from '~/composables/helper';",
                "import { env } from '$lib/env';",
                "import { realPackage } from 'my-pkg/sub';",
                '</script>',
            ].join('\n'),
        );

        const deps = await extractDependencies(componentDir, fs);
        expect(deps).toContain('vue');
        expect(deps).toContain('my-pkg');
        expect(deps).not.toContain('#app');
        expect(deps).not.toContain('~');
        expect(deps).not.toContain('$lib');
    });
});
