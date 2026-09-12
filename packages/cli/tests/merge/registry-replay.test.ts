import { describe, expect, it } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { BaselineProvider } from '../../src/lib/merge/baseline-provider.js';
import { threeWayMerge } from '../../src/lib/merge/three-way-merge-engine.js';
import { ComponentMutationEngine } from '../../src/lib/services/component-mutation-engine.js';
import type { BrutalistConfig, RegistryItem } from '../../src/lib/types.js';

describe('Registry Replay & Deterministic 3-Way Merge', () => {
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

    const v1ButtonRegistryItem: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button v1',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-v1-hash',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="bg-primary">\n    <slot />\n  </button>\n</template>',
            },
        ],
    };

    const v2ButtonRegistryItem: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button v2',
        dependencies: [],
        registryDependencies: [],
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-v2-hash',
        files: [
            {
                path: 'components/ui/button/Button.vue',
                type: 'registry:ui',
                content: '<template>\n  <button class="bg-primary" data-variant="brutal">\n    <slot />\n  </button>\n</template>',
            },
        ],
    };

    it('reads local baseline from .brutx/baselines/ without calling network fetcher', async () => {
        const localBaselineContent = '<template>\n  <button class="bg-primary">\n    <slot />\n  </button>\n</template>';
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-v1-hash',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['src/components/ui/button/Button.vue'],
                    baselines: {
                        'Button.vue': '.brutx/baselines/button/Button.vue',
                    },
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        };

        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, '.brutx/manifest.json')]: JSON.stringify(manifestContent),
            [path.join(projectCwd, '.brutx/baselines/button/Button.vue')]: localBaselineContent,
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        // 传入抛错的 fetcher，证明优先读取本地基线且未触发网络请求
        const networkThrowingFetcher = async () => {
            throw new Error('Network should not be called when local baseline exists!');
        };
        const provider = new BaselineProvider({ fs, itemFetcher: networkThrowingFetcher });

        const result = await provider.getComponentBaseline(ctx, 'button');
        expect(result.status).toBe('ready');
        expect(result.files.get('Button.vue')).toBe(localBaselineContent);
    });

    it('safely auto-heals missing local baseline by fetching registry and writing to .brutx/baselines/', async () => {
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-v1-hash',
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
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const mockFetcher = async () => v1ButtonRegistryItem;
        const provider = new BaselineProvider({ fs, itemFetcher: mockFetcher });

        const result = await provider.getComponentBaseline(ctx, 'button');
        expect(result.status).toBe('ready');
        expect(result.files.has('Button.vue')).toBe(true);

        // 验证已自动在磁盘补齐本地基线
        const healedBaselinePath = path.join(projectCwd, '.brutx/baselines/button/Button.vue');
        expect(await fs.pathExists(healedBaselinePath)).toBe(true);
        expect(await fs.readFile(healedBaselinePath, 'utf-8')).toContain('class="bg-primary"');
    });

    it('performs deterministic 3-way merge preserving user local changes while applying official upgrade', async () => {
        const baseContent = [
            '<template>',
            '  <button class="bg-primary">',
            '    <slot />',
            '  </button>',
            '  <span class="icon">Icon</span>',
            '</template>',
        ].join('\n');

        // 用户在本地添加了 custom-shadow class 到 button
        const userModifiedContent = [
            '<template>',
            '  <button class="bg-primary custom-shadow">',
            '    <slot />',
            '  </button>',
            '  <span class="icon">Icon</span>',
            '</template>',
        ].join('\n');

        // 官方 v2 在不同行 (span) 添加了 data-variant="brutal"
        const upstreamV2Content = [
            '<template>',
            '  <button class="bg-primary">',
            '    <slot />',
            '  </button>',
            '  <span class="icon" data-variant="brutal">Icon</span>',
            '</template>',
        ].join('\n');

        const mergeResult = threeWayMerge(baseContent, userModifiedContent, upstreamV2Content, {
            filePath: 'Button.vue',
        });

        expect(mergeResult.hasConflicts).toBe(false);
        // 成功保留用户修改并且合并上游改动
        expect(mergeResult.content).toContain('custom-shadow');
        expect(mergeResult.content).toContain('data-variant="brutal"');
    });

    it('mutation engine writes baselines and .gitattributes on component add', async () => {
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const engine = new ComponentMutationEngine(ctx);

        const mockPlan = {
            items: [v1ButtonRegistryItem],
            files: [
                {
                    componentName: 'button',
                    filePath: path.join(projectCwd, 'src/components/ui/button/Button.vue'),
                    action: 'create' as const,
                    sourceContent: v1ButtonRegistryItem.files[0].content,
                },
            ],
            npmDependencies: [],
            ensureUtils: false,
            updateSnippets: false,
            registrySources: { button: 'https://example.com' },
            versionByName: new Map([['button', '0.11.2']]),
            warnings: [],
        };

        const result = await engine.execute(mockPlan);
        expect(result.succeeded).toContain('button');

        // 1. 验证源码已写入
        const userSourcePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(userSourcePath)).toBe(true);

        // 2. 验证基线已写入 .brutx/baselines/
        const baselinePath = path.join(projectCwd, '.brutx/baselines/button/Button.vue');
        expect(await fs.pathExists(baselinePath)).toBe(true);
        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(v1ButtonRegistryItem.files[0].content);

        // 3. 验证 .brutx/.gitattributes 声明了 baselines/** -text
        const gitattributesPath = path.join(projectCwd, '.brutx/.gitattributes');
        expect(await fs.pathExists(gitattributesPath)).toBe(true);
        const gitattributes = await fs.readFile(gitattributesPath, 'utf-8');
        expect(gitattributes).toContain('baselines/** -text');

        // 4. 验证 manifest 记录了 baselines 引用
        const manifestRaw = await fs.readFile(path.join(projectCwd, '.brutx/manifest.json'), 'utf-8');
        const manifest = JSON.parse(manifestRaw);
        expect(manifest.components.button.baselines['Button.vue']).toBe('.brutx/baselines/button/Button.vue');
    });
});
