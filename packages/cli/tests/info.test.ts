import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

vi.mock('../src/lib/registry.js', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/lib/registry.js')>();
    return {
        ...original,
        readConfigSafe: vi.fn(),
        getItem: vi.fn(),
    };
});

vi.mock('../src/lib/project.js', async (importOriginal) => {
    const original = await importOriginal<typeof import('../src/lib/project.js')>();
    return { ...original, resolveAliasPath: vi.fn() };
});

import * as registry from '../src/lib/registry.js';
import * as project from '../src/lib/project.js';
import { info } from '../src/commands/info.js';
import type { BrutalistConfig, InfoOptions, RegistryItem } from '../src/lib/types.js';
import { DEFAULT_REGISTRY_URL } from '../src/lib/constants.js';

const mockedReadConfigSafe = vi.mocked(registry.readConfigSafe);
const mockedGetItem = vi.mocked(registry.getItem);
const mockedResolveAliasPath = vi.mocked(project.resolveAliasPath);

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

async function createTempDir(): Promise<string> {
    return fs.mkdtemp(path.join(os.tmpdir(), 'brutx-info-'));
}

async function runInfoJson(
    component: string,
    options: Partial<InfoOptions> & { cwd: string },
): Promise<Record<string, unknown>> {
    const output: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
        output.push(args.map(String).join(' '));
    });

    try {
        await info(component, { json: true, silent: true, ...options });
    } finally {
        spy.mockRestore();
    }

    return JSON.parse(output.join('')) as Record<string, unknown>;
}

