import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { add } from '../src/commands/add.js';
import { update } from '../src/commands/update.js';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import type { RegistryItem } from '../src/lib/types.js';
import { RegistryClient } from '../src/lib/registry-client.js';
import { readManifest } from '../src/lib/manifest.js';
import { ProjectContext } from '../src/lib/project-context.js';
import { MergeExecutor } from '../src/lib/merge/merge-executor.js';
import { ComponentMutationEngine } from '../src/lib/services/component-mutation-engine.js';

describe('add command (CLI Adapter)', () => {
    let tmpDir: string;

    const buttonFiles = [
        {
            path: 'components/ui/button/Button.vue',
            content: "<template><button>TestButton</button></template>\n",
            type: 'registry:ui' as const,
        },
    ];

    const buttonItem: RegistryItem = {
        name: 'button',
        type: 'registry:ui',
        title: 'Button',
        description: 'Button component',
        dependencies: [],
        registryDependencies: [],
        examples: [],
        tailwind: {},
        cssVars: {},
        files: buttonFiles,
        integrity: computeRegistryIntegrity(buttonFiles),
    };

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-add-cmd-'));
        await fs.writeJson(path.join(tmpDir, 'package.json'), {
            name: 'test-app',
            dependencies: { vue: '^3.5.0' },
        });
        await fs.writeJson(path.join(tmpDir, 'components.json'), {
            $version: 1,
            style: 'brutalism',
            tailwind: { css: 'src/assets/main.css' },
            aliases: {
                components: '@/components',
                utils: '@/lib/utils',
                composables: '@/composables',
            },
        });
        await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
            compilerOptions: {
                baseUrl: '.',
                paths: { '@/*': ['./src/*'] },
            },
        });

        vi.spyOn(RegistryClient.prototype, 'resolve').mockResolvedValue({
            items: [buttonItem],
            npmDependencies: [],
            registryDependencies: [],
            missingComponents: [],
            hitSources: new Map([['button', 'https://registry.example.com']]),
        });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        await fs.remove(tmpDir);
    });

    it('adds component via thin CLI adapter and updates manifest', async () => {
        await add(['button'], {
            cwd: tmpDir,
            yes: true,
            silent: true,
        });

        const targetFile = path.join(tmpDir, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFile)).toBe(true);

        const manifestFile = path.join(tmpDir, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestFile)).toBe(true);
        const manifest = await fs.readJson(manifestFile);
        expect(manifest.components.button).toBeDefined();
    });

    it('leaves the project unchanged during add --merge --dry-run and restores the baseline on a real run', async () => {
        const options = { cwd: tmpDir, yes: true, silent: true, cache: false };
        vi.spyOn(RegistryClient.prototype, 'fetchItem').mockResolvedValue(buttonItem);
        await add(['button'], options);

        const manifestPath = path.join(tmpDir, '.brutx/manifest.json');
        const manifest = (await readManifest(tmpDir))!;
        const entry = manifest.components.button;
        const sourcePath = path.join(tmpDir, entry.files[0]);
        const source = await fs.readFile(sourcePath, 'utf-8');
        const baselinePath = path.join(tmpDir, entry.baselines![entry.files[0]]);
        await fs.remove(baselinePath);
        delete entry.baselines;
        await fs.writeJson(manifestPath, manifest);
        const manifestBefore = await fs.readFile(manifestPath, 'utf-8');

        await add(['button'], { ...options, merge: true, dryRun: true });

        expect(await fs.pathExists(baselinePath)).toBe(false);
        expect(await fs.readFile(manifestPath, 'utf-8')).toBe(manifestBefore);
        expect(await fs.readFile(sourcePath, 'utf-8')).toBe(source);

        await add(['button'], { ...options, merge: true });

        expect(await fs.readFile(baselinePath, 'utf-8')).toBe(source);
        expect((await readManifest(tmpDir))?.components.button).toMatchObject({
            installedAt: entry.installedAt,
            baselines: { [entry.files[0]]: path.relative(tmpDir, baselinePath).split(path.sep).join('/') },
        });
        expect(await fs.readFile(sourcePath, 'utf-8')).toBe(source);
    });

    it('keeps the remote cache untouched in add and update dry-runs and still reads it offline', async () => {
        vi.mocked(RegistryClient.prototype.resolve).mockRestore();
        const cacheDir = path.join(tmpDir, '.brutx', 'registry-cache');
        vi.stubEnv('BRUTX_CACHE_DIR', cacheDir);
        vi.stubEnv('BRUTX_NO_CACHE', undefined);
        vi.stubEnv('BRUTX_OFFLINE', undefined);
        const registry = 'https://registry.example.com';
        const itemUrl = `${registry}/button.json`;
        const etag = '"button-v1"';
        const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
            if (url !== itemUrl) return new Response(null, { status: 404 });
            if (new Headers(init?.headers).get('if-none-match') === etag) {
                return new Response(null, { status: 304 });
            }
            return Response.json(buttonItem, { headers: { ETag: etag } });
        });
        vi.stubGlobal('fetch', fetcher);
        const options = { cwd: tmpDir, registry, yes: true, silent: true };

        await add(['button'], { ...options, merge: true, dryRun: true });
        expect(fetcher.mock.calls.some(([url]) => url === itemUrl)).toBe(true);
        expect(await fs.pathExists(cacheDir)).toBe(false);
        expect(await readManifest(tmpDir)).toBeNull();

        await add(['button'], options);
        const [entry] = await fs.readdir(cacheDir);
        const cacheFile = path.join(cacheDir, entry);
        const cacheEntry = await fs.readJson(cacheFile);
        await fs.writeJson(cacheFile, { ...cacheEntry, timestamp: 0 });
        const original = await fs.readFile(cacheFile, 'utf8');

        fetcher.mockClear();
        await add(['button'], { ...options, merge: true, offline: true, dryRun: true });
        expect(fetcher).not.toHaveBeenCalled();
        expect(await fs.readFile(cacheFile, 'utf8')).toBe(original);

        await update(['button'], { ...options, dryRun: true });
        const request = fetcher.mock.calls.find(([url]) => url === itemUrl);
        expect(new Headers(request?.[1]?.headers).get('if-none-match')).toBe(etag);
        expect(await fs.readFile(cacheFile, 'utf8')).toBe(original);

        await update(['button'], options);
        expect((await fs.readJson(cacheFile)).timestamp).toBeGreaterThan(0);
    });

    it('keeps direct SDK merge and mutation plans read-only while allowing standalone execution to cache', async () => {
        vi.mocked(RegistryClient.prototype.resolve).mockRestore();
        const cacheDir = path.join(tmpDir, '.brutx', 'registry-cache');
        const registry = 'https://registry.example.com';
        const itemUrl = `${registry}/button.json`;
        vi.stubEnv('BRUTX_CACHE_DIR', cacheDir);
        vi.stubEnv('BRUTX_NO_CACHE', undefined);
        vi.stubEnv('BRUTX_OFFLINE', undefined);
        const fetcher = vi.fn(async (url: string) => url === itemUrl
            ? Response.json(buttonItem)
            : new Response(null, { status: 404 }));
        vi.stubGlobal('fetch', fetcher);

        await add(['button'], { cwd: tmpDir, registry, yes: true, silent: true, cache: false });
        const installed = (await readManifest(tmpDir))!.components.button;
        const baselinePath = path.join(tmpDir, installed.baselines![installed.files[0]]);
        await fs.remove(baselinePath);
        const context = await ProjectContext.load(tmpDir);
        const executor = new MergeExecutor();
        const engine = new ComponentMutationEngine(context);
        const plans = [
            async () => (await executor.plan(context, 'button', buttonItem)).baselineRecovery,
            async () => (await executor.planAndExecute(context, 'button', buttonItem, { dryRun: true })).plan.baselineRecovery,
            async () => (await engine.planInstall({ components: ['button'], registryOverride: registry, merge: true })).baselineRecoveries?.[0],
            async () => (await engine.planUpdate({ components: ['button'] })).baselineRecoveries?.[0],
        ];

        for (const plan of plans) {
            fetcher.mockClear();
            expect(await plan()).toMatchObject({ componentName: 'button' });
            expect(fetcher.mock.calls.some(([url]) => url === itemUrl)).toBe(true);
            expect(await fs.pathExists(cacheDir)).toBe(false);
            expect(await fs.pathExists(baselinePath)).toBe(false);
        }

        await executor.planAndExecute(context, 'button', buttonItem);
        expect(await fs.pathExists(baselinePath)).toBe(true);
        const [entry] = await fs.readdir(cacheDir);
        const cacheFile = path.join(cacheDir, entry);
        const original = await fs.readFile(cacheFile, 'utf8');

        await fs.remove(baselinePath);
        vi.stubEnv('BRUTX_OFFLINE', '1');
        const offline = await ProjectContext.load(tmpDir);
        fetcher.mockClear();
        expect((await executor.plan(offline, 'button', buttonItem)).baselineRecovery).toBeDefined();
        expect(fetcher).not.toHaveBeenCalled();
        expect(await fs.readFile(cacheFile, 'utf8')).toBe(original);
        expect(await fs.pathExists(baselinePath)).toBe(false);
    });

    it('updates a pinned install from its original source with --across-versions', async () => {
        vi.mocked(RegistryClient.prototype.resolve).mockRestore();
        const baseSource = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const sourceFor = (tag: string) => baseSource.replace('/main/', `/${tag}/`);
        const oldTagSource = sourceFor('v1.2.0');
        const nextTagSource = sourceFor('v2.0.0');
        const oldFiles = [{ ...buttonFiles[0], content: '<template>Pinned 1</template>\n' }];
        const nextFiles = [{ ...buttonFiles[0], content: '<template>Pinned 2</template>\n' }];
        const items = new Map([
            [`${baseSource}/button.json`, buttonItem],
            [`${oldTagSource}/button.json`, { ...buttonItem, files: oldFiles, integrity: computeRegistryIntegrity(oldFiles) }],
            [`${nextTagSource}/button.json`, { ...buttonItem, files: nextFiles, integrity: computeRegistryIntegrity(nextFiles) }],
        ]);
        const fetcher = vi.fn(async (url: string) => {
            const item = items.get(url);
            return item ? Response.json(item) : new Response(null, { status: 404 });
        });
        vi.stubGlobal('fetch', fetcher);
        const options = { cwd: tmpDir, yes: true, silent: true, cache: false };
        const file = path.join(tmpDir, 'src/components/ui/button/Button.vue');

        await add(['button@1.2.0'], { ...options, registry: baseSource });
        expect(await fs.readFile(file, 'utf-8')).toBe(oldFiles[0].content);
        expect((await readManifest(tmpDir))?.components.button).toMatchObject({
            version: '1.2.0',
            registrySource: oldTagSource,
            registryBaseSource: baseSource,
        });

        fetcher.mockClear();
        await update(['button'], { ...options, force: true });
        expect(fetcher).not.toHaveBeenCalled();
        expect(await fs.readFile(file, 'utf-8')).toBe(oldFiles[0].content);

        await update(['button@2.0.0'], { ...options, force: true, acrossVersions: true });
        expect(fetcher.mock.calls.map(([url]) => url).filter(url => url.endsWith('/button.json')))
            .toEqual([`${nextTagSource}/button.json`]);
        expect(await fs.readFile(file, 'utf-8')).toBe(nextFiles[0].content);
        expect((await readManifest(tmpDir))?.components.button).toMatchObject({
            version: '2.0.0',
            registrySource: nextTagSource,
            registryBaseSource: baseSource,
        });

        fetcher.mockClear();
        await update(['button'], { ...options, force: true, acrossVersions: true });
        expect(fetcher.mock.calls.map(([url]) => url).filter(url => url.endsWith('/button.json')))
            .toEqual([`${baseSource}/button.json`]);
        expect(await fs.readFile(file, 'utf-8')).toBe(buttonFiles[0].content);
        const installed = (await readManifest(tmpDir))?.components.button;
        expect(installed).toMatchObject({ version: 'latest', registrySource: baseSource });
        expect(installed?.registryBaseSource).toBeUndefined();
    });

    it('changes registry versions with identical files and preserves the local installation', async () => {
        vi.mocked(RegistryClient.prototype.resolve).mockRestore();
        const baseSource = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const firstTagSource = baseSource.replace('/main/', '/v1.2.0/');
        const secondTagSource = baseSource.replace('/main/', '/v2.0.0/');
        const componentUrls = new Set([firstTagSource, secondTagSource, baseSource].map(source => `${source}/button.json`));
        const secondTagItem = { ...buttonItem, status: 'legacy', replacement: 'icon-button', examples: ['compact'] };
        const fetcher = vi.fn(async (url: string) => componentUrls.has(url)
            ? Response.json(url === `${secondTagSource}/button.json` ? secondTagItem : buttonItem)
            : new Response(null, { status: 404 }));
        vi.stubGlobal('fetch', fetcher);
        const options = { cwd: tmpDir, yes: true, silent: true, cache: false };
        const file = path.join(tmpDir, 'src/components/ui/button/Button.vue');
        await add(['button@1.2.0'], { ...options, registry: baseSource });

        const previous = (await readManifest(tmpDir))!.components.button;
        const baseline = path.join(tmpDir, Object.values(previous.baselines!)[0]);
        const persistedBaseline = await fs.readFile(baseline, 'utf8');
        const requestedComponentUrls = () => fetcher.mock.calls.map(([url]) => url).filter(url => componentUrls.has(url));
        fetcher.mockClear();
        await update(['button@2.0.0'], { ...options, acrossVersions: true, dryRun: true });
        expect(requestedComponentUrls()).toEqual([`${secondTagSource}/button.json`]);
        expect((await readManifest(tmpDir))?.components.button).toEqual(previous);
        expect(await fs.readFile(baseline, 'utf8')).toBe(persistedBaseline);

        fetcher.mockClear();
        await update(['button@2.0.0'], { ...options, acrossVersions: true });
        expect(requestedComponentUrls()).toEqual([`${secondTagSource}/button.json`]);
        expect((await readManifest(tmpDir))?.components.button).toEqual({
            ...previous,
            registrySource: secondTagSource,
            version: '2.0.0',
            status: secondTagItem.status,
            replacement: secondTagItem.replacement,
            examples: secondTagItem.examples,
        });

        const localContent = '<template>Local changes</template>\n';
        await fs.writeFile(file, localContent);
        fetcher.mockClear();
        await update(['button'], { ...options, acrossVersions: true, force: true });
        expect(requestedComponentUrls()).toEqual([`${baseSource}/button.json`]);
        expect((await readManifest(tmpDir))?.components.button).toEqual({
            ...previous,
            registrySource: baseSource,
            registryBaseSource: undefined,
            version: 'latest',
        });
        expect(await fs.readFile(file, 'utf8')).toBe(localContent);
        expect(await fs.readFile(baseline, 'utf8')).toBe(persistedBaseline);

        fetcher.mockClear();
        await update(['button@1.2.0'], options);
        expect(requestedComponentUrls()).toEqual([`${firstTagSource}/button.json`]);
        expect((await readManifest(tmpDir))?.components.button).toEqual(previous);
        expect(await fs.readFile(file, 'utf8')).toBe(localContent);
    });

    it.each([
        { target: '2.0.0', acrossVersions: false, dropBaseline: false },
        { target: '3.0.0', acrossVersions: true, dropBaseline: true },
    ])('merges a partially added version into $target', async ({ target, acrossVersions, dropBaseline }) => {
        vi.mocked(RegistryClient.prototype.resolve).mockRestore();
        const baseSource = 'https://raw.githubusercontent.com/org/repo/main/registry';
        const sourceFor = (version: string) => baseSource.replace('/main/', `/v${version}/`);
        const helper = { ...buttonFiles[0], path: 'components/ui/button/helper.ts', content: 'export const helper = true;\n' };
        const items = new Map(['1.2.0', '2.0.0', '3.0.0'].map(version => {
            const files = [{ ...buttonFiles[0], content: `<template>${version}</template>\n` }];
            if (version !== '1.2.0') files.push(helper);
            return [`${sourceFor(version)}/button.json`, { ...buttonItem, files, integrity: computeRegistryIntegrity(files) }];
        }));
        const fetcher = vi.fn(async (url: string) => {
            const item = items.get(url);
            return item ? Response.json(item) : new Response(null, { status: 404 });
        });
        vi.stubGlobal('fetch', fetcher);
        const options = { cwd: tmpDir, yes: true, silent: true, cache: false };
        await add(['button@1.2.0'], { ...options, registry: baseSource });
        await add(['button@2.0.0'], { ...options, registry: baseSource });

        const entry = (await readManifest(tmpDir))!.components.button;
        const [buttonPath, helperPath] = entry.files;
        expect(entry).toMatchObject({ version: '2.0.0', pendingFiles: [buttonPath] });
        expect(await fs.readFile(path.join(tmpDir, buttonPath), 'utf-8')).toBe('<template>1.2.0</template>\n');
        expect(await fs.readFile(path.join(tmpDir, entry.baselines![buttonPath]), 'utf-8')).toBe('<template>1.2.0</template>\n');
        expect(await fs.readFile(path.join(tmpDir, entry.baselines![helperPath]), 'utf-8')).toBe(helper.content);
        if (dropBaseline) await fs.remove(path.join(tmpDir, entry.baselines![buttonPath]));

        fetcher.mockClear();
        await update([`button@${target}`], { ...options, acrossVersions });
        expect(await fs.readFile(path.join(tmpDir, buttonPath), 'utf-8')).toBe(`<template>${target}</template>\n`);
        const completed = (await readManifest(tmpDir))!.components.button;
        expect(completed.version).toBe(target);
        expect(completed.pendingFiles).toBeUndefined();
        expect(completed.baselineSources).toBeUndefined();
        expect(completed.files).toEqual(entry.files);
        if (dropBaseline) expect(fetcher).toHaveBeenCalledWith(`${sourceFor('1.2.0')}/button.json`, expect.anything());
    });

    it('supports dry-run without writing files', async () => {
        await add(['button'], {
            cwd: tmpDir,
            yes: true,
            silent: true,
            dryRun: true,
        });

        const targetFile = path.join(tmpDir, 'src/components/ui/button/Button.vue');
        expect(await fs.pathExists(targetFile)).toBe(false);
        const manifestFile = path.join(tmpDir, '.brutx/manifest.json');
        expect(await fs.pathExists(manifestFile)).toBe(false);
    });
});
