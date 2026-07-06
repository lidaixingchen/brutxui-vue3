import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import * as registry from '../src/lib/registry.js';
import * as project from '../src/lib/project.js';
import { diff } from '../src/commands/diff.js';
import { logger } from '../src/lib/logger.js';
import type { BrutalistConfig, DiffResult, RegistryItem } from '../src/lib/types.js';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const original = await importOriginal<typeof registry>();
    return {
        ...original,
        readConfigSafe: vi.fn(),
        getItem: vi.fn(),
    };
});

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedGetItem = vi.mocked(registry.getItem);

function createConfig(overrides: Partial<BrutalistConfig> = {}): BrutalistConfig {
    return {
        style: 'brutalism',
        tailwind: { config: 'tailwind.config.js', css: 'src/index.css' },
        aliases: {
            components: '@/components',
            utils: '@/lib/utils',
            composables: '@/composables',
        },
        ...overrides,
    };
}

async function createTmpProject(): Promise<string> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'brutx-diff-'));
    await fs.writeJson(path.join(tmpDir, 'tsconfig.json'), {
        compilerOptions: {
            baseUrl: '.',
            paths: { '@/*': ['./src/*'] },
        },
    });
    return tmpDir;
}

async function writeLocalFile(
    tmpDir: string,
    component: string,
    fileName: string,
    content: string,
): Promise<void> {
    const dir = path.join(tmpDir, 'src', 'components', component);
    await fs.mkdirp(dir);
    await fs.writeFile(path.join(dir, fileName), content, 'utf-8');
}

async function runDiffJson(
    tmpDir: string,
    options: Record<string, unknown> = {},
): Promise<DiffResult[]> {
    const output: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
    });

    try {
        await diff({
            cwd: tmpDir,
            json: true,
            silent: true,
            ...options,
        } as Parameters<typeof diff>[0]);
    } finally {
        spy.mockRestore();
    }

    return JSON.parse(output.join('')) as DiffResult[];
}

