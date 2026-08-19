import { describe, expect, it } from 'vitest';
import type { MergedRegistryEntry } from 'brutx-shared-vue';
import { MemoryFileSystemAdapter } from '../../src/fs/memory-fs.js';
import { DependencyResolver } from '../../src/compiler/dependency-resolver.js';
import type { CompilerPaths } from '../../src/compiler/types.js';

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

        const result = await resolver.resolveComponentClosure('button', meta);

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

    it('throws descriptive error if source file is missing', async () => {
        const fs = new MemoryFileSystemAdapter();
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

        await expect(resolver.resolveComponentClosure('missing', meta))
            .rejects.toThrow('Source file not found');
    });
});
