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
