import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { MergeExecutor } from '../../src/lib/merge/merge-executor.js';
import type { BrutalistConfig, RegistryItem } from '../../src/lib/types.js';

describe('MergeExecutor', () => {
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

    const mockRemoteButton: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button component',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-mock-remote',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="btn">Click</button>\n  <span class="remote-badge">New</span>\n</template>',
            },
        ],
    };

    const mockBaseButton: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button component',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-mock-base',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="btn">Click</button>\n  <span>New</span>\n</template>',
            },
        ],
    };

    it('executes 3-way merge within a transaction, preserving local custom lines', async () => {
        const localButton = '<template>\n  <button class="btn local-track">Click</button>\n  <span>New</span>\n</template>';
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');

        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-mock-base',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
            [buttonPath]: localButton,
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const mockFetcher = async () => mockBaseButton;
        const executor = new MergeExecutor({ fs, itemFetcher: mockFetcher });

        const transaction = ctx.createTransaction();
        const { plan, filesWritten } = await executor.planAndExecute(
            ctx,
            'button',
            mockRemoteButton,
            { transaction }
        );

        expect(plan.hasConflicts).toBe(false);
        expect(filesWritten.length).toBe(1);

        await transaction.commit();

        const finalContent = await fs.readFile(buttonPath);
        // 本地类名 local-track 保留，远端类名 remote-badge 合入
        expect(finalContent).toContain('class="btn local-track"');
        expect(finalContent).toContain('class="remote-badge"');
    });

    it('blocks in CI mode when conflicts are detected and no strategy is provided', async () => {
        const localButton = '<template><button class="local-different">Click</button></template>';
        const buttonPath = path.join(projectCwd, 'src/components/ui/button/Button.vue');

        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-mock-base',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
            [buttonPath]: localButton,
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const mockFetcher = async () => mockBaseButton;
        const executor = new MergeExecutor({ fs, itemFetcher: mockFetcher });

        await expect(
            executor.planAndExecute(ctx, 'button', mockRemoteButton, { isCi: true })
        ).rejects.toThrow(/\[CI Blocked\]/);
    });
});
