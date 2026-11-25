import { describe, expect, it, vi } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { MergeExecutor } from '../../src/lib/merge/merge-executor.js';
import { getBaselineRelativePath, getManifestPath, updateInstalledComponents } from '../../src/lib/manifest.js';
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
        const baselinePath = path.join(projectCwd, '.brutx/baselines/button/src/components/ui/button/Button.vue');
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        const originalManifest = await fs.readFile(manifestPath);
        const dryRun = await executor.planAndExecute(ctx, 'button', mockRemoteButton, { dryRun: true });
        expect(dryRun.plan.baselineRecovery).toBeDefined();
        expect(await fs.pathExists(baselinePath)).toBe(false);
        expect(await fs.readFile(manifestPath)).toBe(originalManifest);

        const { plan, filesWritten } = await executor.planAndExecute(
            ctx,
            'button',
            mockRemoteButton,
            { transaction }
        );

        expect(plan.hasConflicts).toBe(false);
        expect(filesWritten.length).toBe(1);
        expect(await fs.readFile(baselinePath)).toBe(mockBaseButton.files[0].content);

        await transaction.commit();

        const finalContent = await fs.readFile(buttonPath);
        // 本地类名 local-track 保留，远端类名 remote-badge 合入
        expect(finalContent).toContain('class="btn local-track"');
        expect(finalContent).toContain('class="remote-badge"');
    });

    it('rolls back baseline recovery and the manifest when a standalone merge write fails', async () => {
        const relativePath = 'src/components/ui/button/Button.vue';
        const buttonPath = path.join(projectCwd, relativePath);
        const baselineDir = path.join(projectCwd, '.brutx/baselines/button');
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        const manifest = JSON.stringify({
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '0.10.0',
                    registrySource: 'official',
                    integrity: mockBaseButton.integrity,
                    installedAt: '2026-08-20T00:00:00.000Z',
                    files: [relativePath],
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        });
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [manifestPath]: manifest,
            [buttonPath]: mockBaseButton.files[0].content,
        });
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const executor = new MergeExecutor({ fs, itemFetcher: async () => mockBaseButton });
        const writeFile = fs.writeFile.bind(fs);
        vi.spyOn(fs, 'writeFile').mockImplementation(async (file, ...args) => {
            if (file === buttonPath) {
                expect(await fs.pathExists(path.join(baselineDir, relativePath))).toBe(true);
                throw new Error('source write failed');
            }
            return writeFile(file, ...args);
        });

        await expect(executor.planAndExecute(ctx, 'button', mockRemoteButton)).rejects.toThrow('source write failed');

        expect(await fs.pathExists(baselineDir)).toBe(false);
        expect(await fs.readFile(manifestPath)).toBe(manifest);
        expect(await fs.readFile(buttonPath)).toBe(mockBaseButton.files[0].content);
    });

    it('merges files with an unmapped project baseline and preserves siblings without one', async () => {
        const button = mockBaseButton.files[0];
        const options = { ...button, path: 'components/ui/button/options.ts', content: 'export const options = "old";\n' };
        const buttonPath = 'src/components/ui/button/Button.vue';
        const optionsPath = 'src/components/ui/button/options.ts';
        const remote = {
            ...mockRemoteButton,
            files: [mockRemoteButton.files[0], { ...options, content: 'export const options = "new";\n' }],
        };
        const localButton = button.content.replace('class="btn"', 'class="btn custom"');
        const localOptions = 'export const options = "local";\n';
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, buttonPath)]: localButton,
            [path.join(projectCwd, optionsPath)]: localOptions,
            [path.join(projectCwd, getBaselineRelativePath('button', buttonPath))]: button.content,
        });
        await updateInstalledComponents(projectCwd, [{
            item: { ...mockBaseButton, files: [button, options] },
            registrySource: 'historical-registry',
            files: [buttonPath, optionsPath].map(relativePath => path.join(projectCwd, relativePath)),
            version: '0.10.0',
        }], {}, fs);
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const fetcher = vi.fn(async () => { throw new Error('Historical registry unavailable'); });
        const executor = new MergeExecutor({ fs, itemFetcher: fetcher });

        const result = await executor.planAndExecute(ctx, 'button', remote, { registrySource: 'new-registry' });

        expect(result.filesWritten).toEqual([path.join(projectCwd, buttonPath)]);
        expect(await fs.readFile(path.join(projectCwd, buttonPath))).toBe(
            remote.files[0].content.replace('class="btn"', 'class="btn custom"'),
        );
        expect(await fs.readFile(path.join(projectCwd, optionsPath))).toBe(localOptions);
        expect(fetcher).toHaveBeenNthCalledWith(1, 'button', 'historical-registry', true, fs);
    });

    it('recovers only registered files from the historical source and leaves an unregistered sibling intact', async () => {
        const buttonPath = 'src/components/ui/button/Button.vue';
        const optionsPath = 'src/components/ui/button/options.ts';
        const options = {
            ...mockBaseButton.files[0],
            path: 'components/ui/button/options.ts',
            content: 'export const options = "local";\n',
        };
        const old = { ...mockBaseButton, files: [...mockBaseButton.files, options] };
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, buttonPath)]: old.files[0].content,
            [path.join(projectCwd, optionsPath)]: options.content,
        });
        await updateInstalledComponents(projectCwd, [{
            item: old,
            registrySource: 'historical-registry',
            files: [path.join(projectCwd, buttonPath)],
            version: '0.10.0',
        }], {}, fs);
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const fetcher = vi.fn(async (_name, source) => source === 'historical-registry' ? old : mockRemoteButton);
        const executor = new MergeExecutor({ fs, itemFetcher: fetcher });

        const result = await executor.planAndExecute(ctx, 'button', mockRemoteButton, { registrySource: 'new-registry' });

        expect(result.plan.baselineRecovery?.files.map(file => file.relativePath)).toEqual([buttonPath]);
        expect(result.filesDeleted).toEqual([]);
        expect(await fs.readFile(path.join(projectCwd, optionsPath))).toBe(options.content);
        expect(fetcher).toHaveBeenCalledExactlyOnceWith('button', 'historical-registry', true, fs);
    });

    it('rejects a standalone plan when a newer installation completes during planning', async () => {
        const relativePath = 'src/components/ui/button/Button.vue';
        const buttonPath = path.join(projectCwd, relativePath);
        const baselinePath = path.join(projectCwd, getBaselineRelativePath('button', relativePath));
        const manifestPath = getManifestPath(projectCwd);
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [buttonPath]: mockBaseButton.files[0].content,
            [baselinePath]: mockBaseButton.files[0].content,
        });
        const install = async (item: RegistryItem, version: string) => updateInstalledComponents(projectCwd, [{
            item,
            registrySource: 'official',
            files: [buttonPath],
            version,
        }], {}, fs);
        await install(mockBaseButton, '0.10.0');
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const executor = new MergeExecutor({ fs });
        const latest = { ...mockRemoteButton, integrity: 'sha256-v3' };
        const latestContent = '<template><button>v3</button></template>';
        const plan = executor.plan.bind(executor);
        vi.spyOn(executor, 'plan').mockImplementationOnce(async (...args) => {
            const oldPlan = await plan(...args);
            await install(latest, '0.12.0');
            await fs.writeFile(buttonPath, latestContent);
            await fs.writeFile(baselinePath, latestContent);
            return oldPlan;
        });

        await expect(executor.planAndExecute(ctx, 'button', mockRemoteButton)).rejects.toThrow('changed during merge planning');

        expect(await fs.readFile(buttonPath)).toBe(latestContent);
        expect(await fs.readFile(baselinePath)).toBe(latestContent);
        expect((await fs.readJson(manifestPath)).components.button.version).toBe('0.12.0');
    });

    it.each(['update', 'create', 'delete'] as const)('rejects a stale standalone %s after another merge has written the path', async (action) => {
        const file = mockBaseButton.files[0];
        const root = path.join(projectCwd, 'src');
        const relativePath = 'src/components/ui/button/Button.vue';
        const filePath = path.join(projectCwd, relativePath);
        const baselinePath = path.join(projectCwd, getBaselineRelativePath('button', relativePath));
        const baselineContent = '<template>\n  <button>first</button>\n  <span>second</span>\n</template>';
        const secondContent = baselineContent.replace('>second<', '>older plan<');
        const firstContent = baselineContent.replace('>first<', '>committed first<');
        const item = (content: string) => ({ ...mockBaseButton, files: [{ ...file, content }] });
        const original = action === 'create' ? { ...mockBaseButton, files: [] } : item(baselineContent);
        const originalPaths = action === 'create' ? [] : [filePath];
        const fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(root, 'entry.ts')]: '',
        });
        if (action !== 'create') {
            await fs.writeFile(filePath, baselineContent);
            await fs.writeFile(baselinePath, baselineContent);
        }
        await updateInstalledComponents(projectCwd, [{
            item: original,
            registrySource: 'official',
            files: originalPaths,
            version: '0.10.0',
        }], {}, fs);
        const originalManifest = await fs.readFile(getManifestPath(projectCwd));
        const ctx = await ProjectContext.load(projectCwd, { fs });
        const first = new MergeExecutor({ fs });
        const older = new MergeExecutor({ fs });
        const originalPlan = older.plan.bind(older);
        vi.spyOn(older, 'plan').mockImplementationOnce(async (...args) => {
            const plan = await originalPlan(...args);
            expect(plan.files.find(result => result.filePath === relativePath)?.action)
                .toBe(action === 'delete' ? 'delete' : 'write');
            const committed = await first.planAndExecute(ctx, 'button', item(firstContent));
            expect(committed.filesWritten).toEqual([filePath]);
            return plan;
        });

        const olderRemote = action === 'delete' ? { ...mockRemoteButton, files: [] } : item(secondContent);
        await expect(older.planAndExecute(ctx, 'button', olderRemote)).rejects.toThrow('changed during merge planning');
        expect(await fs.readFile(filePath)).toBe(firstContent);
        expect(await fs.readFile(getManifestPath(projectCwd))).toBe(originalManifest);
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
