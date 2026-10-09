import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { ComponentMutationEngine } from '../src/lib/services/component-mutation-engine.js';
import type { BrutalistConfig, RegistryItem, RegistryItemSnapshot } from '../src/lib/types.js';
import type { RegistryClient } from '../src/lib/registry-client.js';
import { BaselineProvider } from '../src/lib/merge/baseline-provider.js';
import { diffComponent } from '../src/lib/services/diff-service.js';
import { CliError } from '../src/lib/error.js';

describe('ComponentMutationEngine (VFS Zero-IO)', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/test-app' : '/workspace/test-app';

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

    const buttonFiles = [
        {
            path: 'components/ui/button/Button.vue',
            content: "<template><button class=\"btn\">Button</button></template>\n",
            type: 'registry:ui' as const,
        },
    ];

    const buttonItem: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button component',
        dependencies: ['clsx', 'tailwind-merge'],
        registryDependencies: [],
        examples: [],
        tailwind: {},
        cssVars: {},
        files: buttonFiles,
        integrity: computeRegistryIntegrity(buttonFiles),
    };

    function setupMockRegistry(context: ProjectContext, items: RegistryItem[] = [buttonItem]) {
        const mockClient = {
            resolve: vi.fn().mockResolvedValue({
                items,
                npmDependencies: ['clsx', 'tailwind-merge'],
                registryDependencies: [],
                missingComponents: [],
                hitSources: new Map(items.map(i => [i.name, 'https://registry.example.com'])),
            }),
            fetchItem: vi.fn().mockImplementation(async (name: string) => {
                const found = items.find(i => i.name === name);
                if (found) return found;
                return buttonItem;
            }),
            fetchItemWithMeta: vi.fn().mockImplementation(async (name: string) => ({
                item: items.find(i => i.name === name) ?? buttonItem,
                source: 'https://registry.example.com',
            })),
        } as unknown as RegistryClient;

        vi.spyOn(context, 'getRegistryClient').mockReturnValue(mockClient);
        return mockClient;
    }

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'test-app',
                dependencies: { vue: '^3.5.0' },
            }),
            [path.join(projectCwd, 'pnpm-lock.yaml')]: '',
            [path.join(projectCwd, 'tsconfig.json')]: JSON.stringify({
                compilerOptions: {
                    baseUrl: '.',
                    paths: { '@/*': ['./src/*'] },
                },
            }),
            [path.join(projectCwd, 'components.json')]: JSON.stringify(sampleConfig),
            [path.join(projectCwd, 'src/assets/main.css')]: '@import "tailwindcss";\n',
        });
    });

    it('planInstall should calculate execution plan purely in memory without disk side-effects', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({
            components: ['button'],
        });

        expect(plan.items).toHaveLength(1);
        expect(plan.items[0].name).toBe('button');
        expect(plan.npmDependencies).toEqual(['clsx', 'tailwind-merge']);
        expect(plan.ensureUtils).toBe(true);
        expect(plan.files).toHaveLength(1);
        expect(plan.files[0].action).toBe('create');

        // 验证 Plan 阶段零副作用
        const expectedFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(expectedFilePath)).toBe(false);
        const expectedUtilsPath = path.join(projectCwd, 'src/lib/utils.ts');
        expect(await fs.pathExists(expectedUtilsPath)).toBe(false);
    });

    it('execute should atomically commit component files, utils file, and manifest', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });

        const result = await engine.execute(plan, { skipDependencies: true });

        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(true);

        const expectedFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(expectedFilePath)).toBe(true);

        const expectedUtilsPath = path.join(projectCwd, 'src/lib/utils.ts');
        expect(await fs.pathExists(expectedUtilsPath)).toBe(true);

        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestPath)).toBe(true);
        const manifest = await fs.readJson(manifestPath);
        expect(manifest.components.button).toBeDefined();
        expect(manifest.components.button.installedContentHash).toBeDefined();
    });

    it('execute with dryRun should not write any files to disk or update manifest', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });

        const result = await engine.execute(plan, { dryRun: true });

        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(false);

        const expectedFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(expectedFilePath)).toBe(false);
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestPath)).toBe(false);
    });

    it('planInstall should respect overwrite: false and skip existing files', async () => {
        const targetFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        await fs.ensureDir(path.dirname(targetFilePath));
        await fs.writeFile(targetFilePath, '<template><button>Old</button></template>');

        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({
            components: ['button'],
            overwrite: false,
        });

        expect(plan.files[0].action).toBe('skip');

        const result = await engine.execute(plan, { skipDependencies: true });
        expect(result.skipped).toEqual(['button']);
        expect(await fs.readFile(targetFilePath, 'utf-8')).toBe('<template><button>Old</button></template>');
    });

    it('execute should report a complete rollback if an error occurs during file writing', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });

        // 模拟事务写入阶段发生未知错误
        const origWriteFile = fs.writeFile.bind(fs);
        vi.spyOn(fs, 'writeFile').mockImplementation(async (filePath, data, options) => {
            if (String(filePath).includes('Button.vue')) {
                throw new Error('Disk write I/O failure');
            }
            return origWriteFile(filePath, data, options);
        });

        await expect(engine.execute(plan, { skipDependencies: true })).rejects.toThrow('rollback completed');

        // 验证文件、utils 与 manifest 均未残留
        const targetFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFilePath)).toBe(false);
        const expectedUtilsPath = path.join(projectCwd, 'src/lib/utils.ts');
        expect(await fs.pathExists(expectedUtilsPath)).toBe(false);
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestPath)).toBe(false);
    });

    it('execute should preserve committed state when transaction backup cleanup fails', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const createTransaction: ProjectContext['createTransaction'] = context.createTransaction.bind(context);
        vi.spyOn(context, 'createTransaction').mockImplementation(() => {
            const transaction: ReturnType<ProjectContext['createTransaction']> = createTransaction();
            const commit: () => Promise<void> = transaction.commit.bind(transaction);
            vi.spyOn(transaction, 'commit').mockImplementation(async (): Promise<void> => {
                await commit();
                throw new Error('transaction cleanup failure');
            });
            return transaction;
        });

        const engine: ComponentMutationEngine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });

        await expect(engine.execute(plan, { skipDependencies: true })).rejects.toThrow(
            'Component files were committed, but transaction backup cleanup failed'
        );
        expect(await fs.pathExists(path.join(projectCwd, 'src/components/ui/button/Button.vue'))).toBe(true);
        expect(await fs.pathExists(path.join(projectCwd, '.brutx/manifest.json'))).toBe(true);
    });

    it('execute should preserve rollback failure paths and the original CliError cause', async () => {
        const targetFilePath: string = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const secondTargetFilePath: string = path.join(projectCwd, 'src/components/ui/button/button-helper.ts');
        await fs.ensureDir(path.dirname(targetFilePath));
        await fs.writeFile(targetFilePath, '<template><button>My Button</button></template>\n');
        await fs.writeFile(secondTargetFilePath, 'export const label = "My Button";\n');

        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const engine: ComponentMutationEngine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'], overwrite: true });
        const failedRollbackPath: string = path.resolve(secondTargetFilePath);
        plan.files.push({
            componentName: 'button',
            filePath: secondTargetFilePath,
            action: 'overwrite',
            sourceContent: 'export const label = "Upstream Button";\n',
            mergedContent: 'export const label = "Upstream Button";\n',
        });
        const originalRemove: typeof fs.remove = fs.remove.bind(fs);
        let shouldFailRollback: boolean = true;
        vi.spyOn(fs, 'remove').mockImplementation(async (removePath, options) => {
            if (shouldFailRollback && path.resolve(String(removePath)) === failedRollbackPath) {
                shouldFailRollback = false;
                throw new Error('baseline cleanup failure');
            }
            return originalRemove(removePath, options);
        });

        const underlyingCause: Error = new Error('callback cause');
        const originalError: CliError = new CliError('file callback failed', {
            code: 'WRITE_FAILED',
            exitCode: 7,
            cause: underlyingCause,
        });
        let caughtError: unknown;
        try {
            await engine.execute(plan, {
                skipDependencies: true,
                callbacks: {
                    onFileWritten: (info: { component: string; filePath: string; action: string }): void => {
                        if (info.filePath === secondTargetFilePath) {
                            throw originalError;
                        }
                    },
                },
            });
        } catch (error: unknown) {
            caughtError = error;
        }

        expect(caughtError).toBeInstanceOf(CliError);
        const rollbackError: CliError = caughtError as CliError;
        expect(rollbackError.code).toBe('WRITE_FAILED');
        expect(rollbackError.exitCode).toBe(7);
        expect(rollbackError.message).toContain('rollback was incomplete');
        expect(rollbackError.message).toContain(failedRollbackPath);
        expect(rollbackError.message).toContain('file callback failed');
        expect((rollbackError as Error & { cause?: unknown }).cause).toBe(originalError);
        expect(((rollbackError as Error & { cause?: unknown }).cause as Error & { cause?: unknown }).cause).toBe(underlyingCause);
        expect(await fs.readFile(targetFilePath, 'utf-8')).toBe('<template><button>My Button</button></template>\n');
        expect(await fs.readFile(secondTargetFilePath, 'utf-8')).toBe('export const label = "Upstream Button";\n');
        expect(await fs.pathExists(failedRollbackPath)).toBe(true);
    });

    it('execute should return dependency failure after onDependencyStart throws while retaining committed files', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const engine: ComponentMutationEngine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });
        const callbackError: Error = new Error('dependency callback failed');

        const result = await engine.execute(plan, {
            callbacks: {
                onDependencyStart: (): void => {
                    throw callbackError;
                },
            },
        });

        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(true);
        expect(result.dependencies).toEqual({
            status: 'failed',
            packages: ['clsx', 'tailwind-merge'],
            error: 'dependency callback failed',
        });
        expect(result.stats.createdFiles).toBe(1);
        expect(await fs.pathExists(path.join(projectCwd, 'src/components/ui/button/Button.vue'))).toBe(true);
        expect(await fs.pathExists(path.join(projectCwd, '.brutx/manifest.json'))).toBe(true);
    });

    it('execute should return dependency failure after topology resolution throws while retaining committed files', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const { WorkspaceTopologyEngine } = await import('../src/lib/workspace/topology-engine.js');
        vi.spyOn(WorkspaceTopologyEngine, 'resolveTopology').mockRejectedValueOnce(new Error('workspace scan failed'));

        const engine: ComponentMutationEngine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });
        const dependencyStart = vi.fn();

        const result = await engine.execute(plan, {
            callbacks: { onDependencyStart: dependencyStart },
        });

        expect(dependencyStart).toHaveBeenCalledWith(['clsx', 'tailwind-merge']);
        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(true);
        expect(result.dependencies).toEqual({
            status: 'failed',
            packages: ['clsx', 'tailwind-merge'],
            error: 'workspace scan failed',
        });
        expect(result.stats.createdFiles).toBe(1);
        expect(await fs.pathExists(path.join(projectCwd, 'src/components/ui/button/Button.vue'))).toBe(true);
        expect(await fs.pathExists(path.join(projectCwd, '.brutx/manifest.json'))).toBe(true);
    });

    it('execute should include a manual dependency command when installation fails after topology resolution', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const { WorkspaceTopologyEngine } = await import('../src/lib/workspace/topology-engine.js');
        const { PackageManagerAdapter } = await import('../src/lib/workspace/package-manager-adapter.js');
        vi.spyOn(WorkspaceTopologyEngine, 'resolveTopology').mockResolvedValueOnce({
            workspaceRoot: projectCwd,
            packageManager: 'pnpm',
            isMonorepo: false,
            packages: new Map(),
        });
        const manualCommand: string = 'pnpm add clsx tailwind-merge';
        const manualCommandSpy = vi.spyOn(PackageManagerAdapter, 'getManualInstallCommand').mockReturnValueOnce(manualCommand);
        vi.spyOn(PackageManagerAdapter, 'executeInstall').mockRejectedValueOnce(new Error('package manager failed'));

        const engine: ComponentMutationEngine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });
        const result = await engine.execute(plan);

        expect(result.dependencies).toEqual({
            status: 'failed',
            packages: ['clsx', 'tailwind-merge'],
            manualCommand,
            error: 'package manager failed',
        });
        expect(manualCommandSpy).toHaveBeenCalledWith('pnpm', ['clsx', 'tailwind-merge'], undefined, false);
        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(true);
        expect(await fs.pathExists(path.join(projectCwd, 'src/components/ui/button/Button.vue'))).toBe(true);
    });

    it('planUpdate and execute should handle 3-way merge correctly', async () => {
        const targetFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        await fs.ensureDir(path.dirname(targetFilePath));
        await fs.writeFile(targetFilePath, '<template><button class="btn my-custom">Button</button></template>\n');

        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        const updatedButtonItem: RegistryItem = {
            ...buttonItem,
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    content: '<template><button class="btn new-upstream">Button</button></template>\n',
                    type: 'registry:ui',
                },
            ],
        };
        setupMockRegistry(context, [updatedButtonItem]);

        const { BaselineProvider } = await import('../src/lib/merge/baseline-provider.js');
        vi.spyOn(BaselineProvider.prototype, 'getComponentBaseline').mockResolvedValueOnce({
            componentName: 'button',
            status: 'registry-baseline',
            files: new Map([
                ['src/components/ui/button/Button.vue', '<template><button class="btn">Button</button></template>\n'],
            ]),
        });

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planUpdate({
            components: ['button'],
            conflictStrategy: 'markers',
        });

        expect(plan.items).toHaveLength(1);
        expect(plan.files[0].action).toBe('merge');

        const result = await engine.execute(plan, { skipDependencies: true });
        expect(result.succeeded).toEqual(['button']);
        expect(result.manifestUpdated).toBe(true);

        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].component).toBe('button');
        expect(result.conflicts[0].conflictFiles).toContain(targetFilePath);

        const mergedContent = await fs.readFile(targetFilePath, 'utf-8');
        expect(mergedContent).toContain('<<<<<<<');
        expect(mergedContent).toContain('=======');
        expect(mergedContent).toContain('>>>>>>>');
    });

    it('planUpdate should reuse supplied registry snapshots and their resolved sources', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        const updatedButtonItem: RegistryItem = {
            ...buttonItem,
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    content: '<template><button class="btn updated">Button</button></template>\n',
                    type: 'registry:ui',
                },
            ],
        };
        const client: RegistryClient = setupMockRegistry(context, [updatedButtonItem]);
        const source: string = 'https://registry.example.com';
        const snapshots: Map<string, RegistryItemSnapshot> = new Map();
        const baselineSpy = vi.spyOn(BaselineProvider.prototype, 'getComponentBaseline').mockResolvedValue({
            componentName: 'button',
            status: 'fallback-diff',
            files: new Map<string, string>(),
        });

        try {
            const diff = await diffComponent(
                context,
                'button',
                undefined,
                undefined,
                false,
                (snapshot: RegistryItemSnapshot): void => {
                    snapshots.set(snapshot.item.name, snapshot);
                },
            );
            const engine = new ComponentMutationEngine(context);
            const plan = await engine.planUpdate({
                components: ['button'],
                registrySnapshots: snapshots,
                useCache: false,
            });

            expect(diff.status).toBe('modified');
            expect(plan.items[0]).toBe(updatedButtonItem);
            expect(client.fetchItemWithMeta).toHaveBeenCalledTimes(1);
            expect(client.fetchItemWithMeta).toHaveBeenCalledWith('button', { useCache: false });
            expect(client.fetchItem).not.toHaveBeenCalled();
            expect(baselineSpy.mock.calls.at(-1)?.[2]).toEqual(expect.objectContaining({
                registrySource: source,
                useCache: false,
            }));
        } finally {
            baselineSpy.mockRestore();
        }
    });

    it('planUpdate should fetch registry items when no snapshots are supplied', async () => {
        const context: ProjectContext = await ProjectContext.loadUninitialized(projectCwd, { fs });
        const client: RegistryClient = setupMockRegistry(context, [buttonItem]);
        const engine = new ComponentMutationEngine(context);

        const plan = await engine.planUpdate({ components: ['button'], overwrite: true });

        expect(plan.items).toEqual([buttonItem]);
        expect(client.fetchItem).toHaveBeenCalledTimes(1);
    });

    it('planUpdate and execute should handle file deletion when upstream deprecates a file', async () => {
        const targetFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        const deprecatedHelperPath = path.join(projectCwd, 'src/components/ui/button/legacy-helper.ts');
        await fs.ensureDir(path.dirname(targetFilePath));
        await fs.writeFile(targetFilePath, '<template><button>Button</button></template>\n');
        await fs.writeFile(deprecatedHelperPath, 'export const oldHelper = 1;\n');

        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const { MergeExecutor } = await import('../src/lib/merge/merge-executor.js');
        vi.spyOn(MergeExecutor.prototype, 'plan').mockResolvedValueOnce({
            componentName: 'button',
            hasConflicts: false,
            files: [
                {
                    filePath: 'src/components/ui/button/Button.vue',
                    status: 'unchanged',
                    action: 'skip',
                    content: '<template><button>Button</button></template>\n',
                    hasConflicts: false,
                    conflictCount: 0,
                    detectedEol: '\n',
                },
                {
                    filePath: 'src/components/ui/button/legacy-helper.ts',
                    status: 'deleted',
                    action: 'delete',
                    hasConflicts: false,
                    conflictCount: 0,
                    detectedEol: '\n',
                },
            ],
        });

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planUpdate({
            components: ['button'],
        });

        const deleteFile = plan.files.find(f => f.action === 'delete');
        expect(deleteFile).toBeDefined();
        expect(deleteFile?.filePath).toBe(path.resolve(deprecatedHelperPath));

        const result = await engine.execute(plan, { skipDependencies: true });
        expect(result.succeeded).toEqual(['button']);
        expect(result.filesDeleted).toContain(path.resolve(deprecatedHelperPath));
        expect(result.stats.deletedFiles).toBe(1);
        expect(await fs.pathExists(deprecatedHelperPath)).toBe(false);
    });

    it('execute should pass targetPackageName to package manager in monorepo environment', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);

        const { WorkspaceTopologyEngine } = await import('../src/lib/workspace/topology-engine.js');
        const { PackageManagerAdapter } = await import('../src/lib/workspace/package-manager-adapter.js');

        vi.spyOn(WorkspaceTopologyEngine, 'resolveTopology').mockResolvedValueOnce({
            workspaceRoot: projectCwd,
            packageManager: 'pnpm',
            isMonorepo: true,
            packages: new Map(),
            componentRegistries: new Map(),
        });

        const installSpy = vi.spyOn(PackageManagerAdapter, 'executeInstall').mockResolvedValueOnce(undefined);

        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button'] });

        const result = await engine.execute(plan, {
            skipDependencies: false,
            targetPackageName: '@repo/ui',
        });

        expect(result.dependencies.status).toBe('installed');
        expect(installSpy).toHaveBeenCalledWith(
            'pnpm',
            ['clsx', 'tailwind-merge'],
            projectCwd,
            '@repo/ui',
            true
        );
    });
});
