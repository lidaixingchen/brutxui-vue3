import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { readConfig } from '../src/lib/config.js';
import { writeComponentFiles, ensureUtilsFile } from '../src/lib/services/add-service.js';
import { initializeProjectFiles } from '../src/lib/services/init-service.js';
import { prepareRemoveComponents, removeComponents } from '../src/lib/services/remove-service.js';
import { TargetResolver } from '../src/lib/workspace/target-resolver.js';
import { RegistryClient } from '../src/lib/registry-client.js';
import { computeRegistryIntegrity, computeRegistryManifestIntegrity } from 'brutx-shared-vue';
import { generateEd25519KeyPair, signManifestIntegrity } from '../src/lib/signature.js';
import type { BrutalistConfig, RegistryItem, WorkspaceTopology } from '../src/lib/types.js';

describe('Services with ProjectContext (VFS)', () => {
    let fs: MemoryFileSystemAdapter;
    const projectCwd = process.platform === 'win32' ? 'C:/workspace/my-vue-app' : '/workspace/my-vue-app';

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

    beforeEach(async () => {
        fs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'my-vue-app',
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

    it('should initialize project files via ProjectContext and VFS', async () => {
        const freshFs = new MemoryFileSystemAdapter({
            [path.join(projectCwd, 'package.json')]: JSON.stringify({
                name: 'my-vue-app',
                dependencies: { vue: '^3.5.0' },
            }),
            [path.join(projectCwd, 'pnpm-lock.yaml')]: '',
            [path.join(projectCwd, 'src/assets/main.css')]: '@import "tailwindcss";\n',
        });

        const ctx = await ProjectContext.loadUninitialized(projectCwd, { fs: freshFs });
        const result = await initializeProjectFiles({
            cwd: projectCwd,
            projectType: ctx.env.projectType,
            settings: {
                tailwind: sampleConfig.tailwind,
                aliases: sampleConfig.aliases,
            },
            context: ctx,
        });

        expect(result.utilsCreated).toBe(true);
        expect(await freshFs.pathExists(path.join(projectCwd, 'components.json'))).toBe(true);
        expect(await freshFs.pathExists(path.join(projectCwd, 'src/lib/utils.ts'))).toBe(true);
        expect(ctx.isConfigured).toBe(true);
    });

    it('should write component files and commit transaction via ProjectContext', async () => {
        const ctx = await ProjectContext.load(projectCwd, { fs });
        await ensureUtilsFile(ctx);

        const items: RegistryItem[] = [
            {
                name: 'button',
                dependencies: ['reka-ui'],
                files: [
                    {
                        path: 'components/ui/button/Button.vue',
                        content: '<script setup lang="ts">\nimport { cn } from "@/lib/utils";\n</script>\n<template><button :class="cn()"><slot /></button></template>',
                        type: 'components:ui',
                    },
                ],
            },
        ];

        const writeResult = await writeComponentFiles(ctx, items);
        expect(writeResult.added).toEqual(['button']);

        await writeResult.transaction?.commit();

        const targetFile = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFile)).toBe(true);
        const writtenContent = await fs.readFile(targetFile);
        expect(writtenContent).toContain('import { cn } from "@/lib/utils";');
    });

    it('preserves workspace registry security settings through target resolution and full item fetch', async () => {
        const workspaceRoot = path.join(projectCwd, 'workspace');
        const targetRoot = path.join(workspaceRoot, 'apps/web');
        const registrySource = 'https://registry.example.com';
        const keyPair = generateEd25519KeyPair();
        const publicKey = { keyId: keyPair.keyId, publicKey: keyPair.publicKey };
        const rootConfigPath = path.join(workspaceRoot, 'components.json');
        await fs.writeFile(rootConfigPath, JSON.stringify({
            ...sampleConfig,
            registries: [registrySource],
            requireSignature: true,
            trustedPublicKeys: [publicKey],
        }));

        const rootConfig = await readConfig(workspaceRoot, fs);
        const targetPackage = {
            name: 'web-app',
            rootDir: targetRoot,
            relativeDir: 'apps/web',
            isRoot: false,
            role: 'app' as const,
            hasComponentsConfig: false,
            packageJson: { name: 'web-app' },
        };
        const topology: WorkspaceTopology = {
            isMonorepo: true,
            workspaceRoot,
            packageManager: 'pnpm',
            packages: new Map([['apps/web', targetPackage]]),
        };
        const plan = TargetResolver.resolvePlan(workspaceRoot, 'apps/web', topology, rootConfig);

        const context = await ProjectContext.loadUninitialized(targetRoot, {
            fs,
            configOverride: plan.effectiveConfig,
        });
        const itemFiles = [{
            path: 'components/ui/button/Button.vue',
            content: '<template><button /></template>',
            type: 'registry:ui' as const,
        }];
        const item: RegistryItem = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            dependencies: [],
            devDependencies: [],
            registryDependencies: [],
            files: itemFiles,
            tailwind: {},
            cssVars: {},
            integrity: computeRegistryIntegrity(itemFiles),
        };
        const unsignedManifestBase = {
            name: 'brutx-registry',
            schemaVersion: 1,
            registryVersion: '1.0.0',
            items: { button: { integrity: item.integrity } },
        };
        const unsignedManifest = {
            ...unsignedManifestBase,
            integrity: computeRegistryManifestIntegrity(unsignedManifestBase),
        };
        const signedManifest = {
            ...unsignedManifest,
            keyId: keyPair.keyId,
            signature: signManifestIntegrity(unsignedManifest.integrity, keyPair.privateKey),
        };
        let activeManifest: Record<string, unknown> = unsignedManifest;
        const requestedUrls: string[] = [];
        const httpFetcher = async (url: string) => {
            requestedUrls.push(url);
            const payload = url.endsWith('/registry-manifest.json') ? activeManifest : item;
            return new Response(JSON.stringify(payload), { status: 200 });
        };
        const registry = context.getRegistryClient({
            useCache: false,
            httpFetcher,
        });

        await expect(registry.fetchItem('button')).rejects.toMatchObject({
            code: 'REGISTRY_SIGNATURE_INVALID',
        });
        activeManifest = signedManifest;
        const signedRegistry = context.getRegistryClient({ useCache: false, httpFetcher });
        await expect(signedRegistry.fetchItem('button')).resolves.toMatchObject({ name: 'button' });

        expect(plan.effectiveConfig.registries).toEqual([registrySource]);
        expect(plan.effectiveConfig.requireSignature).toBe(true);
        expect(plan.effectiveConfig.trustedPublicKeys).toEqual([publicKey]);
        expect(requestedUrls).toContain(`${registrySource}/registry-manifest.json`);
    });

    it('writes locale and directive files beside the aliases used in their imports', async () => {
        const config: BrutalistConfig = {
            ...sampleConfig,
            aliases: {
                ...sampleConfig.aliases,
                locales: '@/i18n/locales',
                directives: '@/framework/directives',
            },
        };
        await fs.writeJson(path.join(projectCwd, 'components.json'), config);
        const context = await ProjectContext.load(projectCwd, { fs });
        const items: RegistryItem[] = [{
            name: 'locale-aware',
            dependencies: [],
            files: [
                {
                    path: 'components/ui/locale-aware/LocaleAware.vue',
                    content: "<script setup lang=\"ts\">\nimport locale from '@/locales/zh-CN';\nimport { vLoading } from '@/directives/loading';\n</script>",
                    type: 'registry:ui',
                },
                {
                    path: 'locales/zh-CN.ts',
                    content: 'export default {}',
                    type: 'registry:lib',
                },
                {
                    path: 'directives/loading.ts',
                    content: 'export const vLoading = {}',
                    type: 'registry:directive',
                },
            ],
        }];

        const writeResult = await writeComponentFiles(context, items);
        await writeResult.transaction?.commit();

        const localePath = path.join(projectCwd, 'src/i18n/locales/zh-CN.ts');
        const directivePath = path.join(projectCwd, 'src/framework/directives/loading.ts');
        const componentPath = path.join(projectCwd, 'src/components/ui/locale-aware/LocaleAware.vue');
        expect(await fs.pathExists(localePath)).toBe(true);
        expect(await fs.pathExists(directivePath)).toBe(true);
        expect(await fs.readFile(componentPath)).toContain("from '@/i18n/locales/zh-CN'");
        expect(await fs.readFile(componentPath)).toContain("from '@/framework/directives/loading'");
    });

    it.each([
        { localeAlias: '@/i18n/locales', localeFile: 'src/resources/locales/zh-CN.ts' },
        { localeAlias: '@/i18n', localeFile: 'src/resources/zh-CN.ts' },
    ])('writes locale files through the $localeAlias tsconfig mapping', async ({ localeAlias, localeFile }) => {
        const config: BrutalistConfig = {
            ...sampleConfig,
            aliases: {
                ...sampleConfig.aliases,
                locales: localeAlias,
            },
        };
        await fs.writeJson(path.join(projectCwd, 'components.json'), config);
        await fs.writeJson(path.join(projectCwd, 'tsconfig.json'), {
            compilerOptions: {
                baseUrl: '.',
                paths: {
                    '@/*': ['./src/*'],
                    '@/i18n/*': ['./src/resources/*'],
                },
            },
        });
        await fs.ensureDir(path.join(projectCwd, 'src/i18n/locales'));
        const context = await ProjectContext.load(projectCwd, { fs });
        const item: RegistryItem = {
            name: 'locale-aware',
            dependencies: [],
            files: [
                {
                    path: 'components/ui/locale-aware/LocaleAware.vue',
                    content: "<script setup lang=\"ts\">\nimport locale from '@/locales/zh-CN';\n</script>",
                    type: 'registry:ui',
                },
                {
                    path: 'locales/zh-CN.ts',
                    content: 'export default {}',
                    type: 'registry:lib',
                },
            ],
        };

        const writeResult = await writeComponentFiles(context, [item]);
        await writeResult.transaction?.commit();

        const localePath = path.join(projectCwd, localeFile);
        const componentPath = path.join(projectCwd, 'src/components/ui/locale-aware/LocaleAware.vue');
        expect(await fs.pathExists(localePath)).toBe(true);
        expect(await fs.readFile(componentPath)).toContain(`from '${localeAlias}/zh-CN'`);
    });

    it('should remove components and orphaned files via ProjectContext and VFS', async () => {
        const registryClient = new RegistryClient({
            fsAdapter: fs,
            httpFetcher: async () => new Response('Not Found', { status: 404 }),
        });
        const ctx = await ProjectContext.load(projectCwd, { fs, registryClient });

        const items: RegistryItem[] = [
            {
                name: 'button',
                dependencies: [],
                files: [
                    {
                        path: 'components/ui/button/Button.vue',
                        content: '<template><button /></template>',
                        type: 'components:ui',
                    },
                ],
            },
        ];

        const writeResult = await writeComponentFiles(ctx, items);
        await writeResult.transaction?.commit();

        const manifest = {
            version: 1,
            components: {
                button: {
                    name: 'button',
                    version: '1.0.0',
                    registrySource: 'https://github.com/lidaixingchen/brutxui-vue3/releases/latest/download',
                    integrity: 'sha256-dummyintegrityvalueforbuttoncomponent',
                    dependencies: [],
                    registryDependencies: [],
                    installedAt: '2026-08-18',
                    files: ['src/components/ui/button/Button.vue'],
                },
            },
        };
        await fs.writeJson(path.join(projectCwd, '.brutx/manifest.json'), manifest);

        const removal = await prepareRemoveComponents(ctx, ['button'], manifest as any);
        expect(removal.toRemove).toEqual(['button']);

        const result = await removeComponents(ctx, removal.toRemove, removal.orphanedFiles, {
            removeOrphaned: true,
        });

        expect(result.totalRemoved).toBe(1);
        const buttonFile = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(buttonFile)).toBe(false);
    });
});
