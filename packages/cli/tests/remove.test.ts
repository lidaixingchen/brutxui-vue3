import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';
import * as project from '../src/lib/project.js';
import * as prompts from '@inquirer/prompts';
import { remove } from '../src/commands/remove.js';
import { CliError } from '../src/lib/error.js';
import { logger } from '../src/lib/logger.js';
import type { BrutalistConfig, RegistryItem } from '../src/lib/types.js';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const original = await importOriginal<typeof registry>();
    return {
        ...original,
        readConfigSafe: vi.fn(),
        getItem: vi.fn(),
    };
});

vi.mock('../src/lib/project.js', async (importOriginal) => {
    const original = await importOriginal<typeof project>();
    return {
        ...original,
        resolveAliasPath: vi.fn(),
    };
});

vi.mock('@inquirer/prompts', () => ({
    confirm: vi.fn().mockResolvedValue(true),
}));

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedGetItem = vi.mocked(registry.getItem);
const mockedResolveAliasPath = vi.mocked(project.resolveAliasPath);
const mockedConfirm = vi.mocked(prompts.confirm);

const defaultConfig: BrutalistConfig = {
    $schema: 'https://example.com/schema.json',
    style: 'brutalism',
    tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
    aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        composables: '@/composables',
    },
};

describe('remove command', () => {
    let tmpDir: string;
    let savedEnv: string | undefined;
    let logSpy: ReturnType<typeof vi.spyOn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;
    let infoSpy: ReturnType<typeof vi.spyOn>;
    let successSpy: ReturnType<typeof vi.spyOn>;
    let boldSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        vi.clearAllMocks();
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-remove-'));
        savedEnv = process.env.BRUTX_NO_CACHE;
        process.env.BRUTX_NO_CACHE = '1';

        logSpy = vi.spyOn(logger, 'log');
        warnSpy = vi.spyOn(logger, 'warn');
        infoSpy = vi.spyOn(logger, 'info');
        successSpy = vi.spyOn(logger, 'success');
        boldSpy = vi.spyOn(logger, 'bold');

        mockedResolveAliasPath.mockImplementation(async (alias: string) => {
            const cleaned = alias.replace(/^@/, '').replace(/^[\\/]/, '');
            return path.join(tmpDir, 'src', cleaned);
        });

        mockedGetItem.mockImplementation(async (name: string) => {
            if (name === 'button') {
                return {
                    name: 'button',
                    type: 'registry:ui',
                    files: [],
                    dependencies: [],
                    registryDependencies: [],
                } satisfies RegistryItem;
            }
            if (name === 'card') {
                return {
                    name: 'card',
                    type: 'registry:ui',
                    files: [],
                    dependencies: [],
                    registryDependencies: ['button'],
                } satisfies RegistryItem;
            }
            throw new Error(`Unknown component: ${name}`);
        });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await fs.remove(tmpDir);
        if (savedEnv === undefined) {
            delete process.env.BRUTX_NO_CACHE;
        } else {
            process.env.BRUTX_NO_CACHE = savedEnv;
        }
    });

    async function createComponent(componentName: string, files: Record<string, string>): Promise<string> {
        const dir = path.join(tmpDir, 'src', 'components', componentName);
        await fs.mkdirp(dir);
        for (const [fileName, content] of Object.entries(files)) {
            await fs.writeFile(path.join(dir, fileName), content, 'utf-8');
        }
        return dir;
    }

    function getLoggedMessages(spy: ReturnType<typeof vi.spyOn>): string[] {
        return spy.mock.calls.map(call => String(call[0]));
    }

    describe('validation', () => {
        it('should throw CliError when components array is empty', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            await expect(
                remove([], { cwd: tmpDir, silent: true, yes: true }),
            ).rejects.toThrow(CliError);

            await expect(
                remove([], { cwd: tmpDir, silent: true, yes: true }),
            ).rejects.toThrow('Please specify at least one component to remove.');
        });

        it('should throw CliError when no components.json found', async () => {
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(
                remove(['button'], { cwd: tmpDir, silent: true, yes: true }),
            ).rejects.toThrow(CliError);

            await expect(
                remove(['button'], { cwd: tmpDir, silent: true, yes: true }),
            ).rejects.toThrow('No components.json found');
        });
    });

    describe('component not installed', () => {
        it('should log warning and return when specified component does not exist', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await fs.mkdirp(path.join(tmpDir, 'src', 'components'));

            await remove(['nonexistent'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('not installed'))).toBe(true);
            expect(warnMessages.some(m => m.includes('nonexistent'))).toBe(true);

            const infoMessages = getLoggedMessages(infoSpy);
            expect(infoMessages.some(m => m.includes('No components to remove'))).toBe(true);
        });
    });

    describe('dry-run', () => {
        it('should show what would be removed without actually removing', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            const buttonDir = await createComponent('button', {
                'Button.vue': '<template><button>Click</button></template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, dryRun: true, yes: true });

            expect(await fs.pathExists(buttonDir)).toBe(true);

            const boldMessages = getLoggedMessages(boldSpy);
            expect(boldMessages.some(m => m.includes('Dry Run'))).toBe(true);
            expect(boldMessages.some(m => m.includes('Would remove'))).toBe(true);
        });

        it('should display file count for each component in dry-run output', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
                'button-variants.ts': 'export const variants = {};',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, dryRun: true, yes: true });

            const logMessages = getLoggedMessages(logSpy);
            const buttonLine = logMessages.find(m => m.includes('button'));
            expect(buttonLine).toBeDefined();
            expect(buttonLine).toMatch(/2 file/);
        });

        it('should list orphaned files in dry-run output', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await createComponent('button', {
                'Button.vue': `import { useButton } from '@/composables/useButton.ts';\n<template>btn</template>`,
            });
            const composablesDir = path.join(tmpDir, 'src', 'composables');
            await fs.mkdirp(composablesDir);
            await fs.writeFile(
                path.join(composablesDir, 'useButton.ts'),
                'export function useButton() {}',
                'utf-8',
            );

            await remove(['button'], { cwd: tmpDir, silent: true, dryRun: true, yes: true });

            const logMessages = getLoggedMessages(logSpy);
            expect(logMessages.some(m => m.includes('Orphaned'))).toBe(true);
        });
    });

    describe('successful removal with --yes', () => {
        it('should remove component directory and show success message', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            const buttonDir = await createComponent('button', {
                'Button.vue': '<template><button>Click</button></template>',
                'button-variants.ts': 'export const variants = {};',
            });

            expect(await fs.pathExists(buttonDir)).toBe(true);

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(await fs.pathExists(buttonDir)).toBe(false);

            const successMessages = getLoggedMessages(successSpy);
            expect(successMessages.some(m => m.includes('Removed'))).toBe(true);
            expect(successMessages.some(m => m.includes('2 file(s)'))).toBe(true);
        });

        it('should not prompt for confirmation when --yes is set', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(mockedConfirm).not.toHaveBeenCalled();
        });

        it('should remove deleted components from the install manifest', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });
            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-button',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                    card: {
                        name: 'card',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-card',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/card/Card.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                },
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            const manifest = await fs.readJson(manifestPath);
            expect(manifest.components.button).toBeUndefined();
            expect(manifest.components.card).toBeDefined();
        });

        it('should remove manifest-only components when local directory is missing', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-button',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                },
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            const manifest = await fs.readJson(manifestPath);
            expect(manifest.components.button).toBeUndefined();
            const successMessages = getLoggedMessages(successSpy);
            expect(successMessages.some(m => m.includes('0 file(s)'))).toBe(true);
        });

        it('should remove manifest-known files that are no longer referenced', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            const composablePath = path.join(tmpDir, 'src', 'composables', 'useButton.ts');
            await fs.ensureDir(path.dirname(composablePath));
            await fs.writeFile(composablePath, 'export function useButton() {}', 'utf-8');
            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-button',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: [
                            'src/components/button/Button.vue',
                            'src/composables/useButton.ts',
                        ],
                        dependencies: [],
                        registryDependencies: [],
                    },
                },
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(await fs.pathExists(composablePath)).toBe(false);
        });
    });

    describe('removal cancelled by user', () => {
        it('should keep component directory when user declines confirmation', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedConfirm.mockResolvedValueOnce(false);

            const buttonDir = await createComponent('button', {
                'Button.vue': '<template><button>Click</button></template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true });

            expect(await fs.pathExists(buttonDir)).toBe(true);

            const infoMessages = getLoggedMessages(infoSpy);
            expect(infoMessages.some(m => m.includes('Removal cancelled'))).toBe(true);
        });

        it('should prompt for confirmation when --yes is not set', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedConfirm.mockResolvedValueOnce(true);

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true });

            expect(mockedConfirm).toHaveBeenCalledTimes(1);
            expect(mockedConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('button'),
                }),
            );
        });
    });

    describe('dependency warning', () => {
        it('should warn when the removed component has no own registry dependencies but other components depend on it', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('card') && m.includes('depends on') && m.includes('button'))).toBe(true);
        });

        it('should warn when other installed components depend on the removed component', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockImplementation(async (name: string) => {
                if (name === 'button') {
                    return {
                        name: 'button',
                        type: 'registry:ui',
                        files: [],
                        dependencies: [],
                        registryDependencies: ['some-base'],
                    } satisfies RegistryItem;
                }
                if (name === 'card') {
                    return {
                        name: 'card',
                        type: 'registry:ui',
                        files: [],
                        dependencies: [],
                        registryDependencies: ['button'],
                    } satisfies RegistryItem;
                }
                throw new Error(`Unknown component: ${name}`);
            });

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('card') && m.includes('depends on') && m.includes('button'))).toBe(true);
        });

        it('should check remaining component dependencies from their installed registry source', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });

            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://default.example.test/registry',
                        integrity: 'sha256-button',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                    card: {
                        name: 'card',
                        registrySource: 'https://custom.example.test/registry',
                        integrity: 'sha256-card',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/card/Card.vue'],
                        dependencies: [],
                        registryDependencies: ['button'],
                    },
                },
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(mockedGetItem).toHaveBeenCalledWith('card', 'https://custom.example.test/registry', true);
            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('card') && m.includes('depends on') && m.includes('button'))).toBe(true);
        });

        it('should not warn when no other component depends on the removed component', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockImplementation(async (name: string) => {
                if (name === 'button') {
                    return {
                        name: 'button',
                        type: 'registry:ui',
                        files: [],
                        dependencies: [],
                        registryDependencies: [],
                    } satisfies RegistryItem;
                }
                throw new Error(`Unknown component: ${name}`);
            });

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('depends on'))).toBe(false);
        });
    });

    describe('orphan file cleanup', () => {
        it('should detect and remove orphaned composable files with --yes', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            await createComponent('button', {
                'Button.vue': [
                    `import { useButton } from '@/composables/useButton.ts';`,
                    `<template><button>Click</button></template>`,
                ].join('\n'),
            });

            const composablesDir = path.join(tmpDir, 'src', 'composables');
            await fs.mkdirp(composablesDir);
            const composablePath = path.join(composablesDir, 'useButton.ts');
            await fs.writeFile(composablePath, 'export function useButton() {}', 'utf-8');

            expect(await fs.pathExists(composablePath)).toBe(true);

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(await fs.pathExists(composablePath)).toBe(false);

            const successMessages = getLoggedMessages(successSpy);
            expect(successMessages.some(m => m.includes('1 orphaned file(s)'))).toBe(true);
        });

        it('should prompt for orphan removal when --yes is not set and user accepts', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedConfirm
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(true);

            await createComponent('button', {
                'Button.vue': [
                    `import { useButton } from '@/composables/useButton.ts';`,
                    `<template><button>Click</button></template>`,
                ].join('\n'),
            });

            const composablesDir = path.join(tmpDir, 'src', 'composables');
            await fs.mkdirp(composablesDir);
            const composablePath = path.join(composablesDir, 'useButton.ts');
            await fs.writeFile(composablePath, 'export function useButton() {}', 'utf-8');

            await remove(['button'], { cwd: tmpDir, silent: true });

            expect(mockedConfirm).toHaveBeenCalledTimes(2);
            expect(await fs.pathExists(composablePath)).toBe(false);
        });

        it('should keep orphaned files when user declines orphan removal', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedConfirm
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            await createComponent('button', {
                'Button.vue': [
                    `import { useButton } from '@/composables/useButton.ts';`,
                    `<template><button>Click</button></template>`,
                ].join('\n'),
            });

            const composablesDir = path.join(tmpDir, 'src', 'composables');
            await fs.mkdirp(composablesDir);
            const composablePath = path.join(composablesDir, 'useButton.ts');
            await fs.writeFile(composablePath, 'export function useButton() {}', 'utf-8');

            await remove(['button'], { cwd: tmpDir, silent: true });

            expect(await fs.pathExists(composablePath)).toBe(true);

            const infoMessages = getLoggedMessages(infoSpy);
            expect(infoMessages.some(m => m.includes('Keeping orphaned'))).toBe(true);
        });

        it('should not treat files as orphaned if still imported by remaining components', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const sharedImport = `import { useShared } from '@/composables/useShared.ts'`;

            await createComponent('button', {
                'Button.vue': [
                    sharedImport,
                    `<template>btn</template>`,
                ].join('\n'),
            });
            await createComponent('card', {
                'Card.vue': [
                    sharedImport,
                    `<template>card</template>`,
                ].join('\n'),
            });

            const composablesDir = path.join(tmpDir, 'src', 'composables');
            await fs.mkdirp(composablesDir);
            const composablePath = path.join(composablesDir, 'useShared.ts');
            await fs.writeFile(composablePath, 'export function useShared() {}', 'utf-8');

            await remove(['button'], { cwd: tmpDir, silent: true, yes: true });

            expect(await fs.pathExists(composablePath)).toBe(true);
        });
    });

    describe('multiple components removal', () => {
        it('should remove multiple component directories at once', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const buttonDir = await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            const cardDir = await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });

            await remove(['button', 'card'], { cwd: tmpDir, silent: true, yes: true });

            expect(await fs.pathExists(buttonDir)).toBe(false);
            expect(await fs.pathExists(cardDir)).toBe(false);

            const successMessages = getLoggedMessages(successSpy);
            expect(successMessages.some(m => m.includes('Removed'))).toBe(true);
        });

        it('should show all components in the confirmation prompt', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedConfirm.mockResolvedValueOnce(true);

            await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });
            await createComponent('card', {
                'Card.vue': '<template>card</template>',
            });

            await remove(['button', 'card'], { cwd: tmpDir, silent: true });

            expect(mockedConfirm).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringMatching(/button.*card|card.*button/),
                }),
            );
        });
    });

    describe('non-existent component mixed with valid', () => {
        it('should warn about non-existent component but still remove the valid one', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const buttonDir = await createComponent('button', {
                'Button.vue': '<template>btn</template>',
            });

            await remove(['button', 'nonexistent'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('nonexistent') && m.includes('not installed'))).toBe(true);

            expect(await fs.pathExists(buttonDir)).toBe(false);

            const successMessages = getLoggedMessages(successSpy);
            expect(successMessages.some(m => m.includes('Removed'))).toBe(true);
        });

        it('should handle all non-existent components gracefully', async () => {
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            await fs.mkdirp(path.join(tmpDir, 'src', 'components'));

            await remove(['foo', 'bar'], { cwd: tmpDir, silent: true, yes: true });

            const warnMessages = getLoggedMessages(warnSpy);
            expect(warnMessages.some(m => m.includes('foo') && m.includes('bar'))).toBe(true);

            const infoMessages = getLoggedMessages(infoSpy);
            expect(infoMessages.some(m => m.includes('No components to remove'))).toBe(true);
        });
    });
});
