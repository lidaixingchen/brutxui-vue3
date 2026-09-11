import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { add } from '../src/commands/add.js';
import { computeRegistryIntegrity } from 'brutx-shared-vue';
import type { RegistryItem } from '../src/lib/types.js';
import { RegistryClient } from '../src/lib/registry-client.js';

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
