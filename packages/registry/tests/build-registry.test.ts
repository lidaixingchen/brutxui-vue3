import { describe, expect, it } from 'vitest';
import {
    AVAILABLE_COMPONENTS,
    COMPONENT_FILES,
    COMPONENTS_BY_CATEGORY,
    COMPONENT_REGISTRY,
    computeRegistryIntegrity,
    getComponentsByCategory,
    validateRegistryItem,
} from 'brutx-shared-vue';
import { COMPONENT_FILES as REGISTRY_COMPONENT_FILES } from '../scripts/component-files';
import {
    assertRegistryDependencyGraph,
    buildRegistryManifest,
    extractDeps,
    extractModuleSpecifiers,
    extractRegistryDeps,
    extractUnknownRegistryDeps,
    getFileType,
    rewriteImports,
} from '../scripts/build-registry';

describe('build-registry helpers', () => {
    it('keeps the registry compatibility mapping pointed at shared metadata', () => {
        expect(REGISTRY_COMPONENT_FILES).toBe(COMPONENT_FILES);
        expect(AVAILABLE_COMPONENTS).toEqual(Object.keys(COMPONENT_REGISTRY));
        expect(COMPONENT_FILES.button.files).toContain('Button.vue');
        expect(COMPONENT_REGISTRY.button.files).toBe(COMPONENT_FILES.button.files);
        expect(COMPONENT_REGISTRY.button.dependencies).toEqual(['reka-ui', '@lucide/vue']);
        expect(COMPONENT_REGISTRY.button.category).toBe('action');
        expect(COMPONENT_REGISTRY.button.examples).toEqual([]);
        expect(COMPONENT_REGISTRY['settings-page'].category).toBe('page');
        expect(COMPONENTS_BY_CATEGORY.action).toContain('button');
        expect(getComponentsByCategory('page')).toContain('settings-page');
    });

    it('rewrites component imports to registry aliases', () => {
        const code = [
            "import Button from '../button/Button.vue'",
            "import { useLocale } from '../composables/useLocale'",
            "import { cn } from '../lib/utils'",
            "import LocalPart from './LocalPart.vue'",
        ].join('\n');

        expect(rewriteImports(code, 'dialog')).toContain("'@/components/ui/button/Button.vue'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/composables/useLocale'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/lib/utils'");
        expect(rewriteImports(code, 'dialog')).toContain("'@/components/ui/dialog/LocalPart.vue'");
    });

    it('rewrites same-directory imports for composables without routing them to components', () => {
        const code = "import { helper } from './helper'";

        expect(rewriteImports(code, 'button', 'composable')).toBe("import { helper } from '@/composables/helper'");
    });

    it('extracts library and registry dependencies from rewritten code', () => {
        const code = [
            "import { cn } from '@/lib/utils'",
            "import type { TableColumn } from '@/lib/data-table-types'",
            "export { useForwardProps } from '@/composables/useForwardProps'",
            "import { tableKey } from '@/lib/table-key.ts'",
            "import Button from '@/components/ui/button/Button.vue'",
            "import DataTable from '@/components/ui/data-table/DataTable.vue'",
            "const literal = '@/components/ui/dialog/DialogContent.vue'",
            "await import('@/components/ui/popover/PopoverContent.vue')",
        ].join('\n');

        expect(extractDeps(code, 'lib')).toEqual(['utils.ts', 'data-table-types.ts', 'table-key.ts']);
        expect(extractDeps(code, 'composables')).toEqual(['useForwardProps.ts']);
        expect(extractRegistryDeps(code, 'data-table')).toEqual(['button']);
        expect(extractUnknownRegistryDeps(code)).toEqual([]);
    });

    it('finds component imports that are not registered in shared metadata', () => {
        const code = [
            "import Button from '@/components/ui/button/Button.vue'",
            "import Missing from '@/components/ui/missing-widget/MissingWidget.vue'",
            "export { Ghost } from '@/components/ui/ghost/Ghost.vue'",
        ].join('\n');

        expect(extractRegistryDeps(code, 'card')).toEqual(['button']);
        expect(extractUnknownRegistryDeps(code)).toEqual(['missing-widget', 'ghost']);
    });

    it('extracts static import and export module specifiers without matching dynamic imports', () => {
        const code = [
            "import '@/components/ui/button/button.css'",
            "import type {",
            "    ButtonProps,",
            "} from '@/components/ui/button/types'",
            "export * from '@/lib/data-table-utils'",
            "export { cn } from '@/lib/utils'",
            "const lazy = import('@/components/ui/dialog/DialogContent.vue')",
        ].join('\n');

        expect(extractModuleSpecifiers(code)).toEqual([
            '@/components/ui/button/button.css',
            '@/components/ui/button/types',
            '@/lib/data-table-utils',
            '@/lib/utils',
        ]);
    });

    it('extracts module specifiers from Vue script blocks', () => {
        const code = [
            '<template><Button /></template>',
            '<script setup lang="ts">',
            "import Button from '@/components/ui/button/Button.vue'",
            "export { useLocale } from '@/composables/useLocale'",
            "const lazy = import('@/components/ui/dialog/DialogContent.vue')",
            '</script>',
        ].join('\n');

        expect(extractModuleSpecifiers(code)).toEqual([
            '@/components/ui/button/Button.vue',
            '@/composables/useLocale',
        ]);
    });

    it('classifies registry file types and computes stable integrity', () => {
        expect(getFileType('components/ui/button/Button.vue')).toBe('registry:ui');
        expect(getFileType('composables/useLocale.ts')).toBe('registry:hook');
        expect(getFileType('lib/data-table-utils.ts')).toBe('registry:lib');

        expect(computeRegistryIntegrity([
            { content: 'one' },
            { content: 'two' },
        ])).toBe('sha256-a0ef70c43442d404b1ed004b6649348633dda30e2ffac547c29a2b753abafa89');
    });

    it('validates registry metadata fields for docs consumption', () => {
        const item = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            category: 'action',
            examples: ['button-demo'],
            dependencies: [],
            registryDependencies: [],
            files: [
                {
                    path: 'components/ui/button/Button.vue',
                    content: '<template><button /></template>',
                    type: 'registry:ui',
                },
            ],
            tailwind: {},
            cssVars: {},
            integrity: 'sha256-button',
        };

        expect(() => validateRegistryItem(item)).not.toThrow();
        expect(() => validateRegistryItem({
            ...item,
            category: 'unknown',
        })).toThrow('"category" must be one of');
    });

    it('builds a deterministic registry manifest from an index', () => {
        const manifest = buildRegistryManifest({
            name: 'brutx-vue',
            homepage: 'https://example.test',
            items: [
                {
                    name: 'dialog',
                    type: 'registry:ui',
                    title: 'Dialog',
                    description: 'Dialog component',
                    category: 'overlay',
                    examples: ['dialog-demo', 'dialog-nested'],
                    dependencies: ['z', 'a'],
                    registryDependencies: ['button'],
                    files: [
                        { path: 'components/ui/dialog/Dialog.vue', type: 'registry:ui' },
                        { path: 'components/ui/dialog/DialogContent.vue', type: 'registry:ui' },
                    ],
                    tailwind: {},
                    cssVars: {},
                    integrity: 'sha256-dialog',
                },
                {
                    name: 'button',
                    type: 'registry:ui',
                    title: 'Button',
                    description: 'Button component',
                    category: 'action',
                    examples: [],
                    status: 'legacy',
                    replacement: 'button-next',
                    dependencies: [],
                    registryDependencies: [],
                    files: [
                        { path: 'components/ui/button/Button.vue', type: 'registry:ui' },
                    ],
                    tailwind: {},
                    cssVars: {},
                    integrity: 'sha256-button',
                },
            ],
        }, {
            registryVersion: '0.1.0',
            buildTimestamp: '2026-07-07T00:00:00.000Z',
            gitCommit: 'abc123',
        });

        expect(Object.keys(manifest.items)).toEqual(['button', 'dialog']);
        expect(manifest).toMatchObject({
            $schema: 'https://lidaixingchen.github.io/brutxui-vue3/registry-manifest.schema.json',
            name: 'brutx-vue',
            registryVersion: '0.1.0',
            buildTimestamp: '2026-07-07T00:00:00.000Z',
            gitCommit: 'abc123',
            itemCount: 2,
            items: {
                button: {
                    integrity: 'sha256-button',
                    fileCount: 1,
                    category: 'action',
                    examples: [],
                    status: 'legacy',
                    replacement: 'button-next',
                },
                dialog: {
                    integrity: 'sha256-dialog',
                    fileCount: 2,
                    dependencies: ['a', 'z'],
                    registryDependencies: ['button'],
                    category: 'overlay',
                    examples: ['dialog-demo', 'dialog-nested'],
                },
            },
        });
    });

    it('rejects registry dependency cycles before writing the build index', () => {
        expect(() => assertRegistryDependencyGraph([
            { name: 'button', registryDependencies: ['dialog'] },
            { name: 'dialog', registryDependencies: ['button'] },
        ])).toThrow('Registry dependency cycle detected: button -> dialog -> button');
    });
});
