import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { DirectoryMergePlanner } from '../../src/lib/merge/directory-merge-planner.js';
import type { ComponentBaselineResult } from '../../src/lib/merge/baseline-provider.js';
import type { BrutalistConfig, RegistryItem } from '../../src/lib/types.js';

describe('DirectoryMergePlanner', () => {
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/test-app' : '/workspace/test-app';

    const sampleConfig: BrutalistConfig = {
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

    it('plans clean 3-way merge and detects added new official files', async () => {
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const variantsPath = path.join(projectCwd, 'src/components/ui/button/button-variants.ts');

        const baseButton = '<template>\n  <button>Click</button>\n  <span>Label</span>\n</template>';
        const localButton = '<template>\n  <button class="local-custom">Click</button>\n  <span>Label</span>\n</template>';
        const remoteButton = '<template>\n  <button>Click</button>\n  <span class="remote-fix">Label</span>\n</template>';
        const localVariants = 'export const buttonVariants = () => "btn";';

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [buttonPath]: localButton,
            [variantsPath]: localVariants,
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });

        const remoteItem: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            dependencies: [],
            registryDependencies: [],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-mock',
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    type: 'registry:ui',
                    content: remoteButton,
                },
                {
                    path: 'components/ui/button/button-variants.ts',
                    type: 'registry:ui',
                    content: 'export const buttonVariants = () => "btn";',
                },
                {
                    // 官方新增的新文件
                    path: 'components/ui/button/button-types.ts',
                    type: 'registry:ui',
                    content: 'export type ButtonProps = {};',
                },
            ],
        };

        const baseline: ComponentBaselineResult = {
            componentName: 'button',
            version: '0.10.0',
            status: 'ready',
            files: new Map([
                ['components/ui/button/Button.vue', baseButton],
                ['Button.vue', baseButton],
                ['components/ui/button/button-variants.ts', 'export const buttonVariants = () => "btn";'],
                ['button-variants.ts', 'export const buttonVariants = () => "btn";'],
            ]),
        };

        const planner = new DirectoryMergePlanner({ fs });
        const plan = await planner.planComponentMerge(ctx, 'button', remoteItem, baseline);

        expect(plan.hasConflicts).toBe(false);
        expect(plan.totalFiles).toBe(3);
        expect(plan.addedFiles).toBe(1);

        const buttonRes = plan.files.find(f => f.filePath.endsWith('Button.vue'))!;
        expect(buttonRes.status).toBe('merged');
        expect(buttonRes.action).toBe('write');

        const newTypesRes = plan.files.find(f => f.filePath.endsWith('button-types.ts'))!;
        expect(newTypesRes.status).toBe('added');
        expect(newTypesRes.action).toBe('write');
        expect(newTypesRes.content).toBe('export type ButtonProps = {};');
    });

    it('safely deletes deprecated official files if local was unmodified', async () => {
        const deprecatedPath = path.join(projectCwd, 'src/components/ui/button/old-helper.ts');
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [deprecatedPath]: 'export const oldHelper = 1;',
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });

        const remoteItem: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            dependencies: [],
            registryDependencies: [],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-mock',
            files: [], // 官方已移除所有文件
        };

        const baseline: ComponentBaselineResult = {
            componentName: 'button',
            version: '0.10.0',
            status: 'ready',
            files: new Map([
                ['src/components/ui/button/old-helper.ts', 'export const oldHelper = 1;'],
                ['old-helper.ts', 'export const oldHelper = 1;'],
            ]),
        };

        const planner = new DirectoryMergePlanner({ fs });
        const plan = await planner.planComponentMerge(ctx, 'button', remoteItem, baseline);

        expect(plan.deletedFiles).toBe(1);
        const deprecatedRes = plan.files.find(f => f.filePath.endsWith('old-helper.ts'))!;
        expect(deprecatedRes.status).toBe('deleted');
        expect(deprecatedRes.action).toBe('delete');
    });

    it('retains deprecated official file with delete-skipped if local was modified', async () => {
        const deprecatedPath = path.join(projectCwd, 'src/components/ui/button/old-helper.ts');
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [deprecatedPath]: 'export const oldHelper = 1; // local customized',
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });

        const remoteItem: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            dependencies: [],
            registryDependencies: [],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-mock',
            files: [],
        };

        const baseline: ComponentBaselineResult = {
            componentName: 'button',
            version: '0.10.0',
            status: 'ready',
            files: new Map([
                ['src/components/ui/button/old-helper.ts', 'export const oldHelper = 1;'],
                ['old-helper.ts', 'export const oldHelper = 1;'],
            ]),
        };

        const planner = new DirectoryMergePlanner({ fs });
        const plan = await planner.planComponentMerge(ctx, 'button', remoteItem, baseline);

        expect(plan.deletedFiles).toBe(0);
        const deprecatedRes = plan.files.find(f => f.filePath.endsWith('old-helper.ts'))!;
        expect(deprecatedRes.status).toBe('delete-skipped');
        expect(deprecatedRes.action).toBe('skip');
    });

    it('gracefully degrades to 2-way diff when baseline status is fallback-diff', async () => {
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [buttonPath]: '<template><button>Old</button></template>',
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });

        const remoteItem: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            dependencies: [],
            registryDependencies: [],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-mock',
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    type: 'registry:ui',
                    content: '<template><button>New</button></template>',
                },
            ],
        };

        const fallbackBaseline: ComponentBaselineResult = {
            componentName: 'button',
            status: 'fallback-diff',
            files: new Map(),
        };

        const planner = new DirectoryMergePlanner({ fs });
        const plan = await planner.planComponentMerge(ctx, 'button', remoteItem, fallbackBaseline);

        expect(plan.isFallback).toBe(true);
        expect(plan.files[0].status).toBe('fallback-diff');
        expect(plan.files[0].action).toBe('write');
    });
});
