import { describe, expect, it, vi } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { BaselineProvider } from '../../src/lib/merge/baseline-provider.js';
import { MergeExecutor } from '../../src/lib/merge/merge-executor.js';
import { threeWayMerge } from '../../src/lib/merge/three-way-merge-engine.js';
import { ComponentMutationEngine } from '../../src/lib/services/component-mutation-engine.js';
import { getBaselineRelativePath, readManifest, updateInstalledComponents } from '../../src/lib/manifest.js';
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

    it('recovers an unchanged baseline during direct merge execution and replays it locally', async () => {
        const manifestContent = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: 'sha256-v1-hash',
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: ['components/ui/button/Button.vue'],
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
        const mockFetcher = vi.fn(async () => v1ButtonRegistryItem);
        const executor = new MergeExecutor({ fs, itemFetcher: mockFetcher });
        const projectRelativePath = ctx.toRelativePosixPath(
            await ctx.resolveTargetPath(v1ButtonRegistryItem.files[0].path)
        );

        const result = await executor.planAndExecute(ctx, 'button', v1ButtonRegistryItem);
        expect(result.plan.isFallback).toBe(false);
        expect(result.filesWritten).toEqual([]);

        const baselineRelativePath = `.brutx/baselines/button/${projectRelativePath}`;
        const healedBaselinePath = path.join(projectCwd, baselineRelativePath);
        expect(await fs.pathExists(healedBaselinePath)).toBe(true);
        expect(await fs.readFile(healedBaselinePath, 'utf-8')).toContain('class="bg-primary"');

        const healedManifest = await readManifest(projectCwd, fs);
        expect(healedManifest?.components.button.files).toEqual([projectRelativePath]);
        expect(healedManifest?.components.button.baselines).toEqual({
            [projectRelativePath]: baselineRelativePath,
        });

        const replayedResult = await new BaselineProvider({ fs, itemFetcher: mockFetcher }).getComponentBaseline(ctx, 'button');
        expect(replayedResult.status).toBe('ready');
        expect(replayedResult.files.get(projectRelativePath)).toBe(v1ButtonRegistryItem.files[0].content);
        expect(mockFetcher).toHaveBeenCalledTimes(1);
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

    it('preserves local bytes while an update transfers a shared file between installed components', async () => {
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
        });
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const shared = {
            ...v1ButtonRegistryItem.files[0],
            path: 'types/widget.ts',
            content: 'export const widget = true;\n',
        };
        const alphaFile = { ...shared, path: 'components/ui/alpha/Alpha.vue', content: '<template>alpha</template>\n' };
        const betaFile = { ...shared, path: 'components/ui/beta/Beta.vue', content: '<template>beta</template>\n' };
        const alpha = { ...v1ButtonRegistryItem, name: 'alpha', files: [alphaFile, shared], integrity: 'sha256-alpha' };
        const beta = { ...v1ButtonRegistryItem, name: 'beta', files: [betaFile], integrity: 'sha256-beta' };
        const source = 'official';
        const sharedPath = await ctx.resolveTargetPath(shared.path);
        const relativeSharedPath = ctx.toRelativePosixPath(sharedPath);

        const entries = await Promise.all([alpha, beta].map(async item => {
            const files = [];
            const baselines: Record<string, string> = {};
            for (const file of item.files) {
                const absolutePath = await ctx.resolveTargetPath(file.path);
                const relativePath = ctx.toRelativePosixPath(absolutePath);
                baselines[relativePath] = getBaselineRelativePath(item.name, relativePath);
                await fs.writeFile(absolutePath, file.content);
                await fs.writeFile(path.join(projectCwd, baselines[relativePath]), file.content);
                files.push(absolutePath);
            }
            return { item, registrySource: source, version: 'latest', files, baselines };
        }));
        await updateInstalledComponents(projectCwd, entries, {}, fs);
        const customizedShared = shared.content.replaceAll('\n', '\r\n') + 'export const custom = true;\r\n';
        await fs.writeFile(sharedPath, customizedShared);

        const alphaUpdate = { ...alpha, files: [alphaFile], integrity: 'sha256-alpha-v2' };
        const betaUpdate = { ...beta, files: [betaFile, shared], integrity: 'sha256-beta-v2' };
        const engine = new ComponentMutationEngine(ctx);
        const plan = await engine.planUpdate({
            components: [beta.name, alpha.name],
            registrySnapshots: new Map([alphaUpdate, betaUpdate].map(item => [item.name, { item, source }])),
        });
        const result = await engine.execute(plan, { skipDependencies: true });
        const manifest = await readManifest(projectCwd, fs);

        expect(result.succeeded).toEqual([beta.name, alpha.name]);
        expect(result.filesDeleted).toEqual([]);
        expect(result.conflicts).toEqual([]);
        expect(await fs.readFile(sharedPath)).toBe(customizedShared);
        expect(manifest?.components.alpha.files).not.toContain(relativeSharedPath);
        expect(manifest?.components.beta.files).toContain(relativeSharedPath);
        expect(await fs.readFile(path.join(projectCwd, getBaselineRelativePath(beta.name, relativeSharedPath)))).toBe(shared.content);
    });

    it('rejects an earlier engine update plan after a standalone merge commits the same source', async () => {
        const registryPath = v1ButtonRegistryItem.files[0].path;
        const relativePath = 'src/components/ui/button/Button.vue';
        const filePath = path.join(projectCwd, relativePath);
        const baselinePath = getBaselineRelativePath('button', relativePath);
        const baseline = v1ButtonRegistryItem.files[0].content;
        const committed = baseline.replace('class="bg-primary"', 'class="bg-primary local-first"');
        const modifiedItem = (content: string) => ({
            ...v1ButtonRegistryItem,
            files: [{ ...v1ButtonRegistryItem.files[0], path: registryPath, content }],
        });
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [filePath]: baseline,
            [path.join(projectCwd, baselinePath)]: baseline,
        });
        const source = 'official';
        await updateInstalledComponents(projectCwd, [{
            item: v1ButtonRegistryItem,
            registrySource: source,
            files: [filePath],
            version: '0.10.0',
            baselines: { [relativePath]: baselinePath },
        }], {}, fs);
        const manifestBefore = await readManifest(projectCwd, fs);
        const context = await ProjectContext.load(projectCwd, { fs });
        const engine = new ComponentMutationEngine(context);
        const upstream = modifiedItem(baseline.replace('<slot />', '<slot name="remote" />'));
        const held = await engine.planUpdate({
            components: ['button'],
            registrySnapshots: new Map([['button', { source, item: upstream }]]),
        });
        expect(held.files[0].action).toBe('merge');

        await new MergeExecutor({ fs }).planAndExecute(context, 'button', modifiedItem(committed));

        await expect(engine.execute(held, { skipDependencies: true })).rejects.toThrow('changed during merge planning');
        expect(await fs.readFile(filePath)).toBe(committed);
        expect(await readManifest(projectCwd, fs)).toEqual(manifestBefore);
    });

    it('mutation engine writes baselines and .gitattributes on component add', async () => {
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
        });

        const ctx = await ProjectContext.load(projectCwd, { fs });
        const engine = new ComponentMutationEngine(ctx);

        const targetPath = await ctx.resolveTargetPath(v1ButtonRegistryItem.files[0].path);
        const mockPlan = {
            items: [v1ButtonRegistryItem],
            files: [
                {
                    componentName: 'button',
                    filePath: targetPath,
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
        const projectRelativePath = ctx.toRelativePosixPath(
            await ctx.resolveTargetPath(v1ButtonRegistryItem.files[0].path)
        );
        const userSourcePath = path.join(projectCwd, projectRelativePath);
        expect(await fs.pathExists(userSourcePath)).toBe(true);

        // 2. 验证基线已写入 .brutx/baselines/
        const baselineRelativePath = `.brutx/baselines/button/${projectRelativePath}`;
        const baselinePath = path.join(projectCwd, baselineRelativePath);
        expect(await fs.pathExists(baselinePath)).toBe(true);
        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(v1ButtonRegistryItem.files[0].content);

        // 3. 验证 .brutx/.gitattributes 声明了 baselines/** -text
        const gitattributesPath = path.join(projectCwd, '.brutx/.gitattributes');
        expect(await fs.pathExists(gitattributesPath)).toBe(true);
        const gitattributes = await fs.readFile(gitattributesPath, 'utf-8');
        expect(gitattributes).toContain('baselines/** -text');

        // 4. 验证 manifest 记录了 baselines 引用
        const manifest = await readManifest(projectCwd, fs);
        expect(manifest?.components.button.baselines).toEqual({
            [projectRelativePath]: baselineRelativePath,
        });
    });
});