describe('diff command', () => {
    let tmpDir: string;
    let savedEnv: string | undefined;

    beforeEach(async () => {
        tmpDir = await createTmpProject();
        savedEnv = process.env.BRUTX_NO_CACHE;
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

    describe('file matching with different path formats', () => {
        it('discovers installed components from manifest when component directory is missing', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await fs.ensureDir(path.join(tmpDir, '.brutx'));
            await fs.writeJson(path.join(tmpDir, '.brutx', 'manifest.json'), {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-button-old',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                        examples: [],
                    },
                },
            });

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>button</template>',
                }],
                integrity: 'sha256-button-new',
            });

            const results = await runDiffJson(tmpDir);

            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                component: 'button',
                installedIntegrity: 'sha256-button-old',
                latestIntegrity: 'sha256-button-new',
                integrityStatus: 'outdated',
            });
        });

        it('should match registry file with backslash path to local file', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>btn</template>');

            const registryItem: RegistryItem = {
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components\\ui\\button\\Button.vue',
                    content: '<template>old</template>',
                }],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results).toHaveLength(1);
            expect(results[0].files).toHaveLength(1);
            expect(results[0].files[0].status).toBe('modified');
        });

        it('should match registry file with forward slash path to local file', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>btn</template>');

            const registryItem: RegistryItem = {
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>old</template>',
                }],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results).toHaveLength(1);
            expect(results[0].files).toHaveLength(1);
            expect(results[0].files[0].status).toBe('modified');
        });

        it('should match simple file name without directory prefix', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>btn</template>');

            const registryItem: RegistryItem = {
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'Button.vue',
                    content: '<template>old</template>',
                }],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results).toHaveLength(1);
            expect(results[0].files).toHaveLength(1);
            expect(results[0].files[0].status).toBe('modified');
        });
    });

    describe('line ending normalization', () => {
        it('should treat CRLF and LF content as unchanged', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const lfContent = 'line1\nline2\nline3\n';
            const crlfContent = 'line1\r\nline2\r\nline3\r\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', crlfContent);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: lfContent }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files[0].status).toBe('unchanged');
        });

        it('should treat CR-only and LF content as unchanged', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const lfContent = 'line1\nline2\n';
            const crContent = 'line1\rline2\r';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', crContent);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: lfContent }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files[0].status).toBe('unchanged');
        });

        it('should treat mixed CRLF and LF as unchanged', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const lfContent = 'line1\nline2\nline3\n';
            const mixedContent = 'line1\r\nline2\nline3\r\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', mixedContent);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: lfContent }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files[0].status).toBe('unchanged');
        });

        it('should still detect actual content differences with mixed line endings', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const registryContent = 'line1\nline2\nline3\n';
            const localContent = 'line1\r\nmodified\r\nline3\r\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', localContent);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: registryContent }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('modified');
            expect(results[0].files[0].status).toBe('modified');
        });
    });

    describe('diff status determination', () => {
        it('should mark file as modified when content differs', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>local version</template>');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>registry version</template>',
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].component).toBe('button');
            expect(results[0].status).toBe('modified');
            expect(results[0].files[0].status).toBe('modified');
            expect(results[0].files[0].patch).toBeDefined();
        });

        it('should compare manifest integrity with latest registry integrity', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>button</template>');
            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-installed',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                },
            });

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>button</template>',
                }],
                integrity: 'sha256-latest',
            } as RegistryItem);

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].installedIntegrity).toBe('sha256-installed');
            expect(results[0].latestIntegrity).toBe('sha256-latest');
            expect(results[0].integrityStatus).toBe('outdated');
            expect(results[0].registrySource).toBe('https://example.test/registry');
            expect(results[0].installedAt).toBe('2026-07-07T00:00:00.000Z');
        });

        it('should include unified diff patch for modified files', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>local</template>\n');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>registry</template>\n',
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });
            const patch = results[0].files[0].patch;

            expect(patch).toBeDefined();
            expect(patch).toContain('--- registry/');
            expect(patch).toContain('+++ local/');
            expect(patch).toMatch(/^[+-]/m);
        });

        it('should mark file as unchanged when content is identical', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            const content = '<template>exact same content</template>\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', content);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files[0].status).toBe('unchanged');
            expect(results[0].files[0].patch).toBeUndefined();
        });

        it('should mark file as added when registry has it but local does not', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await fs.mkdirp(path.join(tmpDir, 'src', 'components', 'button'));

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>button</template>',
                }, {
                    path: 'components/ui/button/ButtonGroup.vue',
                    content: '<template>group</template>',
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].files).toHaveLength(2);
            expect(results[0].files[0].status).toBe('added');
            expect(results[0].files[1].status).toBe('added');
        });

        it('should mark file as removed when local has it but registry does not', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>button</template>');
            await writeLocalFile(tmpDir, 'button', 'ExtraFile.vue', '<template>extra</template>');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>button</template>',
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].files).toHaveLength(2);

            const buttonFile = results[0].files.find(f => f.path.includes('Button.vue'));
            const extraFile = results[0].files.find(f => f.path.includes('ExtraFile.vue'));

            expect(buttonFile?.status).toBe('unchanged');
            expect(extraFile?.status).toBe('removed');
        });

        it('should mark component as modified when it has a mix of file statuses', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>same</template>\n');
            await writeLocalFile(tmpDir, 'button', 'Helper.vue', '<template>local only</template>');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>same</template>\n',
                }, {
                    path: 'components/ui/button/NewFile.vue',
                    content: '<template>new in registry</template>',
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('modified');

            const buttonFile = results[0].files.find(f => f.path.includes('Button.vue'));
            const newFile = results[0].files.find(f => f.path.includes('NewFile.vue'));
            const helperFile = results[0].files.find(f => f.path.includes('Helper.vue'));

            expect(buttonFile?.status).toBe('unchanged');
            expect(newFile?.status).toBe('added');
            expect(helperFile?.status).toBe('removed');
        });
    });

    describe('integration', () => {
        it('should handle multiple components in a single diff', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const buttonContent = '<template>button</template>\n';
            const inputContent = '<template>input</template>\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', buttonContent);
            await writeLocalFile(tmpDir, 'input', 'Input.vue', inputContent);

            mockedGetItem.mockImplementation(async (name: string) => {
                if (name === 'button') {
                    return {
                        name: 'button',
                        type: 'registry:ui',
                        files: [{
                            path: 'components/ui/button/Button.vue',
                            content: buttonContent,
                        }],
                    };
                }
                if (name === 'input') {
                    return {
                        name: 'input',
                        type: 'registry:ui',
                        files: [{
                            path: 'components/ui/input/Input.vue',
                            content: '<template>different</template>\n',
                        }],
                    };
                }
                throw new Error(`Component "${name}" not found`);
            });

            const results = await runDiffJson(tmpDir, {
                components: ['button', 'input'],
            });

            expect(results).toHaveLength(2);

            const buttonResult = results.find(r => r.component === 'button')!;
            expect(buttonResult.status).toBe('up-to-date');

            const inputResult = results.find(r => r.component === 'input')!;
            expect(inputResult.status).toBe('modified');
        });

        it('should auto-discover installed components when none are specified', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', 'btn');
            await writeLocalFile(tmpDir, 'input', 'Input.vue', 'inp');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: 'btn' }],
            });

            const results = await runDiffJson(tmpDir);

            expect(results.length).toBeGreaterThanOrEqual(2);
            const names = results.map(r => r.component);
            expect(names).toContain('button');
            expect(names).toContain('input');
        });

        it('should handle component with subdirectories', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            await fs.mkdirp(path.join(tmpDir, 'src', 'components', 'data-table'));
            await fs.writeFile(
                path.join(tmpDir, 'src', 'components', 'data-table', 'DataTable.vue'),
                '<template>table</template>\n',
                'utf-8',
            );
            await fs.mkdirp(path.join(tmpDir, 'src', 'components', 'data-table', 'parts'));
            await fs.writeFile(
                path.join(tmpDir, 'src', 'components', 'data-table', 'parts', 'Header.vue'),
                '<template>header</template>\n',
                'utf-8',
            );

            mockedGetItem.mockResolvedValue({
                name: 'data-table',
                type: 'registry:ui',
                files: [
                    {
                        path: 'components/ui/data-table/DataTable.vue',
                        content: '<template>table</template>\n',
                    },
                    {
                        path: 'components/ui/data-table/parts/Header.vue',
                        content: '<template>header</template>\n',
                    },
                ],
            });

            const results = await runDiffJson(tmpDir, { components: ['data-table'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files).toHaveLength(2);
            expect(results[0].files.every(f => f.status === 'unchanged')).toBe(true);
        });

        it('should output valid JSON when json option is true', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', 'btn');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'components/ui/button/Button.vue', content: 'btn' }],
            });

            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await diff({
                    cwd: tmpDir,
                    components: ['button'],
                    json: true,
                    silent: true,
                });
            } finally {
                spy.mockRestore();
            }

            const raw = output.join('');
            expect(() => JSON.parse(raw)).not.toThrow();

            const parsed = JSON.parse(raw) as DiffResult[];
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0]).toHaveProperty('component');
            expect(parsed[0]).toHaveProperty('status');
            expect(parsed[0]).toHaveProperty('files');
        });

        it('should show update availability in non-JSON output when manifest integrity is outdated', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>button</template>');
            const manifestPath = path.join(tmpDir, '.brutx', 'manifest.json');
            await fs.ensureDir(path.dirname(manifestPath));
            await fs.writeJson(manifestPath, {
                version: 1,
                components: {
                    button: {
                        name: 'button',
                        registrySource: 'https://example.test/registry',
                        integrity: 'sha256-installed',
                        installedAt: '2026-07-07T00:00:00.000Z',
                        files: ['src/components/button/Button.vue'],
                        dependencies: [],
                        registryDependencies: [],
                    },
                },
            });

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: '<template>button</template>',
                }],
                integrity: 'sha256-latest',
            } as RegistryItem);

            logger.setSilent(false);
            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await diff({
                    cwd: tmpDir,
                    components: ['button'],
                    silent: false,
                });
            } finally {
                spy.mockRestore();
            }

            expect(output.join('\n')).toContain('update available');
        });

        it('should correctly apply resolveImportAlias to registry content before comparing', async () => {
            const config = createConfig({
                aliases: {
                    components: '~/components',
                    utils: '~/lib/utils',
                    composables: '~/composables',
                },
            });
            mockedReadConfigSafe.mockResolvedValue(config);

            const localContent = '<script>\nimport { cn } from "~/lib/utils";\n</script>\n<template>btn</template>\n';
            await writeLocalFile(tmpDir, 'button', 'Button.vue', localContent);

            const registryContent = '<script>\nimport { cn } from "@/lib/utils";\n</script>\n<template>btn</template>\n';

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{
                    path: 'components/ui/button/Button.vue',
                    content: registryContent,
                }],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results[0].status).toBe('up-to-date');
            expect(results[0].files[0].status).toBe('unchanged');
        });
    });

    describe('edge cases', () => {
        it('should handle empty component directory', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await fs.mkdirp(path.join(tmpDir, 'src', 'components'));

            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await diff({ cwd: tmpDir, json: true, silent: true });
            } finally {
                spy.mockRestore();
            }

            expect(output).toHaveLength(0);
        });

        it('should handle non-existent components directory', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());

            const aliasSpy = vi.spyOn(project, 'resolveAliasPath')
                .mockResolvedValue(path.join(tmpDir, 'src', 'components'));

            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await diff({ cwd: tmpDir, json: true, silent: true });
            } finally {
                spy.mockRestore();
                aliasSpy.mockRestore();
            }

            expect(output).toHaveLength(0);
        });

        it('should return not-installed when registry is unreachable', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>btn</template>');

            mockedGetItem.mockRejectedValue(new Error('Network error: registry unreachable'));

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results).toHaveLength(1);
            expect(results[0].component).toBe('button');
            expect(results[0].status).toBe('not-installed');
            expect(results[0].files).toHaveLength(0);
        });

        it('should handle component with no files in registry', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await writeLocalFile(tmpDir, 'button', 'Button.vue', '<template>btn</template>');

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [],
            });

            const results = await runDiffJson(tmpDir, { components: ['button'] });

            expect(results).toHaveLength(1);
            const removedFiles = results[0].files.filter(f => f.status === 'removed');
            expect(removedFiles.length).toBeGreaterThan(0);
        });

        it('should throw CliError when components.json is missing', async () => {
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(diff({
                cwd: tmpDir,
                silent: true,
            })).rejects.toThrow('No components.json found');
        });

        it('should handle all files being added (empty local component dir)', async () => {
            mockedReadConfigSafe.mockResolvedValue(createConfig());
            await fs.mkdirp(path.join(tmpDir, 'src', 'components', 'card'));

            mockedGetItem.mockResolvedValue({
                name: 'card',
                type: 'registry:ui',
                files: [
                    { path: 'components/ui/card/Card.vue', content: '<template>card</template>' },
                    { path: 'components/ui/card/CardHeader.vue', content: '<template>header</template>' },
                ],
            });

            const results = await runDiffJson(tmpDir, { components: ['card'] });

            expect(results[0].status).toBe('modified');
            expect(results[0].files).toHaveLength(2);
            expect(results[0].files.every(f => f.status === 'added')).toBe(true);
        });
    });
});
