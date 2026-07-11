vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/lib/registry.js')>();
    return { ...original, readConfigSafe: vi.fn() };
});

vi.mock('../src/lib/services/diff-service.js', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/lib/services/diff-service.js')>();
    return { ...original, getInstalledComponents: vi.fn(), diffComponent: vi.fn() };
});

vi.mock('../src/commands/add.js', () => ({
    add: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@inquirer/prompts', () => ({
    checkbox: vi.fn().mockResolvedValue([]),
    confirm: vi.fn().mockResolvedValue(true),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';
import * as diffService from '../src/lib/services/diff-service.js';
import * as addModule from '../src/commands/add.js';
import * as prompts from '@inquirer/prompts';
import { update } from '../src/commands/update.js';
import type { DiffResult } from '../src/lib/types.js';

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedGetInstalledComponents = vi.mocked(diffService.getInstalledComponents);
const mockedDiffComponent = vi.mocked(diffService.diffComponent);
const mockedAdd = vi.mocked(addModule.add);
const mockedCheckbox = vi.mocked(prompts.checkbox);
const mockedConfirm = vi.mocked(prompts.confirm);

const defaultConfig = {
    $schema: 'https://example.com/schema.json',
    style: 'brutalism',
    tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
    aliases: { components: '@/components', utils: '@/lib/utils', composables: '@/composables' },
};

const upToDateResult: DiffResult = {
    component: 'badge',
    status: 'up-to-date',
    files: [{ path: 'components/badge/Badge.vue', status: 'unchanged' }],
};

const outdatedIntegrityResult: DiffResult = {
    component: 'badge',
    status: 'up-to-date',
    files: [{ path: 'components/badge/Badge.vue', status: 'unchanged' }],
    integrityStatus: 'outdated',
};

const modifiedResult: DiffResult = {
    component: 'button',
    status: 'modified',
    files: [
        { path: 'components/button/Button.vue', status: 'modified', patch: '--- a\n+++ b\n-old\n+new' },
        { path: 'components/button/button-variants.ts', status: 'unchanged' },
    ],
};

const modifiedNoPatch: DiffResult = {
    component: 'card',
    status: 'modified',
    files: [
        { path: 'components/card/Card.vue', status: 'added' },
    ],
};

describe('update command', () => {
    let savedEnv: string | undefined;
    let tmpDirs: string[];

    beforeEach(() => {
        vi.clearAllMocks();
        tmpDirs = [];
        savedEnv = process.env.BRUTX_NO_CACHE;
        process.env.BRUTX_NO_CACHE = '1';
        mockedReadConfigSafe.mockResolvedValue(defaultConfig);
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await Promise.all(tmpDirs.map(dir => fs.remove(dir)));
        if (savedEnv === undefined) delete process.env.BRUTX_NO_CACHE;
        else process.env.BRUTX_NO_CACHE = savedEnv;
    });

    async function createProjectWithManifest(components: Record<string, { registrySource: string }>): Promise<string> {
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-update-'));
        tmpDirs.push(tmpDir);
        const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
        await fs.ensureDir(path.dirname(manifestPath));
        await fs.writeJson(manifestPath, {
            version: 1,
            components: Object.fromEntries(Object.entries(components).map(([name, entry]) => [name, {
                name,
                registrySource: entry.registrySource,
                integrity: `sha256-${name}`,
                installedAt: '2026-07-07T00:00:00.000Z',
                files: [`src/components/ui/${name}/${name}.vue`],
                dependencies: [],
                registryDependencies: [],
                examples: [],
            }])),
        });
        return tmpDir;
    }

    describe('no config', () => {
        it('should throw CliError when components.json not found', async () => {
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(update([], { cwd: '/tmp', silent: true }))
                .rejects.toThrow('No components.json found');
        });
    });

    describe('no installed components', () => {
        it('should return early when getInstalledComponents returns empty', async () => {
            mockedGetInstalledComponents.mockResolvedValue([]);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedDiffComponent).not.toHaveBeenCalled();
            expect(mockedAdd).not.toHaveBeenCalled();
        });

        it('should use provided component names instead of auto-discovery', async () => {
            mockedDiffComponent.mockResolvedValue(upToDateResult);

            await update(['badge'], { cwd: '/tmp', silent: true });

            expect(mockedGetInstalledComponents).not.toHaveBeenCalled();
            expect(mockedDiffComponent).toHaveBeenCalledOnce();
        });
    });

    describe('all up-to-date', () => {
        it('should not call add when all components are up-to-date', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['badge']);
            mockedDiffComponent.mockResolvedValue(upToDateResult);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedAdd).not.toHaveBeenCalled();
        });
    });

    describe('has updates with --dry-run', () => {
        it('should return without calling add in dry-run mode', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button', 'badge']);
            mockedDiffComponent.mockImplementation(async (_cwd, _config, name) => {
                if (name === 'button') return modifiedResult;
                return upToDateResult;
            });

            await update([], { cwd: '/tmp', silent: true, dryRun: true });

            expect(mockedAdd).not.toHaveBeenCalled();
        });

        it('should not prompt user in dry-run mode', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);

            await update([], { cwd: '/tmp', silent: true, dryRun: true });

            expect(mockedCheckbox).not.toHaveBeenCalled();
            expect(mockedConfirm).not.toHaveBeenCalled();
        });
    });

    describe('has updates with --yes --all', () => {
        it('should call add with all outdated components', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button', 'badge']);
            mockedDiffComponent.mockImplementation(async (_cwd, _config, name) => {
                if (name === 'button') return modifiedResult;
                return upToDateResult;
            });

            await update([], { cwd: '/tmp', silent: true, yes: true, all: true });

            expect(mockedAdd).toHaveBeenCalledOnce();
            expect(mockedAdd).toHaveBeenCalledWith(
                ['button'],
                expect.objectContaining({ overwrite: true, yes: true })
            );
        });

        it('should update components with outdated manifest integrity even when files match latest', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['badge']);
            mockedDiffComponent.mockResolvedValue(outdatedIntegrityResult);

            await update([], { cwd: '/tmp', silent: true, yes: true, all: true });

            expect(mockedAdd).toHaveBeenCalledWith(
                ['badge'],
                expect.objectContaining({ overwrite: true, yes: true })
            );
        });

        it('should pass cwd and registry options to add', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);

            await update([], {
                cwd: '/my/project',
                silent: true,
                yes: true,
                registry: 'https://custom.registry.com',
            });

            expect(mockedAdd).toHaveBeenCalledWith(
                ['button'],
                expect.objectContaining({
                    cwd: '/my/project',
                    registry: 'https://custom.registry.com',
                })
            );
        });

        it('should use manifest registry source when --registry is not provided', async () => {
            const tmpDir = await createProjectWithManifest({
                button: { registrySource: 'https://example.test/registry-a' },
            });
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);

            await update([], { cwd: tmpDir, silent: true, yes: true });

            expect(mockedDiffComponent).toHaveBeenCalledWith(
                tmpDir,
                defaultConfig,
                'button',
                'https://example.test/registry-a',
                expect.objectContaining({ name: 'button' }),
                true,
            );
            expect(mockedAdd).toHaveBeenCalledWith(
                ['button'],
                expect.objectContaining({
                    cwd: tmpDir,
                    registry: 'https://example.test/registry-a',
                })
            );
        });

        it('should group selected updates by manifest registry source', async () => {
            const tmpDir = await createProjectWithManifest({
                button: { registrySource: 'https://example.test/registry-a' },
                card: { registrySource: 'https://example.test/registry-b' },
            });
            mockedGetInstalledComponents.mockResolvedValue(['button', 'card']);
            mockedDiffComponent.mockImplementation(async (_cwd, _config, name) => {
                if (name === 'button') return modifiedResult;
                return modifiedNoPatch;
            });

            await update([], { cwd: tmpDir, silent: true, yes: true, all: true });

            expect(mockedAdd).toHaveBeenCalledTimes(2);
            expect(mockedAdd).toHaveBeenCalledWith(
                ['button'],
                expect.objectContaining({ registry: 'https://example.test/registry-a' })
            );
            expect(mockedAdd).toHaveBeenCalledWith(
                ['card'],
                expect.objectContaining({ registry: 'https://example.test/registry-b' })
            );
        });

        it('should let --registry override manifest registry sources', async () => {
            const tmpDir = await createProjectWithManifest({
                button: { registrySource: 'https://example.test/registry-a' },
            });
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);

            await update([], {
                cwd: tmpDir,
                silent: true,
                yes: true,
                registry: 'https://override.test/registry',
            });

            expect(mockedDiffComponent).toHaveBeenCalledWith(
                tmpDir,
                defaultConfig,
                'button',
                'https://override.test/registry',
                expect.objectContaining({ name: 'button' }),
                true,
            );
            expect(mockedAdd).toHaveBeenCalledWith(
                ['button'],
                expect.objectContaining({ registry: 'https://override.test/registry' })
            );
        });
    });

    describe('multiple outdated components', () => {
        it('should update all outdated components with --all', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button', 'card', 'badge']);
            mockedDiffComponent.mockImplementation(async (_cwd, _config, name) => {
                if (name === 'button') return modifiedResult;
                if (name === 'card') return modifiedNoPatch;
                return upToDateResult;
            });

            await update([], { cwd: '/tmp', silent: true, yes: true, all: true });

            expect(mockedAdd).toHaveBeenCalledWith(
                ['button', 'card'],
                expect.anything()
            );
        });
    });

    describe('overwrite warning for local modifications', () => {
        it('should warn about modified files and proceed with --yes', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);

            await update([], { cwd: '/tmp', silent: true, yes: true });

            expect(mockedConfirm).not.toHaveBeenCalled();
            expect(mockedAdd).toHaveBeenCalledOnce();
        });

        it('should ask for confirmation when not --yes and files are modified', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);
            mockedCheckbox.mockResolvedValue(['button']);
            mockedConfirm.mockResolvedValue(true);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('Overwrite'),
                    default: false,
                })
            );
            expect(mockedAdd).toHaveBeenCalledOnce();
        });

        it('should cancel update when user declines overwrite confirmation', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);
            mockedCheckbox.mockResolvedValue(['button']);
            mockedConfirm.mockResolvedValue(false);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedAdd).not.toHaveBeenCalled();
        });
    });

    describe('interactive selection', () => {
        it('should use checkbox for component selection when not --yes', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button', 'card']);
            mockedDiffComponent.mockImplementation(async (_cwd, _config, name) => {
                if (name === 'button') return modifiedResult;
                if (name === 'card') return modifiedNoPatch;
                return upToDateResult;
            });
            mockedCheckbox.mockResolvedValue(['button']);
            mockedConfirm.mockResolvedValue(true);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedCheckbox).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Select components to update:',
                    choices: expect.arrayContaining([
                        expect.objectContaining({ value: 'button' }),
                        expect.objectContaining({ value: 'card' }),
                    ]),
                })
            );
            expect(mockedAdd).toHaveBeenCalledWith(['button'], expect.anything());
        });

        it('should return early when no components selected', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockResolvedValue(modifiedResult);
            mockedCheckbox.mockResolvedValue([]);

            await update([], { cwd: '/tmp', silent: true });

            expect(mockedAdd).not.toHaveBeenCalled();
        });
    });

    describe('network failure', () => {
        it('should propagate diffComponent errors', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['button']);
            mockedDiffComponent.mockRejectedValue(new Error('Network timeout'));

            await expect(update([], { cwd: '/tmp', silent: true }))
                .rejects.toThrow('Network timeout');
        });
    });

    describe('--no-cache flag', () => {
        it('should pass useCache=false to diffComponent when cache is false', async () => {
            mockedGetInstalledComponents.mockResolvedValue(['badge']);
            mockedDiffComponent.mockResolvedValue(upToDateResult);

            await update([], { cwd: '/tmp', silent: true, cache: false } as any);

            expect(mockedDiffComponent).toHaveBeenCalledWith(
                '/tmp',
                defaultConfig,
                'badge',
                undefined,
                undefined,
                false,
            );
        });
    });
});
