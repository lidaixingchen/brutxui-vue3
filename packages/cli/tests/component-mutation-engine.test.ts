import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { ComponentMutationEngine } from '../src/lib/services/component-mutation-engine.js';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';
import type { RegistryClient } from '../src/lib/registry-client.js';

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

    it('execute should rollback cleanly if an error occurs during file writing', async () => {
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

        await expect(engine.execute(plan, { skipDependencies: true })).rejects.toThrow('Component mutation failed and was cleanly rolled back');

        // 验证文件、utils 与 manifest 均未残留
        const targetFilePath = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFilePath)).toBe(false);
        const expectedUtilsPath = path.join(projectCwd, 'src/lib/utils.ts');
        expect(await fs.pathExists(expectedUtilsPath)).toBe(false);
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestPath)).toBe(false);
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
