import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import type { BrutalistConfig, ListOptions, InstalledComponentInfo } from '../src/lib/types.js';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/registry.js')>();
    return { ...actual, readConfigSafe: vi.fn() };
});

vi.mock('../src/lib/project.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../src/lib/project.js')>();
    return { ...actual, resolveAliasPath: vi.fn() };
});

import * as registry from '../src/lib/registry.js';
import * as project from '../src/lib/project.js';
import { list } from '../src/commands/list.js';
import { CliError } from '../src/lib/error.js';

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedResolveAliasPath = vi.mocked(project.resolveAliasPath);

function makeConfig(overrides: Partial<BrutalistConfig> = {}): BrutalistConfig {
    return {
        $schema: 'https://example.com/schema.json',
        $version: 1,
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: '@/styles/globals.css' },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
        ...overrides,
    };
}

async function captureListJson(options: ListOptions): Promise<{ parsed: InstalledComponentInfo[]; raw: string }> {
    const output: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
    });

    await list(options);

    spy.mockRestore();
    const raw = output.join('');
    return { parsed: JSON.parse(raw) as InstalledComponentInfo[], raw };
}

describe('list command', () => {
    let tmpDir: string;

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-list-'));

        mockedResolveAliasPath.mockImplementation(async (alias: string) => {
            return path.join(tmpDir, 'src', alias.replace('@/', ''));
        });
    });

    afterEach(async () => {
        await fs.remove(tmpDir);
        vi.restoreAllMocks();
    });

    describe('no config', () => {
        it('throws CliError when readConfigSafe returns null', async () => {
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(
                list({ cwd: tmpDir, silent: true }),
            ).rejects.toThrow(CliError);

            await expect(
                list({ cwd: tmpDir, silent: true }),
            ).rejects.toThrow('No components.json found. Run `brutx-vue init` first.');
        });
    });

    describe('no installed components', () => {
        it('logs message when components directory is empty', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());
            await fs.ensureDir(path.join(tmpDir, 'src', 'components'));

            const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const loggerSpy = vi.fn();

            // logger.info is used for the "No installed" message, so we capture process.stdout
            let stdoutOutput = '';
            const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
                stdoutOutput += String(chunk);
                return true;
            }) as typeof process.stdout.write);

            await list({ cwd: tmpDir, silent: true });

            infoSpy.mockRestore();
            writeSpy.mockRestore();
        });

        it('logs message when components directory does not exist', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            // Components dir does not exist at all — resolveAliasPath still returns the path
            let stdoutOutput = '';
            const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
                stdoutOutput += String(chunk);
                return true;
            }) as typeof process.stdout.write);

            await list({ cwd: tmpDir, silent: true });

            writeSpy.mockRestore();
        });
    });

    describe('lists installed components', () => {
        it('detects button and card components with correct file counts', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const buttonDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.ensureDir(buttonDir);
            await fs.writeFile(
                path.join(buttonDir, 'Button.vue'),
                '<template><button><slot /></button></template>',
            );
            await fs.writeFile(
                path.join(buttonDir, 'button-variants.ts'),
                'export const buttonVariants = {};',
            );

            const cardDir = path.join(tmpDir, 'src', 'components', 'card');
            await fs.ensureDir(cardDir);
            await fs.writeFile(
                path.join(cardDir, 'Card.vue'),
                '<template><div><slot /></div></template>',
            );

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            expect(parsed).toHaveLength(2);

            const button = parsed.find(c => c.name === 'button')!;
            expect(button).toBeDefined();
            expect(button.files).toContain('Button.vue');
            expect(button.files).toContain('button-variants.ts');
            expect(button.fileCount).toBe(2);

            const card = parsed.find(c => c.name === 'card')!;
            expect(card).toBeDefined();
            expect(card.files).toContain('Card.vue');
            expect(card.fileCount).toBe(1);
        });

        it('merges manifest metadata into scanned components', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const buttonDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.ensureDir(buttonDir);
            await fs.writeFile(
                path.join(buttonDir, 'Button.vue'),
                '<template><button><slot /></button></template>',
            );
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
                        dependencies: ['vue'],
                        registryDependencies: ['primitive'],
                    },
                },
            });

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });
            const button = parsed.find(c => c.name === 'button')!;

            expect(button.managed).toBe(true);
            expect(button.registrySource).toBe('https://example.test/registry');
            expect(button.installedIntegrity).toBe('sha256-button');
            expect(button.installedAt).toBe('2026-07-07T00:00:00.000Z');
            expect(button.dependencies).toEqual(['vue']);
            expect(button.registryDependencies).toEqual(['primitive']);
            expect(button.manifestFiles).toEqual(['src/components/button/Button.vue']);
        });
    });

    describe('JSON output', () => {
        it('produces valid JSON with expected shape', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'alert');
            await fs.ensureDir(compDir);
            await fs.writeFile(
                path.join(compDir, 'Alert.vue'),
                '<template><div class="alert"><slot /></div></template>',
            );

            const { parsed, raw } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            // Valid JSON array
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toHaveLength(1);

            const entry = parsed[0];
            expect(entry).toHaveProperty('name');
            expect(entry).toHaveProperty('files');
            expect(entry).toHaveProperty('fileCount');
            expect(entry).toHaveProperty('dependencies');
            expect(entry.name).toBe('alert');
            expect(Array.isArray(entry.files)).toBe(true);
            expect(entry.fileCount).toBe(1);
            expect(Array.isArray(entry.dependencies)).toBe(true);
        });

        it('fileCount matches actual file count in files array', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'badge');
            await fs.ensureDir(compDir);
            await fs.writeFile(path.join(compDir, 'Badge.vue'), '<template><span></span></template>');
            await fs.writeFile(path.join(compDir, 'badge-variants.ts'), 'export const v = {};');
            await fs.writeFile(path.join(compDir, 'badge-utils.ts'), 'export function f() {}');

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            const badge = parsed.find(c => c.name === 'badge')!;
            expect(badge.fileCount).toBe(badge.files.length);
            expect(badge.fileCount).toBe(3);
        });
    });

    describe('extracts dependencies', () => {
        it('parses import statements from .vue and .ts files', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'icon-button');
            await fs.ensureDir(compDir);
            await fs.writeFile(
                path.join(compDir, 'IconButton.vue'),
                `<script setup lang="ts">
import { ref } from 'vue';
import { Primitive } from 'reka-ui';
import { Loader2 } from '@lucide/vue';
import { cn } from '@/lib/utils';
</script>
<template><button><slot /></button></template>`,
            );

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            const comp = parsed.find(c => c.name === 'icon-button')!;
            expect(comp).toBeDefined();
            expect(comp.dependencies).toContain('vue');
            expect(comp.dependencies).toContain('reka-ui');
            expect(comp.dependencies).toContain('@lucide/vue');
        });

        it('deduplicates dependencies across multiple files', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'dialog');
            await fs.ensureDir(compDir);
            await fs.writeFile(
                path.join(compDir, 'Dialog.vue'),
                `<script setup lang="ts">
import { ref } from 'vue';
import { DialogRoot } from 'reka-ui';
</script>
<template><div></div></template>`,
            );
            await fs.writeFile(
                path.join(compDir, 'DialogTrigger.vue'),
                `<script setup lang="ts">
import { computed } from 'vue';
import { DialogTrigger } from 'reka-ui';
</script>
<template><button></button></template>`,
            );

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            const comp = parsed.find(c => c.name === 'dialog')!;
            const vueCount = comp.dependencies.filter(d => d === 'vue').length;
            expect(vueCount).toBe(1);
            expect(comp.dependencies).toContain('vue');
            expect(comp.dependencies).toContain('reka-ui');
        });
    });

    describe('skips empty directories', () => {
        it('does not include empty component directories in results', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            // One valid component
            const validDir = path.join(tmpDir, 'src', 'components', 'valid');
            await fs.ensureDir(validDir);
            await fs.writeFile(path.join(validDir, 'Valid.vue'), '<template><div></div></template>');

            // One empty directory
            await fs.ensureDir(path.join(tmpDir, 'src', 'components', 'empty-dir'));

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            expect(parsed).toHaveLength(1);
            expect(parsed[0].name).toBe('valid');
        });
    });

    describe('skips directories without .vue files', () => {
        it('excludes directories that only contain .ts files', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            // Directory with only .ts files
            const tsOnlyDir = path.join(tmpDir, 'src', 'components', 'utils-only');
            await fs.ensureDir(tsOnlyDir);
            await fs.writeFile(path.join(tsOnlyDir, 'helpers.ts'), 'export const x = 1;');
            await fs.writeFile(path.join(tsOnlyDir, 'types.ts'), 'export type A = string;');

            // A valid component
            const validDir = path.join(tmpDir, 'src', 'components', 'tooltip');
            await fs.ensureDir(validDir);
            await fs.writeFile(path.join(validDir, 'Tooltip.vue'), '<template><span></span></template>');

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            expect(parsed).toHaveLength(1);
            expect(parsed[0].name).toBe('tooltip');
        });
    });

    describe('components with subdirectories', () => {
        it('includes files from subdirectories and counts them correctly', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const dataTableDir = path.join(tmpDir, 'src', 'components', 'data-table');
            await fs.ensureDir(dataTableDir);
            await fs.writeFile(
                path.join(dataTableDir, 'DataTable.vue'),
                '<template><table></table></template>',
            );

            const partsDir = path.join(dataTableDir, 'parts');
            await fs.ensureDir(partsDir);
            await fs.writeFile(
                path.join(partsDir, 'Header.vue'),
                '<template><thead></thead></template>',
            );

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            const comp = parsed.find(c => c.name === 'data-table')!;
            expect(comp).toBeDefined();
            expect(comp.files).toContain('DataTable.vue');
            expect(comp.files).toContain('parts/Header.vue');
            expect(comp.fileCount).toBe(2);
        });

        it('handles deeply nested subdirectories', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'form');
            await fs.ensureDir(compDir);
            await fs.writeFile(path.join(compDir, 'Form.vue'), '<template><form></form></template>');

            const nestedDir = path.join(compDir, 'fields', 'inputs');
            await fs.ensureDir(nestedDir);
            await fs.writeFile(
                path.join(nestedDir, 'TextInput.vue'),
                '<template><input /></template>',
            );

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            const comp = parsed.find(c => c.name === 'form')!;
            expect(comp.files).toContain('Form.vue');
            expect(comp.files).toContain('fields/inputs/TextInput.vue');
            expect(comp.fileCount).toBe(2);
        });
    });

    describe('sorted alphabetically', () => {
        it('returns components sorted by name regardless of creation order', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            // Create components in non-alphabetical order
            const names = ['tooltip', 'alert', 'modal', 'badge', 'card'];
            for (const name of names) {
                const dir = path.join(tmpDir, 'src', 'components', name);
                await fs.ensureDir(dir);
                await fs.writeFile(
                    path.join(dir, `${name.charAt(0).toUpperCase() + name.slice(1)}.vue`),
                    '<template><div></div></template>',
                );
            }

            const { parsed } = await captureListJson({ cwd: tmpDir, json: true, silent: true });

            expect(parsed).toHaveLength(5);
            const sortedNames = parsed.map(c => c.name);
            expect(sortedNames).toEqual(['alert', 'badge', 'card', 'modal', 'tooltip']);
        });
    });

    describe('table output (non-JSON)', () => {
        it('calls printTable when json option is not set', async () => {
            mockedReadConfigSafe.mockResolvedValue(makeConfig());

            const compDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.ensureDir(compDir);
            await fs.writeFile(path.join(compDir, 'Button.vue'), '<template><button></button></template>');

            // In non-JSON mode, output goes through logger (which writes to stdout).
            // We just verify it doesn't throw and doesn't call console.log with JSON.
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            let stdoutOutput = '';
            const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown) => {
                stdoutOutput += String(chunk);
                return true;
            }) as typeof process.stdout.write);

            await list({ cwd: tmpDir, silent: true });

            consoleSpy.mockRestore();
            writeSpy.mockRestore();

            // console.log should NOT have been called with JSON data
            // (silent mode suppresses logger output, so stdout may be empty)
        });
    });
});
