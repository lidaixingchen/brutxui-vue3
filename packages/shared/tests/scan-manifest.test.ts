import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_LIB_EXCLUDE,
    DEFAULT_MANIFEST_OVERRIDES,
    applyManifestOverrides,
} from '../src/scan-manifest.js';
import { scanComponentFiles } from '../src/scan-component-files.js';
import type { ComponentFileManifest } from '../src/registry-manifest.types.js';

describe('scan-manifest & scanComponentFiles 覆盖规则与排除清单', () => {
    describe('DEFAULT_LIB_EXCLUDE 与 DEFAULT_MANIFEST_OVERRIDES 常量', () => {
        it('DEFAULT_LIB_EXCLUDE 包含 utils.ts', () => {
            expect(DEFAULT_LIB_EXCLUDE.has('utils.ts')).toBe(true);
            expect(DEFAULT_LIB_EXCLUDE.size).toBe(1);
        });

        it('DEFAULT_MANIFEST_OVERRIDES 包含 loading 指令约定覆盖', () => {
            expect(DEFAULT_MANIFEST_OVERRIDES.loading).toBeDefined();
            expect(DEFAULT_MANIFEST_OVERRIDES.loading?.directives).toEqual(['loading.ts']);
        });
    });

    describe('applyManifestOverrides', () => {
        it('正确合并 directives 并按字典序排序', () => {
            const manifest: Record<string, ComponentFileManifest> = {
                loading: {
                    files: ['Loading.vue'],
                    composables: [],
                    directives: ['other.ts'],
                    lib: [],
                },
            };

            applyManifestOverrides(manifest);

            expect(manifest.loading.directives).toEqual(['loading.ts', 'other.ts']);
        });

        it('对已有相同 directive 进行去重', () => {
            const manifest: Record<string, ComponentFileManifest> = {
                loading: {
                    files: ['Loading.vue'],
                    composables: [],
                    directives: ['loading.ts'],
                    lib: [],
                },
            };

            applyManifestOverrides(manifest);

            expect(manifest.loading.directives).toEqual(['loading.ts']);
        });

        it('当组件不存在于 manifest 中时安全跳过', () => {
            const manifest: Record<string, ComponentFileManifest> = {
                button: {
                    files: ['Button.vue'],
                    composables: [],
                    directives: [],
                    lib: [],
                },
            };

            applyManifestOverrides(manifest);

            expect(manifest.button.directives).toEqual([]);
            expect(manifest.loading).toBeUndefined();
        });

        it('支持自定义 overrides 清单', () => {
            const manifest: Record<string, ComponentFileManifest> = {
                button: {
                    files: ['Button.vue'],
                    composables: [],
                    directives: [],
                    lib: [],
                },
            };

            applyManifestOverrides(manifest, {
                button: {
                    directives: ['ripple.ts'],
                },
            });

            expect(manifest.button.directives).toEqual(['ripple.ts']);
        });
    });

    describe('scanComponentFiles 内置覆盖与排除规则', () => {
        let tempDir: string;
        let componentsDir: string;
        let composablesDir: string;
        let libDir: string;
        let directivesDir: string;

        beforeEach(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-scan-test-'));
            componentsDir = path.join(tempDir, 'components');
            composablesDir = path.join(tempDir, 'composables');
            libDir = path.join(tempDir, 'lib');
            directivesDir = path.join(tempDir, 'directives');

            fs.mkdirSync(componentsDir, { recursive: true });
            fs.mkdirSync(composablesDir, { recursive: true });
            fs.mkdirSync(libDir, { recursive: true });
            fs.mkdirSync(directivesDir, { recursive: true });

            // 准备 lib 文件：utils.ts 与 helpers.ts
            fs.writeFileSync(path.join(libDir, 'utils.ts'), 'export const cn = () => {};');
            fs.writeFileSync(path.join(libDir, 'helpers.ts'), 'export const help = () => {};');

            // 准备 loading 组件目录和文件
            const loadingCompDir = path.join(componentsDir, 'loading');
            fs.mkdirSync(loadingCompDir, { recursive: true });
            fs.writeFileSync(
                path.join(loadingCompDir, 'Loading.vue'),
                `<script setup lang="ts">\nimport { cn } from '@/lib/utils';\nimport { help } from '@/lib/helpers';\n</script>`
            );
        });

        afterEach(() => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('默认自动排除 utils.ts 并内置 DEFAULT_MANIFEST_OVERRIDES 覆盖', () => {
            const manifest = scanComponentFiles({
                componentsDir,
                composablesDir,
                libDir,
                directivesDir,
            });

            expect(manifest.loading).toBeDefined();
            // utils.ts 被默认排除，helpers.ts 正常保留
            expect(manifest.loading.lib).toEqual(['helpers.ts']);
            // 内置 loading.ts 覆盖
            expect(manifest.loading.directives).toEqual(['loading.ts']);
        });

        it('manifestOverrides 为 false 时禁用覆盖，仅返回纯 AST 扫描结果', () => {
            const manifest = scanComponentFiles({
                componentsDir,
                composablesDir,
                libDir,
                directivesDir,
                manifestOverrides: false,
            });

            expect(manifest.loading).toBeDefined();
            expect(manifest.loading.directives).toEqual([]);
        });

        it('支持自定义 manifestOverrides', () => {
            const manifest = scanComponentFiles({
                componentsDir,
                composablesDir,
                libDir,
                directivesDir,
                manifestOverrides: {
                    loading: {
                        directives: ['custom-loading.ts'],
                    },
                },
            });

            expect(manifest.loading).toBeDefined();
            expect(manifest.loading.directives).toEqual(['custom-loading.ts']);
        });

        it('支持自定义 libExclude 覆盖默认排除清单', () => {
            const manifest = scanComponentFiles({
                componentsDir,
                composablesDir,
                libDir,
                directivesDir,
                libExclude: new Set(['helpers.ts']),
            });

            expect(manifest.loading).toBeDefined();
            // helpers.ts 被排除，utils.ts 保留
            expect(manifest.loading.lib).toEqual(['utils.ts']);
        });
    });
});
