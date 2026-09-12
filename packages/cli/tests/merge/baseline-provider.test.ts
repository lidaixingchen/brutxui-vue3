import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { BaselineProvider } from '../../src/lib/merge/baseline-provider.js';
import type { BrutalistConfig, RegistryItem } from '../../src/lib/types.js';

describe('BaselineProvider', () => {
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
            components: '~/custom-components',
            utils: '~/shared/utils',
            composables: '~/shared/composables',
        },
    };

    const mockButtonRegistryItem: RegistryItem = {
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
                content: '<script setup>\nimport { cn } from "@/lib/utils";\n</script>',
            },
            {
                path: 'components/ui/button/index.ts',
                type: 'registry:ui',
                content: 'export { default as Button } from "@/components/Button.vue";',
            },
        ],
    };

    it('returns fallback-diff when manifest or version does not exist', async () => {
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
        });

        const ctx = await ProjectContext.loadUninitialized(projectCwd, { fs, configOverride: sampleConfig });
        const provider = new BaselineProvider({ fs });

        const result = await provider.getComponentBaseline(ctx, 'button');
        expect(result.status).toBe('fallback-diff');
        expect(result.files.size).toBe(0);
    });

    it.each([
        {
            name: 'reconstructs Base in memory and applies dynamic Alias re-projection',
            integrity: mockButtonRegistryItem.integrity,
            expectedStatus: 'ready',
        },
        {
            name: 'returns fallback-diff and preserves local state when integrity differs',
            integrity: 'sha256-different-content',
            expectedStatus: 'fallback-diff',
        },
    ])('$name', async ({ integrity, expectedStatus }) => {
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity,
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue', 'src/components/ui/button/index.ts'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const mockFetcher = async () => mockButtonRegistryItem;
        const provider = new BaselineProvider({ fs, itemFetcher: mockFetcher });

        const result = await provider.getComponentBaseline(ctx, 'button');
        expect(result.status).toBe(expectedStatus);
        expect(result.version).toBe('0.10.0');

        if (expectedStatus === 'fallback-diff') {
            expect(result.files.size).toBe(0);
            expect(result.message).toContain('integrity mismatch');
            expect(await fs.pathExists(path.join(projectCwd, '.brutx/baselines/button'))).toBe(false);
            return;
        }

        expect(result.files.has('Button.vue')).toBe(true);

        const projectedButton = result.files.get('Button.vue')!;
        // 验证别名已动态重投影为当前 components.json 中的 ~/shared/utils
        expect(projectedButton).toContain('import { cn } from "~/shared/utils";');
        expect(projectedButton).not.toContain('@/lib/utils');
    });

    it('gracefully degrades to fallback-diff if fetcher throws', async () => {
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'offline-source',
                    integrity: 'sha256-mock-integrity',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['Button.vue'],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const throwingFetcher = async () => {
            throw new Error('Network unreachable');
        };
        const provider = new BaselineProvider({ fs, itemFetcher: throwingFetcher });

        const result = await provider.getComponentBaseline(ctx, 'button');
        expect(result.status).toBe('fallback-diff');
        expect(result.files.size).toBe(0);
    });
});
