import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import { MemoryFileSystemAdapter } from '../src/lib/fs/memory-fs.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { ComponentMutationEngine } from '../src/lib/services/component-mutation-engine.js';
import type { BrutalistConfig, RegistryItem, RegistryItemSnapshot } from '../src/lib/types.js';
import { RegistryClient } from '../src/lib/registry-client.js';
import { BaselineProvider } from '../src/lib/merge/baseline-provider.js';
import { diffComponent } from '../src/lib/services/diff-service.js';
import { CliError } from '../src/lib/error.js';
import { DEFAULT_REGISTRY_URL } from '../src/lib/constants.js';
import { readManifest, updateInstalledComponents } from '../src/lib/manifest.js';
import { integrityHashDriftRule } from '../src/lib/diagnostics/rules/integrity-rules.js';
import { prepareRemoveComponents, removeComponents } from '../src/lib/services/remove-service.js';

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

    function makeComponentItem(name: string, files: RegistryItem['files']): RegistryItem {
        return {
            ...buttonItem,
            name,
            title: name,
            description: `${name} component`,
            dependencies: [],
            files,
            integrity: computeRegistryIntegrity(files),
        };
    }

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

    it('releases shared files on update and deletes only the unmodified file of the last owner', async () => {
        const card = { ...buttonFiles[0], path: 'components/ui/card/Card.vue' };
        const badge = { ...buttonFiles[0], path: 'components/ui/badge/Badge.vue' };
        const lib = {
            path: 'lib/native-form-reset.ts',
            content: 'import { reset } from "@/composables/useReset";\nexport { reset };\n',
            type: 'registry:lib' as const,
        };
        const hook = { path: 'composables/useReset.ts', content: 'export const reset = () => {};\n', type: 'registry:hook' as const };
        const items = [makeComponentItem('card', [card, lib, hook]), makeComponentItem('badge', [badge, lib, hook])];
        const context = await ProjectContext.loadUninitialized(projectCwd, {
            fs,
            configOverride: { ...sampleConfig, sharedBase: '@/foundation' },
        });
        setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        const options = { skipDependencies: true };
        const install = await engine.planInstall({ components: ['card', 'badge'] });
        const libPath = await context.resolveTargetPath(lib.path);
        const hookPath = await context.resolveTargetPath(hook.path);
        expect((await engine.execute(install, options)).filesWritten.filter(file => file === libPath)).toHaveLength(1);
        const libRelative = context.toRelativePosixPath(libPath);
        const hookRelative = context.toRelativePosixPath(hookPath);
        const projectedLib = await fs.readFile(libPath, 'utf-8');
        expect(projectedLib).toContain('@/foundation/hooks/useReset');

        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        const manifest = (await readManifest(projectCwd, fs))!;
        manifest.components.badge.files = manifest.components.badge.files.map(file => file.replaceAll('/', '\\'));
        await fs.writeJson(manifestPath, manifest);
        expect((await diffComponent(context, 'badge')).files).toEqual(expect.arrayContaining([
            { path: lib.path, status: 'unchanged' },
            { path: hook.path, status: 'unchanged' },
        ]));

        items[0] = makeComponentItem('card', [card]);
        const first = await engine.execute(await engine.planUpdate({ components: ['card'] }), options);
        expect(first.filesDeleted).toEqual([]);
        expect(await fs.readFile(libPath, 'utf-8')).toBe(projectedLib);
        const afterFirst = (await readManifest(projectCwd, fs))!;
        expect(afterFirst.components.card.files).not.toContain(libRelative);
        expect(afterFirst.components.card.files).not.toContain(hookRelative);

        const customHook = 'export const reset = () => "local";\n';
        await fs.writeFile(hookPath, customHook);
        expect((await diffComponent(context, 'badge')).files).toContainEqual(expect.objectContaining({
            path: hook.path,
            status: 'modified',
        }));
        items[1] = makeComponentItem('badge', [badge]);
        const last = await engine.execute(await engine.planUpdate({ components: ['badge'] }), options);
        expect(last.filesDeleted).toEqual([libPath]);
        expect(await fs.pathExists(libPath)).toBe(false);
        expect(await fs.readFile(hookPath, 'utf-8')).toBe(customHook);
        const afterLast = (await readManifest(projectCwd, fs))!;
        expect(afterLast.components.badge.files).not.toContain(hookRelative);
    });

    it.each([['card', 'badge'], ['badge', 'card']])('resolves ownership for the whole update batch (%s then %s)', async (first, second) => {
        const card = { ...buttonFiles[0], path: 'components/ui/card/Card.vue' };
        const badge = { ...buttonFiles[0], path: 'components/ui/badge/Badge.vue' };
        const shared = { ...buttonFiles[0], path: 'lib/shared.ts', content: 'export const shared = true;\n' };
        const items = [makeComponentItem('card', [card, shared]), makeComponentItem('badge', [badge])];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        const options = { skipDependencies: true };
        await engine.execute(await engine.planInstall({ components: ['card', 'badge'] }), options);
        const sharedPath = await context.resolveTargetPath(shared.path);
        const relativePath = context.toRelativePosixPath(sharedPath);
        items[0] = makeComponentItem('card', [card]);
        items[1] = makeComponentItem('badge', [badge, shared]);

        const result = await engine.execute(await engine.planUpdate({ components: [first, second] }), options);

        expect(result.filesDeleted).toEqual([]);
        expect(await fs.readFile(sharedPath, 'utf-8')).toBe(shared.content);
        const manifest = (await readManifest(projectCwd, fs))!;
        expect(manifest.components.card.files).not.toContain(relativePath);
        expect(manifest.components.badge.files).toContain(relativePath);

        items[0] = makeComponentItem('card', [card, shared]);
        await engine.execute(await engine.planUpdate({ components: ['card'] }), options);
        items[0] = makeComponentItem('card', [card]);
        items[1] = makeComponentItem('badge', [badge]);
        const retirement = await engine.execute(await engine.planUpdate({ components: [first, second] }), options);
        expect(retirement.filesDeleted).toEqual([sharedPath]);
        expect(await fs.pathExists(sharedPath)).toBe(false);
    });

    it.each([['alpha', 'beta', 'registry'], ['beta', 'alpha', 'registry'], ['alpha', 'beta', 'local']])(
        'preserves a file imported by a merged component (%s then %s, %s import)',
        async (first, second, importSource) => {
            const alpha = { ...buttonFiles[0], path: 'components/ui/alpha/Alpha.vue' };
            const beta = {
                ...buttonFiles[0],
                path: 'components/ui/beta/Beta.vue',
                content: '<script setup>\nconst label = "before";\n</script>\n<template>{{ label }}</template>\n',
            };
            const shared = { ...buttonFiles[0], path: 'lib/shared.ts', content: 'export const shared = true;\n' };
            const items = [makeComponentItem('alpha', [alpha, shared]), makeComponentItem('beta', [beta])];
            const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
            setupMockRegistry(context, items);
            const engine = new ComponentMutationEngine(context);
            const options = { skipDependencies: true };
            await engine.execute(await engine.planInstall({ components: ['alpha', 'beta'] }), options);
            const sharedPath = await context.resolveTargetPath(shared.path);
            const betaPath = await context.resolveTargetPath(beta.path);
            const addSharedImport = (content: string) => content.replace(
                'const label = "before";', 'import { shared } from "@/lib/shared";\nconst label = shared;',
            );
            const nextBetaContent = beta.content.replace('{{ label }}', '<small>{{ label }}</small>');
            if (importSource === 'local') await fs.writeFile(betaPath, addSharedImport(beta.content));
            const betaUpdate = { ...beta, content: importSource === 'local' ? nextBetaContent : addSharedImport(nextBetaContent) };
            items[0] = makeComponentItem('alpha', [alpha]);
            items[1] = makeComponentItem('beta', [betaUpdate]);

            const update = await engine.planUpdate({ components: [first, second] });
            const result = await engine.execute(update, options);

            expect(result.filesDeleted).toEqual([]);
            expect(await fs.readFile(betaPath, 'utf-8')).toBe(addSharedImport(nextBetaContent));
            expect(await fs.readFile(sharedPath, 'utf-8')).toBe(shared.content);
            const manifest = (await readManifest(projectCwd, fs))!;
            expect(manifest.components.alpha.files).not.toContain(context.toRelativePosixPath(sharedPath));
            expect(manifest.components.beta.files).not.toContain(context.toRelativePosixPath(sharedPath));
        },
    );

    it('keeps a file registered by another component after update planning', async () => {
        const card = { ...buttonFiles[0], path: 'components/ui/card/Card.vue' };
        const shared = { ...buttonFiles[0], path: 'lib/shared.ts', content: 'export const shared = true;\n' };
        const items = [makeComponentItem('card', [card, shared])];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        const options = { skipDependencies: true };
        await engine.execute(await engine.planInstall({ components: ['card'] }), options);
        const sharedPath = await context.resolveTargetPath(shared.path);
        items[0] = makeComponentItem('card', [card]);
        const update = await engine.planUpdate({ components: ['card'] });
        expect(update.files).toContainEqual(expect.objectContaining({ filePath: sharedPath, action: 'delete' }));

        await updateInstalledComponents(projectCwd, [{
            item: makeComponentItem('badge', [shared]),
            registrySource: 'https://registry.example.com',
            files: [sharedPath],
        }], {}, fs);
        const result = await engine.execute(update, options);

        expect(result.filesDeleted).toEqual([]);
        expect(result.stats.deletedFiles).toBe(0);
        expect(await fs.readFile(sharedPath, 'utf-8')).toBe(shared.content);
        const manifest = (await readManifest(projectCwd, fs))!;
        expect(manifest.components.card.files).not.toContain(context.toRelativePosixPath(sharedPath));
        expect(manifest.components.badge.files).toContain(context.toRelativePosixPath(sharedPath));
    });

    it('preserves a shared import whose owning component has a legacy manifest entry', async () => {
        const card = { ...buttonFiles[0], path: 'components/ui/card/Card.vue' };
        const badge = {
            ...buttonFiles[0],
            path: 'components/ui/badge/Badge.vue',
            content: '<script setup>\nimport { shared } from "@/lib/shared";\n</script>\n<template>{{ shared }}</template>\n',
        };
        const shared = { ...buttonFiles[0], path: 'lib/shared.ts', content: 'export const shared = true;\n' };
        const items = [makeComponentItem('card', [card, shared]), makeComponentItem('badge', [badge, shared])];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        const options = { skipDependencies: true };
        await engine.execute(await engine.planInstall({ components: ['card', 'badge'] }), options);
        const sharedPath = await context.resolveTargetPath(shared.path);
        const sharedRelative = context.toRelativePosixPath(sharedPath);
        const legacyManifest = (await readManifest(projectCwd, fs))!;
        legacyManifest.components.badge.files = legacyManifest.components.badge.files.filter(file => file !== sharedRelative);
        delete legacyManifest.components.badge.baselines;
        await fs.writeJson(path.join(projectCwd, '.brutx/manifest.json'), legacyManifest);

        const removal = await prepareRemoveComponents(context, ['card'], legacyManifest, false);
        expect(removal.orphanedFiles).not.toContain(sharedPath);
        items[0] = makeComponentItem('card', [card]);
        const update = await engine.planUpdate({ components: ['card'] });
        const result = await engine.execute(update, options);

        expect(result.filesDeleted).toEqual([]);
        expect(await fs.readFile(sharedPath, 'utf-8')).toBe(shared.content);
        expect((await readManifest(projectCwd, fs))?.components.card.files).not.toContain(sharedRelative);
    });

    it('records an existing identical file when adding another owner and preserves it during removal', async () => {
        const shared = { ...buttonFiles[0], path: 'lib/shared.ts', content: 'export const shared = true;\n' };
        const card = makeComponentItem('card', [shared]);
        const badge = makeComponentItem('badge', [shared]);
        const items = [card];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        const options = { skipDependencies: true };
        await engine.execute(await engine.planInstall({ components: ['card'] }), options);
        items[0] = badge;
        const installation = await engine.execute(await engine.planInstall({ components: ['badge'] }), options);
        expect(installation.filesWritten).toEqual([]);
        const sharedPath = await context.resolveTargetPath(shared.path);
        const relativePath = context.toRelativePosixPath(sharedPath);
        const manifest = (await readManifest(projectCwd, fs))!;
        expect(manifest.components.badge.files).toEqual([relativePath]);

        const removal = await prepareRemoveComponents(context, ['card'], manifest, false);
        expect(removal.orphanedFiles).toEqual([]);
        await removeComponents(context, removal.toRemove, removal.orphanedFiles);
        expect(await fs.pathExists(sharedPath)).toBe(true);
        const finalRemoval = await prepareRemoveComponents(context, ['badge'], null, false);
        expect(finalRemoval.orphanedFiles).toEqual([sharedPath]);
        await removeComponents(context, finalRemoval.toRemove, finalRemoval.orphanedFiles);
        expect(await fs.pathExists(sharedPath)).toBe(false);
    });

    it('rolls back a recovered baseline if the manifest write fails during execution', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context);
        const engine = new ComponentMutationEngine(context);
        await engine.execute(await engine.planInstall({ components: ['button'] }), { skipDependencies: true });
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        const manifest = (await readManifest(projectCwd, fs))!;
        const entry = manifest.components.button;
        const sourcePath = path.join(projectCwd, entry.files[0]);
        const source = await fs.readFile(sourcePath, 'utf-8');
        const baselinePath = path.join(projectCwd, entry.baselines![entry.files[0]]);
        await fs.remove(path.join(projectCwd, '.brutx/baselines/button'));
        delete entry.baselines;
        await fs.writeJson(manifestPath, manifest);
        const manifestBefore = await fs.readFile(manifestPath, 'utf-8');

        const plan = await engine.planInstall({ components: ['button'], merge: true });

        expect(plan.baselineRecoveries).toHaveLength(1);
        expect(await fs.pathExists(baselinePath)).toBe(false);
        expect(await fs.readFile(manifestPath, 'utf-8')).toBe(manifestBefore);
        const failure = vi.spyOn(fs, 'writeJson').mockImplementationOnce(async () => {
            expect(await fs.pathExists(baselinePath)).toBe(true);
            throw new Error('manifest write failed');
        });
        await expect(engine.execute(plan, { skipDependencies: true })).rejects.toThrow(/rollback completed.*manifest write failed/);
        failure.mockRestore();

        expect(await fs.pathExists(path.join(projectCwd, '.brutx/baselines/button'))).toBe(false);
        expect(await fs.readFile(manifestPath, 'utf-8')).toBe(manifestBefore);
        expect(await fs.readFile(sourcePath, 'utf-8')).toBe(source);
        await engine.execute(plan, { skipDependencies: true });
        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(source);
    });

    it('rejects an earlier merge and recovery plan before overwriting a newer installation', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        const original = makeComponentItem('button', buttonFiles);
        const later = (label: string) => makeComponentItem('button', buttonFiles.map(file => ({
            ...file, content: file.content.replace('Button</button>', `${label}</button>`),
        })));
        const items = [original];
        const registry = setupMockRegistry(context, items);
        const engine = new ComponentMutationEngine(context);
        await engine.execute(await engine.planInstall({ components: ['button'] }), { skipDependencies: true });
        const manifestPath = path.join(projectCwd, '.brutx/manifest.json');
        const entry = (await readManifest(projectCwd, fs))!.components.button;
        const baselinePath = path.join(projectCwd, entry.baselines![entry.files[0]]);
        await fs.remove(baselinePath);
        vi.mocked(registry.fetchItem).mockResolvedValueOnce(original);
        items[0] = later('two');
        const stalePlan = await engine.planInstall({ components: ['button'], merge: true });
        expect(stalePlan.baselineRecoveries).toHaveLength(1);
        expect(stalePlan.files.some(file => file.action === 'merge')).toBe(true);

        const current = later('three');
        const version = '3.0.0';
        const specifier = `button@${version}`;
        const registrySnapshots = new Map([[specifier, { item: current, source: entry.registrySource, version }]]);
        vi.mocked(registry.fetchItem).mockResolvedValueOnce(original);
        await engine.execute(await engine.planUpdate({ components: [specifier], registrySnapshots }), { skipDependencies: true });
        const manifestBefore = await fs.readFile(manifestPath, 'utf-8');
        const progress = vi.fn();
        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(current.files[0].content);

        await expect(engine.execute(stalePlan, {
            skipDependencies: true,
            callbacks: { onProgress: progress },
        })).rejects.toThrow('changed during merge planning');

        expect(progress).not.toHaveBeenCalled();
        expect(await fs.readFile(path.join(projectCwd, entry.files[0]), 'utf-8')).toBe(current.files[0].content);
        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(current.files[0].content);
        expect(await fs.readFile(manifestPath, 'utf-8')).toBe(manifestBefore);
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

    it('writes the selected tag and its dependency from the same registry source', async () => {
        const source = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const tagSource = source.replace('/main/', '/v1.2.0/');
        const dependency = makeComponentItem('badge', [{
            ...buttonFiles[0],
            path: 'components/ui/badge/Badge.vue',
        }]);
        const pinnedButton = {
            ...makeComponentItem('button', [{ ...buttonFiles[0], content: '<template>Pinned</template>\n' }]),
            registryDependencies: ['badge'],
        };
        const fetcher = vi.fn(async (url: string) => {
            if (url === `${tagSource}/button.json`) return Response.json(pinnedButton);
            if (url === `${tagSource}/badge.json`) return Response.json(dependency);
            if (url === `${source}/button.json`) return Response.json(buttonItem);
            return new Response(null, { status: 404 });
        });
        const registryClient = new RegistryClient({ sources: [source], fsAdapter: fs, httpFetcher: fetcher });
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs, registryClient });
        const engine = new ComponentMutationEngine(context);

        const plan = await engine.planInstall({ components: ['button@1.2.0'], useCache: false });
        expect(plan.items.map(item => item.name)).toEqual(['badge', 'button']);
        expect(plan.registrySources).toEqual({ badge: tagSource, button: tagSource });
        await engine.execute(plan, { skipDependencies: true });

        const expectedFile = path.join(projectCwd, 'src/components/ui/button/Button.vue');
        expect(await fs.readFile(expectedFile, 'utf-8')).toBe(pinnedButton.files[0].content);
        const manifest = await readManifest(projectCwd, fs);
        const sourceFields = { registrySource: tagSource, registryBaseSource: source, version: '1.2.0' };
        expect(manifest?.components.button).toMatchObject(sourceFields);
        expect(manifest?.components.badge).toMatchObject(sourceFields);
        expect(fetcher.mock.calls.map(([url]) => url).filter(url => url.endsWith('/button.json'))).toEqual([`${tagSource}/button.json`]);
    });

    it('recovers a missing baseline from the installed tag during a cross-version update', async () => {
        const source = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const tagSource = source.replace('/main/', '/v1.2.0/');
        const fetcher = vi.fn(async (url: string) => url === `${tagSource}/button.json`
            ? Response.json(buttonItem)
            : new Response(null, { status: 404 }));
        const registryClient = new RegistryClient({ sources: [source], fsAdapter: fs, httpFetcher: fetcher });
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs, registryClient });
        const engine = new ComponentMutationEngine(context);
        const plan = await engine.planInstall({ components: ['button@1.2.0'], useCache: false });
        await engine.execute(plan, { skipDependencies: true });
        const manifest = await readManifest(projectCwd, fs);
        const baseline = Object.values(manifest?.components.button.baselines ?? {})[0];
        await fs.remove(path.join(projectCwd, baseline));

        fetcher.mockClear();
        const recovered = await new BaselineProvider({ fs }).getComponentBaseline(context, 'button', {
            registrySource: source,
            useCache: false,
        });

        expect(recovered).toMatchObject({ status: 'ready', registrySource: tagSource });
        expect(fetcher.mock.calls.map(([url]) => url).filter(url => url.endsWith('/button.json')))
            .toEqual([`${tagSource}/button.json`]);
    });

    it.each(['official', 'local', 'fixed-release', 'fixed-release-bare'])('tracks the actual source for a %s registry', async (kind) => {
        const fixedRelease = DEFAULT_REGISTRY_URL.replace('/latest/download', '/download/v1.2.0');
        const localRegistry = path.join(projectCwd, 'registry');
        const source = kind === 'local' ? localRegistry : kind === 'official' ? DEFAULT_REGISTRY_URL : fixedRelease;
        const fetcher = vi.fn(async (url: string) => url === `${source}/button.json`
            ? Response.json(buttonItem)
            : new Response(null, { status: 404 }));
        if (kind === 'local') {
            await fs.ensureDir(localRegistry);
            await fs.writeJson(path.join(localRegistry, 'button.json'), buttonItem);
        }
        const registryClient = new RegistryClient({ sources: [source], fsAdapter: fs, httpFetcher: fetcher });
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs, registryClient });
        const engine = new ComponentMutationEngine(context);
        const specifier = kind === 'fixed-release-bare' ? 'button' : 'button@1.2.0';
        const plan = await engine.planInstall({ components: [specifier], useCache: false });
        await engine.execute(plan, { skipDependencies: true });

        const installed = (await readManifest(projectCwd, fs))?.components.button;
        expect(installed?.registrySource).toBe(source);
        expect(installed?.version).toBe(kind === 'fixed-release' ? '1.2.0' : 'latest');
        expect(installed?.registryBaseSource).toBe(kind === 'fixed-release' ? fixedRelease : undefined);
        if (kind === 'local') expect(fetcher).not.toHaveBeenCalled();
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

    it('syncs dependency declarations when a new version keeps the installed source files', async () => {
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, [buttonItem]);
        const engine = new ComponentMutationEngine(context);
        await engine.execute(await engine.planInstall({ components: ['button'] }), { skipDependencies: true });
        const version = '2.0.0';
        const specifier = `button@${version}`;
        const baseSource = 'https://registry.example.com';
        const item = { ...buttonItem, dependencies: ['clsx', 'vue'], registryDependencies: ['badge'] };
        const snapshot = { item, source: `${baseSource}/v${version}`, baseSource, version };
        const plan = await engine.planUpdate({ components: [specifier], registrySnapshots: new Map([[specifier, snapshot]]) });

        expect(plan.files).toEqual([]);
        expect(plan.npmDependencies).toEqual(['vue']);
        const result = await engine.execute(plan, { skipDependencies: true });
        expect(result.filesWritten).toEqual([]);
        expect((await readManifest(projectCwd, fs))?.components.button).toMatchObject({
            version,
            dependencies: item.dependencies,
            registryDependencies: item.registryDependencies,
        });
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

    it('keeps same-basename nested baselines distinct across sequential updates', async () => {
        const initialItem = makeComponentItem('widget', [
            { path: 'components/ui/widget/a/index.ts', content: 'export const a = "base-a";\n', type: 'registry:ui' },
            { path: 'components/ui/widget/b/index.ts', content: 'export const b = "base-b";\n', type: 'registry:ui' },
        ]);
        const registryItems = [initialItem];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, registryItems);
        const engine = new ComponentMutationEngine(context);

        await engine.execute(await engine.planInstall({ components: ['widget'] }), { skipDependencies: true });

        const fileA = path.join(projectCwd, 'src/components/ui/widget/a/index.ts');
        const fileB = path.join(projectCwd, 'src/components/ui/widget/b/index.ts');
        await fs.writeFile(fileA, 'export const a = "local-a";\n');

        registryItems[0] = makeComponentItem('widget', [
            { path: 'components/ui/widget/a/index.ts', content: 'export const a = "base-a";\n', type: 'registry:ui' },
            { path: 'components/ui/widget/b/index.ts', content: 'export const b = "remote-b2";\n', type: 'registry:ui' },
        ]);
        const updateV2 = await engine.planUpdate({ components: ['widget'], conflictStrategy: 'markers' });
        const resultV2 = await engine.execute(updateV2, { skipDependencies: true });

        expect(resultV2.conflicts).toEqual([]);
        expect(await fs.readFile(fileA, 'utf-8')).toBe('export const a = "local-a";\n');
        expect(await fs.readFile(fileB, 'utf-8')).toBe('export const b = "remote-b2";\n');

        registryItems[0] = makeComponentItem('widget', [
            { path: 'components/ui/widget/a/index.ts', content: 'export const a = "base-a";\n', type: 'registry:ui' },
            { path: 'components/ui/widget/b/index.ts', content: 'export const b = "remote-b3";\n', type: 'registry:ui' },
        ]);
        const updateV3 = await engine.planUpdate({ components: ['widget'], conflictStrategy: 'markers' });
        const resultV3 = await engine.execute(updateV3, { skipDependencies: true });

        expect(resultV3.conflicts).toEqual([]);
        expect(await fs.readFile(fileA, 'utf-8')).toBe('export const a = "local-a";\n');
        expect(await fs.readFile(fileB, 'utf-8')).toBe('export const b = "remote-b3";\n');

        const manifest = await fs.readJson(path.join(projectCwd, '.brutx/manifest.json'));
        const baselines = manifest.components.widget.baselines as Record<string, string>;
        expect(baselines['src/components/ui/widget/a/index.ts']).toBeDefined();
        expect(baselines['src/components/ui/widget/b/index.ts']).toBeDefined();
        expect(baselines['src/components/ui/widget/a/index.ts']).not.toBe(baselines['src/components/ui/widget/b/index.ts']);
    });

    it('retains skipped files and their baselines through the next update', async () => {
        const initialItem = makeComponentItem('card', [
            {
                path: 'components/ui/card/Card.vue',
                content: 'export const upstream = "base";\nexport const local = "base";\n',
                type: 'registry:ui',
            },
            {
                path: 'components/ui/card/card-options.ts',
                content: 'export const upstream = "base";\nexport const customization = "base";\n',
                type: 'registry:ui',
            },
        ]);
        const registryItems = [initialItem];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, registryItems);
        const engine = new ComponentMutationEngine(context);

        await engine.execute(await engine.planInstall({ components: ['card'] }), { skipDependencies: true });

        const cardFile = path.join(projectCwd, 'src/components/ui/card/Card.vue');
        const optionsFile = path.join(projectCwd, 'src/components/ui/card/card-options.ts');
        await fs.writeFile(cardFile, 'export const upstream = "base";\nexport const local = "user";\n');
        registryItems[0] = makeComponentItem('card', [
            {
                path: 'components/ui/card/Card.vue',
                content: 'export const upstream = "remote-v2";\nexport const local = "base";\n',
                type: 'registry:ui',
            },
            {
                path: 'components/ui/card/card-options.ts',
                content: 'export const upstream = "base";\nexport const customization = "base";\n',
                type: 'registry:ui',
            },
        ]);
        const updateV2 = await engine.planUpdate({ components: ['card'], conflictStrategy: 'markers' });
        expect(updateV2.files.find(file => file.filePath === optionsFile)?.action).toBe('skip');
        const resultV2 = await engine.execute(updateV2, { skipDependencies: true });
        expect(resultV2.conflicts).toEqual([]);

        const manifestAfterV2 = await fs.readJson(path.join(projectCwd, '.brutx/manifest.json'));
        expect(manifestAfterV2.components.card.files).toEqual([
            'src/components/ui/card/Card.vue',
            'src/components/ui/card/card-options.ts',
        ]);
        expect(manifestAfterV2.components.card.baselines['src/components/ui/card/card-options.ts']).toBeDefined();
        const integrityResults = await integrityHashDriftRule.check({
            cwd: projectCwd,
            projectContext: context,
            fs,
            config: sampleConfig,
            manifest: manifestAfterV2,
            offline: true,
        });
        expect(integrityResults).toEqual(expect.arrayContaining([
            expect.objectContaining({ ruleId: 'integrity.hash-drift', status: 'pass' }),
        ]));

        await fs.writeFile(optionsFile, 'export const upstream = "base";\nexport const customization = "user";\n');
        registryItems[0] = makeComponentItem('card', [
            {
                path: 'components/ui/card/Card.vue',
                content: 'export const upstream = "remote-v2";\nexport const local = "base";\n',
                type: 'registry:ui',
            },
            {
                path: 'components/ui/card/card-options.ts',
                content: 'export const upstream = "remote-v3";\nexport const customization = "base";\n',
                type: 'registry:ui',
            },
        ]);
        const updateV3 = await engine.planUpdate({ components: ['card'], conflictStrategy: 'markers' });
        const resultV3 = await engine.execute(updateV3, { skipDependencies: true });

        expect(resultV3.conflicts).toEqual([]);
        expect(await fs.readFile(optionsFile, 'utf-8')).toBe(
            'export const upstream = "remote-v3";\nexport const customization = "user";\n'
        );
    });

    it('updates remaining files when an upstream change targets a locally deleted file', async () => {
        const registryItems = [makeComponentItem('card', [
            { path: 'components/ui/card/Card.vue', content: 'export const card = "base";\n', type: 'registry:ui' },
            { path: 'components/ui/card/card-options.ts', content: 'export const options = "base";\n', type: 'registry:ui' },
        ])];
        const context = await ProjectContext.loadUninitialized(projectCwd, { fs });
        setupMockRegistry(context, registryItems);
        const engine = new ComponentMutationEngine(context);

        await engine.execute(await engine.planInstall({ components: ['card'] }), { skipDependencies: true });

        const cardFile = path.join(projectCwd, 'src/components/ui/card/Card.vue');
        const optionsFile = path.join(projectCwd, 'src/components/ui/card/card-options.ts');
        await fs.remove(cardFile);
        registryItems[0] = makeComponentItem('card', [
            { path: 'components/ui/card/Card.vue', content: 'export const card = "remote-v2";\n', type: 'registry:ui' },
            { path: 'components/ui/card/card-options.ts', content: 'export const options = "remote-v2";\n', type: 'registry:ui' },
        ]);

        const update = await engine.planUpdate({ components: ['card'], conflictStrategy: 'markers' });
        expect(update.files.find(file => file.filePath === cardFile)?.action).toBe('skip');
        const result = await engine.execute(update, { skipDependencies: true });

        expect(result.succeeded).toEqual(['card']);
        expect(result.manifestUpdated).toBe(true);
        expect(await fs.pathExists(cardFile)).toBe(false);
        expect(await fs.readFile(optionsFile, 'utf-8')).toBe('export const options = "remote-v2";\n');

        const manifest = await fs.readJson(path.join(projectCwd, '.brutx/manifest.json'));
        expect(manifest.components.card.files).toEqual([
            'src/components/ui/card/Card.vue',
            'src/components/ui/card/card-options.ts',
        ]);
        expect(manifest.components.card.installedContentHash).toBeUndefined();
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
        expect(client.fetchItemWithMeta).toHaveBeenCalledTimes(1);
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
