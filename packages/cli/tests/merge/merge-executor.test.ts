import { describe, expect, it, vi } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../../src/lib/project-context.js';
import { MergeExecutor } from '../../src/lib/merge/merge-executor.js';
import { getBaselineRelativePath, getManifestPath, readManifest, updateInstalledComponents } from '../../src/lib/manifest.js';
import { ComponentMutationEngine } from '../../src/lib/services/component-mutation-engine.js';
import type { BrutalistConfig, RegistryItem, RegistryItemSnapshot } from '../../src/lib/types.js';

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

    it.each(['applied', 'legacy baseline', 'local edit', 'pending owner', 'older owner', 'missing baseline'] as const)(
        'plans a shared-file update across transactions in the same millisecond with %s', async scenario => {
            const shared = (value: string): RegistryItem['files'][number] => ({
                path: 'lib/shared.ts',
                content: `export const value = '${value}';\n`,
                type: 'registry:lib',
            });
            const v1 = shared('v1');
            const v2 = shared('v2');
            const v3 = shared('v3');
            const helper = { ...v2, path: 'components/ui/button/helper.ts', type: 'registry:ui' as const };
            const button = (version: string, ...files: RegistryItem['files']): RegistryItem => ({
                ...mockBaseButton, integrity: `sha256-button-${version}`, files: [...mockBaseButton.files, ...files],
            });
            const owner = (name: string, version: string, file: RegistryItem['files'][number]): RegistryItem => ({
                ...mockBaseButton, name, integrity: `sha256-${name}-${version}`, files: [
                    { ...mockBaseButton.files[0], path: `components/ui/${name}/${name}.vue` }, file,
                ],
            });
            const firstVersion = '0.10.0';
            const partialVersion = '0.11.0';
            const latestVersion = '0.12.0';
            const source = 'https://registry.example.com';
            const items = new Map<string, RegistryItem>([
                ['button', button(firstVersion, v1)],
                ['card', owner('card', firstVersion, v1)],
                ['badge', owner('badge', firstVersion, v1)],
            ]);
            let version = firstVersion;
            const fs = new MemoryFileSystemAdapter({
                [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
                [path.join(projectCwd, 'src/lib/utils.ts')]: '',
            });
            const context = await ProjectContext.load(projectCwd, { fs });
            const sharedPath = await context.resolveTargetPath(v1.path);
            const relativePath = context.toRelativePosixPath(sharedPath);
            const snapshot = (item: RegistryItem): RegistryItemSnapshot => ({ item, source, version });
            vi.spyOn(context.registry, 'resolve').mockImplementation(async components => {
                const selected = components.map(name => items.get(name)!);
                return {
                    items: selected,
                    npmDependencies: [],
                    registryDependencies: [],
                    missingComponents: [],
                    hitSources: new Map(selected.map(item => [item.name, source])),
                    itemSnapshots: new Map(selected.map(item => [item.name, snapshot(item)])),
                };
            });
            vi.spyOn(context.registry, 'fetchItemWithMeta').mockImplementation(async name => snapshot(items.get(name)!));
            const historicalFetch = vi.spyOn(context.registry, 'fetchItem').mockRejectedValue(new Error('Unexpected historical fetch'));
            const engine = new ComponentMutationEngine(context);
            const options = { skipDependencies: true };
            const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-08-20T00:00:00Z'));
            try {
                await engine.execute(await engine.planInstall({ components: [...items.keys()] }), options);
                version = partialVersion;
                items.set('button', button(partialVersion, v2, helper));
                const partial = await engine.execute(await engine.planInstall({ components: ['button'] }), options);
                expect(partial.partial).toEqual([{ component: 'button', pendingFiles: [relativePath] }]);
                expect(await fs.readFile(sharedPath)).toBe(v1.content);

                items.set('card', owner('card', partialVersion, v2));
                await engine.execute(await engine.planUpdate({ components: ['card'], acrossVersions: true }), options);
                expect(await fs.readFile(sharedPath)).toBe(v2.content);

                const manifest = (await readManifest(projectCwd, fs))!;
                const card = manifest.components.card;
                if (scenario === 'legacy baseline') {
                    await fs.remove(path.join(projectCwd, card.baselines![relativePath]));
                    await fs.writeFile(path.join(projectCwd, getBaselineRelativePath('card', path.posix.basename(relativePath))), v2.content);
                    delete card.baselines;
                } else if (scenario === 'local edit') {
                    await fs.writeFile(sharedPath, shared('custom').content);
                } else if (scenario === 'pending owner') {
                    card.pendingFiles = [relativePath];
                } else if (scenario === 'older owner') {
                    card.installedAt = manifest.components.badge.installedAt;
                } else if (scenario === 'missing baseline') {
                    await fs.remove(path.join(projectCwd, card.baselines![relativePath]));
                }
                await fs.writeJson(getManifestPath(projectCwd), manifest);
                const cardPath = context.toRelativePosixPath(await context.resolveTargetPath(items.get('card')!.files[0].path));
                await fs.remove(path.join(projectCwd, getBaselineRelativePath('card', cardPath)));

                version = latestVersion;
                items.set('button', button(latestVersion, v3, helper));
                const plan = await engine.planUpdate({ components: ['button'], acrossVersions: true });
                const sharedUpdate = plan.files.find(file => file.filePath === sharedPath);
                const mayAdvance = scenario === 'applied' || scenario === 'legacy baseline';
                expect(sharedUpdate?.hasConflicts).toBe(!mayAdvance);
                expect(plan.installedIdentities?.has('card')).toBe(mayAdvance);
                expect(plan.installedIdentities?.has('badge')).toBe(false);
                expect(historicalFetch).not.toHaveBeenCalled();

                if (mayAdvance) {
                    await engine.execute(plan, options);
                    expect(await fs.readFile(sharedPath)).toBe(v3.content);
                    const updated = await readManifest(projectCwd, fs);
                    expect(updated?.components.button.version).toBe(latestVersion);
                    expect(updated?.components.button.pendingFiles).toBeUndefined();
                    expect(await fs.readFile(path.join(projectCwd, getBaselineRelativePath('button', relativePath)))).toBe(v3.content);
                } else {
                    expect(sharedUpdate?.mergedContent).toContain(scenario === 'local edit' ? "'custom'" : "'v2'");
                    expect(sharedUpdate?.mergedContent).toContain('<<<<<<< LOCAL');
                }
            } finally {
                clock.mockRestore();
            }
        },
    );

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