describe('info command', () => {
    let tmpDir: string;

    beforeEach(() => {
        mockedResolveAliasPath.mockImplementation(async (alias: string, cwd: string) => {
            const match = alias.match(/^(@[^/]*|~)\/(.*)/);
            if (!match) return path.join(cwd, alias);
            const [, , relativePath] = match;
            return path.join(cwd, 'src', relativePath);
        });
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        if (tmpDir) {
            await fs.remove(tmpDir);
        }
    });

    describe('no config', () => {
        it('should throw CliError when readConfigSafe returns null', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(
                info('button', { cwd: tmpDir, silent: true }),
            ).rejects.toThrow('No components.json found');
        });

        it('should include "brutx-vue init" hint in the error message', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(null);

            await expect(
                info('button', { cwd: tmpDir, silent: true }),
            ).rejects.toThrow('Run `brutx-vue init` first.');
        });
    });

    describe('installed component with registry', () => {
        it('should report status as installed with registry item and local files', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const registryItem: RegistryItem = {
                name: 'button',
                type: 'registry:ui',
                files: [
                    { path: 'components/ui/button/Button.vue', content: '<template>btn</template>' },
                    { path: 'components/ui/button/button-variants.ts', content: 'export const variants = {}' },
                ],
                dependencies: ['reka-ui'],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const componentDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Button.vue'), '<template>btn</template>');
            await fs.writeFile(path.join(componentDir, 'button-variants.ts'), 'export const variants = {}');

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result.name).toBe('button');
            expect(result.status).toBe('installed');
            expect(result.registryItem).not.toBeNull();
            expect((result.registryItem as Record<string, unknown>).name).toBe('button');
            expect(result.localFiles).toHaveLength(2);
            expect(result.localFiles).toContain('Button.vue');
            expect(result.localFiles).toContain('button-variants.ts');
        });

        it('should call getItem with the component name and default registry URL', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const componentDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Button.vue'), '<template>btn</template>');

            await runInfoJson('button', { cwd: tmpDir });

            expect(mockedGetItem).toHaveBeenCalledWith('button', DEFAULT_REGISTRY_URL);
        });
    });

    describe('not-installed component', () => {
        it('should report status as not-installed when registry item exists but no local files', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const registryItem: RegistryItem = {
                name: 'button',
                type: 'registry:ui',
                files: [
                    { path: 'components/ui/button/Button.vue', content: '<template>btn</template>' },
                ],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result.name).toBe('button');
            expect(result.status).toBe('not-installed');
            expect(result.registryItem).not.toBeNull();
            expect(result.localFiles).toEqual([]);
        });

        it('should report not-installed when component directory does not exist', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'card',
                type: 'registry:ui',
                files: [{ path: 'Card.vue', content: '<template>card</template>' }],
            });

            await fs.ensureDir(path.join(tmpDir, 'src', 'components'));

            const result = await runInfoJson('card', { cwd: tmpDir });

            expect(result.status).toBe('not-installed');
            expect(result.localFiles).toEqual([]);
        });
    });

    describe('registry unreachable', () => {
        it('should report status as registry-unreachable when registry throws but local files exist', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            const componentDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Button.vue'), '<template>btn</template>');

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result.name).toBe('button');
            expect(result.status).toBe('registry-unreachable');
            expect(result.registryItem).toBeNull();
            expect(result.localFiles).toHaveLength(1);
            expect(result.localFiles).toContain('Button.vue');
        });

        it('should gracefully handle various registry error types', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('ETIMEDOUT'));

            const componentDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Button.vue'), '<template>btn</template>');

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result.status).toBe('registry-unreachable');
            expect(result.registryItem).toBeNull();
        });
    });

    describe('registry unreachable and no local files', () => {
        it('should report status as registry-unreachable when both registry and local files are unavailable', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            const result = await runInfoJson('nonexistent', { cwd: tmpDir });

            expect(result.name).toBe('nonexistent');
            expect(result.status).toBe('registry-unreachable');
            expect(result.registryItem).toBeNull();
            expect(result.localFiles).toEqual([]);
        });

        it('should report registry-unreachable when component directory is empty and registry fails', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            await fs.mkdirp(path.join(tmpDir, 'src', 'components', 'ghost'));

            const result = await runInfoJson('ghost', { cwd: tmpDir });

            expect(result.status).toBe('registry-unreachable');
            expect(result.localFiles).toEqual([]);
        });
    });

    describe('JSON output format', () => {
        it('should output valid JSON when json option is true', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const componentDir = path.join(tmpDir, 'src', 'components', 'button');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Button.vue'), '<template>btn</template>');

            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await info('button', { cwd: tmpDir, json: true, silent: true });
            } finally {
                spy.mockRestore();
            }

            const raw = output.join('');
            expect(() => JSON.parse(raw)).not.toThrow();
        });

        it('should contain all expected keys in JSON output', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('registryItem');
            expect(result).toHaveProperty('localFiles');
            expect(result).toHaveProperty('source');
            expect(result).toHaveProperty('status');
        });

        it('should include the registry source URL in JSON output', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(result.source).toBe(DEFAULT_REGISTRY_URL);
        });
    });

    describe('custom registry source', () => {
        it('should pass custom registry URL to getItem', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const customRegistry = 'https://custom-registry.example.com/registry';
            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            await runInfoJson('button', { cwd: tmpDir, registry: customRegistry });

            expect(mockedGetItem).toHaveBeenCalledWith('button', customRegistry);
        });

        it('should reflect custom registry source in JSON output', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const customRegistry = 'https://custom-registry.example.com/registry';
            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const result = await runInfoJson('button', { cwd: tmpDir, registry: customRegistry });

            expect(result.source).toBe(customRegistry);
        });

        it('should use default registry URL when no registry option is provided', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const result = await runInfoJson('button', { cwd: tmpDir });

            expect(mockedGetItem).toHaveBeenCalledWith('button', DEFAULT_REGISTRY_URL);
            expect(result.source).toBe(DEFAULT_REGISTRY_URL);
        });
    });

    describe('component with dependencies', () => {
        it('should include dependencies in registry item', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const registryItem: RegistryItem = {
                name: 'data-table',
                type: 'registry:ui',
                files: [
                    { path: 'components/ui/data-table/DataTable.vue', content: '<template>table</template>' },
                ],
                dependencies: ['reka-ui', '@lucide/vue'],
                registryDependencies: ['button', 'input'],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const result = await runInfoJson('data-table', { cwd: tmpDir });

            const regItem = result.registryItem as Record<string, unknown>;
            expect(regItem).not.toBeNull();
            expect(regItem.dependencies).toEqual(['reka-ui', '@lucide/vue']);
            expect(regItem.registryDependencies).toEqual(['button', 'input']);
        });

        it('should handle component with no dependencies', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const registryItem: RegistryItem = {
                name: 'badge',
                type: 'registry:ui',
                files: [
                    { path: 'Badge.vue', content: '<template>badge</template>' },
                ],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const result = await runInfoJson('badge', { cwd: tmpDir });

            const regItem = result.registryItem as Record<string, unknown>;
            expect(regItem.dependencies).toBeUndefined();
            expect(regItem.registryDependencies).toBeUndefined();
        });

        it('should handle component with empty dependency arrays', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            const registryItem: RegistryItem = {
                name: 'badge',
                type: 'registry:ui',
                files: [
                    { path: 'Badge.vue', content: '<template>badge</template>' },
                ],
                dependencies: [],
                registryDependencies: [],
            };
            mockedGetItem.mockResolvedValue(registryItem);

            const result = await runInfoJson('badge', { cwd: tmpDir });

            const regItem = result.registryItem as Record<string, unknown>;
            expect(regItem.dependencies).toEqual([]);
            expect(regItem.registryDependencies).toEqual([]);
        });
    });

    describe('local files with subdirectories', () => {
        it('should include nested file paths in localFiles', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'data-table',
                type: 'registry:ui',
                files: [
                    { path: 'components/ui/data-table/DataTable.vue', content: '<template>table</template>' },
                    { path: 'components/ui/data-table/parts/Header.vue', content: '<template>header</template>' },
                ],
            });

            const baseDir = path.join(tmpDir, 'src', 'components', 'data-table');
            await fs.mkdirp(baseDir);
            await fs.writeFile(path.join(baseDir, 'DataTable.vue'), '<template>table</template>');
            await fs.mkdirp(path.join(baseDir, 'parts'));
            await fs.writeFile(path.join(baseDir, 'parts', 'Header.vue'), '<template>header</template>');

            const result = await runInfoJson('data-table', { cwd: tmpDir });

            expect(result.status).toBe('installed');
            expect(result.localFiles).toHaveLength(2);
            expect(result.localFiles).toContain('DataTable.vue');
            expect(result.localFiles).toContain('parts/Header.vue');
        });

        it('should handle deeply nested subdirectories', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'complex',
                type: 'registry:ui',
                files: [
                    { path: 'Complex.vue', content: '<template>complex</template>' },
                ],
            });

            const baseDir = path.join(tmpDir, 'src', 'components', 'complex');
            await fs.mkdirp(baseDir);
            await fs.writeFile(path.join(baseDir, 'Complex.vue'), '<template>complex</template>');
            await fs.mkdirp(path.join(baseDir, 'parts', 'inner'));
            await fs.writeFile(path.join(baseDir, 'parts', 'inner', 'Deep.vue'), '<template>deep</template>');
            await fs.mkdirp(path.join(baseDir, 'utils'));
            await fs.writeFile(path.join(baseDir, 'utils', 'helpers.ts'), 'export const helper = () => {}');

            const result = await runInfoJson('complex', { cwd: tmpDir });

            expect(result.localFiles).toHaveLength(3);
            expect(result.localFiles).toContain('Complex.vue');
            expect(result.localFiles).toContain('parts/inner/Deep.vue');
            expect(result.localFiles).toContain('utils/helpers.ts');
        });

        it('should report registry-unreachable with subdirectory files even when registry is unreachable', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            const baseDir = path.join(tmpDir, 'src', 'components', 'data-table');
            await fs.mkdirp(baseDir);
            await fs.writeFile(path.join(baseDir, 'DataTable.vue'), '<template>table</template>');
            await fs.mkdirp(path.join(baseDir, 'parts'));
            await fs.writeFile(path.join(baseDir, 'parts', 'Header.vue'), '<template>header</template>');

            const result = await runInfoJson('data-table', { cwd: tmpDir });

            expect(result.status).toBe('registry-unreachable');
            expect(result.registryItem).toBeNull();
            expect(result.localFiles).toHaveLength(2);
            expect(result.localFiles).toContain('DataTable.vue');
            expect(result.localFiles).toContain('parts/Header.vue');
        });
    });

    describe('edge cases', () => {
        it('should use cwd from options instead of process.cwd()', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            await runInfoJson('button', { cwd: tmpDir });

            expect(mockedReadConfigSafe).toHaveBeenCalledWith(tmpDir);
        });

        it('should handle component with single file', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'badge',
                type: 'registry:ui',
                files: [{ path: 'Badge.vue', content: '<template>badge</template>' }],
            });

            const componentDir = path.join(tmpDir, 'src', 'components', 'badge');
            await fs.mkdirp(componentDir);
            await fs.writeFile(path.join(componentDir, 'Badge.vue'), '<template>badge</template>');

            const result = await runInfoJson('badge', { cwd: tmpDir });

            expect(result.status).toBe('installed');
            expect(result.localFiles).toHaveLength(1);
            expect(result.localFiles).toContain('Badge.vue');
        });

        it('should not produce JSON output when json option is false', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);

            mockedGetItem.mockResolvedValue({
                name: 'button',
                type: 'registry:ui',
                files: [{ path: 'Button.vue', content: '<template>btn</template>' }],
            });

            const output: string[] = [];
            const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
                output.push(args.map(String).join(' '));
            });

            try {
                await info('button', { cwd: tmpDir, json: false, silent: true });
            } finally {
                spy.mockRestore();
            }

            // With silent: true and json: false, the logger suppresses all output
            // and console.log (used only for JSON) is not called
            const raw = output.join('');
            expect(() => JSON.parse(raw)).toThrow();
        });

        it('should correctly resolve alias path using config aliases', async () => {
            tmpDir = await createTempDir();
            mockedReadConfigSafe.mockResolvedValue(defaultConfig);
            mockedGetItem.mockRejectedValue(new Error('Network error'));

            await runInfoJson('button', { cwd: tmpDir });

            expect(mockedResolveAliasPath).toHaveBeenCalledWith('@/components', tmpDir);
        });
    });
});
