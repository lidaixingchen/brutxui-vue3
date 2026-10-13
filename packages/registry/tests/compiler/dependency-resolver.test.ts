import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { MergedRegistryEntry } from 'brutx-shared-vue';
import type { ComponentExportProjection } from 'brutx-shared-vue/api-contract';
import { createModuleResolver } from 'brutx-shared-vue/module-resolver';
import { DiskFileSystemAdapter } from '../../src/fs/disk-fs.js';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { DependencyResolver } from '../../src/compiler/dependency-resolver.js';
import type { CompilerPaths } from '../../src/compiler/types.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe('DependencyResolver', () => {
    const paths: CompilerPaths = {
        componentsDir: '/src/components',
        composablesDir: '/src/composables',
        localesDir: '/src/locales',
        libDir: '/src/lib',
        directivesDir: '/src/directives',
        manifestPath: '/registry-manifest.json',
        outputDir: '/registry',
    };

    it('resolves component files, composables, lib, and generates index.ts barrel', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/src/components/button/Button.vue': [
                '<template><button><slot /></button></template>',
                '<script setup lang="ts">',
                'import { useLocale } from \'../../composables/useLocale\';',
                'import { cn } from \'../../lib/utils\';',
                '</script>',
            ].join('\n'),
            '/src/composables/useLocale.ts': 'export function useLocale() { return { t: (k: string) => k }; }',
            '/src/lib/utils.ts': 'export function cn(...inputs: any[]) { return inputs.join(" "); }',
        });

        const resolver = new DependencyResolver(fs, paths);
        const meta: MergedRegistryEntry = {
            name: 'button',
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action',
            kind: 'component',
            files: ['Button.vue'],
            composables: ['useLocale.ts'],
            directives: [],
            lib: ['utils.ts'],
            dependencies: [],
            examples: [],
        };

        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        };
        const result = await resolver.resolveComponentClosure('button', meta, undefined, projection);

        expect(result.files.map(f => f.path)).toEqual([
            'components/ui/button/Button.vue',
            'components/ui/button/index.ts',
            'composables/useLocale.ts',
        ]);

        const buttonFile = result.files.find(f => f.path === 'components/ui/button/Button.vue');
        expect(buttonFile?.content).toContain('\'@/composables/useLocale\'');
        expect(buttonFile?.content).toContain('\'@/lib/utils\'');

        const indexFile = result.files.find(f => f.path === 'components/ui/button/index.ts');
        expect(indexFile?.content).toContain('export { default as Button } from \'@/components/ui/button/Button.vue\'');
    });

    it('keeps TypeScript source paths resolved from JavaScript module specifiers in the closure', async () => {
        const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brutx-registry-module-closure-'));
        temporaryDirectories.push(rootDir);

        const sourceDir = path.join(rootDir, 'src');
        const componentsDir = path.join(sourceDir, 'components');
        const componentDir = path.join(componentsDir, 'button');
        const libDir = path.join(sourceDir, 'lib');
        fs.mkdirSync(componentDir, { recursive: true });
        fs.mkdirSync(libDir, { recursive: true });

        const componentPath = path.join(componentDir, 'Button.vue');
        const basePath = path.join(componentDir, 'base.vue');
        const helperPath = path.join(componentDir, 'helper.ts');
        const helperViewPath = path.join(componentDir, 'helper-view.tsx');
        const componentTypesPath = path.join(componentDir, 'types.ts');
        const utilityPath = path.join(libDir, 'utils.ts');
        fs.writeFileSync(componentPath, [
            '<script setup lang="ts">',
            'import Base from "./base.vue";',
            'import { helper } from "./helper.js";',
            'import { helperView } from "./helper-view.jsx";',
            'import type { ButtonVariant } from "./types.ts";',
            'void Base;',
            'void helper;',
            'void helperView;',
            'const variant: ButtonVariant = "default";',
            '</script>',
        ].join('\n'));
        fs.writeFileSync(basePath, '<template><span /></template>');
        fs.writeFileSync(helperPath, 'import { cn } from "../../lib/utils.js"; export const helper = cn("button");');
        fs.writeFileSync(helperViewPath, 'export const helperView = () => <div />;');
        fs.writeFileSync(componentTypesPath, 'export type ButtonVariant = "default";');
        fs.writeFileSync(utilityPath, 'export const cn = (...values: string[]) => values.join(" ");');

        const resolverPaths: CompilerPaths = {
            componentsDir,
            composablesDir: path.join(sourceDir, 'composables'),
            localesDir: path.join(sourceDir, 'locales'),
            libDir,
            directivesDir: path.join(sourceDir, 'directives'),
            typesDir: path.join(sourceDir, 'types'),
            manifestPath: path.join(rootDir, 'registry-manifest.json'),
            outputDir: path.join(rootDir, 'registry'),
        };
        const moduleResolver = createModuleResolver({
            rootDir: sourceDir,
            viteAliases: [{ find: '@', replacement: sourceDir }],
        });
        const sourceResolution = moduleResolver.resolve(componentPath, './helper.js');
        expect(sourceResolution).toMatchObject({ kind: 'internal', resolvedPath: helperPath });

        const resolver = new DependencyResolver(
            new DiskFileSystemAdapter(),
            resolverPaths,
            new Set(),
            undefined,
            moduleResolver,
        );
        const meta: MergedRegistryEntry = {
            name: 'button',
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action',
            kind: 'component',
            files: ['Button.vue'],
            composables: [],
            directives: [],
            lib: [],
            dependencies: [],
            examples: [],
        };
        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Button.vue', sourceName: 'default', publicName: 'Button', kind: 'value' },
            ],
        };

        const result = await resolver.resolveComponentClosure('button', meta, undefined, projection);
        const files = new Map(result.files.map(file => [file.path, file.content]));

        const component = files.get('components/ui/button/Button.vue');
        expect(component).toContain('@/components/ui/button/base.vue');
        expect(component).toContain('@/components/ui/button/helper.js');
        expect(component).toContain('@/components/ui/button/helper-view.jsx');
        expect(component).toContain('@/components/ui/button/types.ts');
        expect(files.get('components/ui/button/base.vue')).toContain('<span />');
        expect(files.get('components/ui/button/helper.ts')).toContain('@/lib/utils.js');
        expect(files.get('components/ui/button/helper-view.tsx')).toContain('helperView');
        expect(files.get('components/ui/button/types.ts')).toContain('ButtonVariant');
        expect([...files.keys()]).toContain('lib/utils.ts');
        expect(files.get('lib/utils.ts')).toContain('export const cn');
        expect(files.has('components/ui/button/helper.js.ts')).toBe(false);
        expect(files.has('components/ui/button/helper-view.jsx.ts')).toBe(false);
        expect(files.has('lib/utils.js.ts')).toBe(false);
    });

    it('throws descriptive error if source file is missing', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/src/components/missing/Existing.vue': '<template><span /></template>',
        });
        const resolver = new DependencyResolver(fs, paths);
        const meta: MergedRegistryEntry = {
            name: 'missing',
            title: 'Missing',
            titleZh: '缺失',
            description: 'Missing component',
            category: 'action',
            kind: 'component',
            files: ['Missing.vue'],
            composables: [],
            directives: [],
            lib: [],
            dependencies: [],
            examples: [],
        };

        const projection: ComponentExportProjection = {
            componentId: 'missing',
            exports: [
                { source: './Existing.vue', sourceName: 'default', publicName: 'Existing', kind: 'value' },
            ],
        };
        await expect(resolver.resolveComponentClosure('missing', meta, undefined, projection))
            .rejects.toThrow('Source file not found');
    });

    it('requires a public projection before producing a component index', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/src/components/button/Button.vue': '<template><button /></template>',
        });
        const resolver = new DependencyResolver(fs, paths);
        const meta: MergedRegistryEntry = {
            name: 'button',
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action',
            kind: 'component',
            files: ['Button.vue'],
            composables: [],
            directives: [],
            lib: [],
            dependencies: [],
            examples: [],
        };

        await expect(resolver.resolveComponentClosure('button', meta))
            .rejects.toThrow('Public component projection is required');
    });

    it('rejects a projection that points to a missing source file', async () => {
        const fs = new MemoryFileSystemAdapter({
            '/src/components/button/Button.vue': '<template><button /></template>',
        });
        const resolver = new DependencyResolver(fs, paths);
        const meta: MergedRegistryEntry = {
            name: 'button',
            title: 'Button',
            titleZh: '按钮',
            description: 'Button component',
            category: 'action',
            kind: 'component',
            files: ['Button.vue'],
            composables: [],
            directives: [],
            lib: [],
            dependencies: [],
            examples: [],
        };
        const projection: ComponentExportProjection = {
            componentId: 'button',
            exports: [
                { source: './Missing.vue', sourceName: 'default', publicName: 'Missing', kind: 'value' },
            ],
        };

        await expect(resolver.resolveComponentClosure('button', meta, undefined, projection))
            .rejects.toThrow('Public projection source not found');
    });
});
