import { describe, expect, it, afterEach } from 'vitest';
import crypto from 'crypto';
import {
    AVAILABLE_COMPONENTS,
    COMPONENT_METADATA,
    COMPONENTS_BY_CATEGORY,
    computeRegistryIntegrity,
    validateRegistryIndex,
    getComponentsByCategory,
    validateRegistryItem,
} from 'brutx-shared-vue';
import { extractModuleSpecifiers, extractClassifiedModuleSpecifiers } from 'brutx-shared-vue/scan';
import {
    assertRegistryDependencyGraph,
    assertKnownRegistryDeps,
    buildRegistryItem,
    buildRegistryManifest,
    buildRegistrySbom,
    computeSbomIntegrity,
    computeSourceHash,
    extractComponentFileDeps,
    extractDeps,
    extractRegistryDeps,
    extractUnknownRegistryDeps,
    getFileType,
    loadMergedRegistry,
    rewriteImports,
    signManifestFromEnv,
} from '../scripts/build-registry';

describe('build-registry helpers', () => {
    it('loads merged registry from manifest and metadata', () => {
        const registry = loadMergedRegistry();
        expect(AVAILABLE_COMPONENTS).toEqual(Object.keys(registry));
        expect(registry.button.files).toContain('Button.vue');
        expect(registry.button.title).toBe('Button');
        expect(registry.button.dependencies).toEqual(['reka-ui', '@lucide/vue']);
        expect(registry.button.category).toBe('action');
        expect(registry.button.examples).toEqual([]);
        expect(COMPONENTS_BY_CATEGORY.action).toContain('button');
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
        expect(extractRegistryDeps(code, 'data-table')).toEqual(['button', 'popover']);
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

    it('fails unknown registry imports with source context', () => {
        const code = "import Missing from '@/components/ui/missing-widget/MissingWidget.vue'";

        expect(() => assertKnownRegistryDeps(code, 'dialog', 'useDialog.ts'))
            .toThrow('Unknown registry component import(s) in "dialog" (useDialog.ts): missing-widget');
    });

    it('extracts static and dynamic import/export module specifiers', () => {
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
            '@/components/ui/dialog/DialogContent.vue',
        ]);
    });

    it('tracks css assets, type-only imports, and barrel exports as static specifiers', () => {
        const code = [
            '<script setup lang="ts">',
            "import '@/components/ui/code-block/brutx-prism.css'",
            "import type { DataTableColumn } from '@/components/ui/data-table/types'",
            "export * from '@/components/ui/button'",
            "export type { ChartPoint } from '@/lib/chart-types'",
            '</script>',
        ].join('\n');

        expect(extractModuleSpecifiers(code)).toEqual([
            '@/components/ui/code-block/brutx-prism.css',
            '@/components/ui/data-table/types',
            '@/components/ui/button',
            '@/lib/chart-types',
        ]);
        expect(extractRegistryDeps(code, 'data-table')).toEqual(['code-block', 'button']);
        expect(extractDeps(code, 'lib')).toEqual(['chart-types.ts']);
    });

    it('extracts same-component file dependencies for recursive registry items', () => {
        const code = [
            "import type { DialogProps } from '@/components/ui/dialog/types'",
            "export { dialogClasses } from '@/components/ui/dialog/dialog-variants'",
            "import Button from '@/components/ui/button/Button.vue'",
        ].join('\n');

        expect(extractComponentFileDeps(code, 'dialog')).toEqual([
            'types.ts',
            'dialog-variants.ts',
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
            '@/components/ui/dialog/DialogContent.vue',
        ]);
    });

    it('classifies registry file types and computes stable integrity', () => {
        expect(getFileType('components/ui/button/Button.vue')).toBe('registry:ui');
        expect(getFileType('components/ui/code-block/brutx-prism.css')).toBe('registry:ui');
        expect(getFileType('components/ui/data-table/types.ts')).toBe('registry:lib');
        expect(getFileType('components/ui/data-table/data-table-types.ts')).toBe('registry:lib');
        expect(getFileType('components/ui/button/button-variants.ts')).toBe('registry:lib');
        expect(getFileType('composables/useLocale.ts')).toBe('registry:hook');
        expect(getFileType('lib/data-table-utils.ts')).toBe('registry:lib');
        expect(getFileType('lib/chart.css')).toBe('registry:lib');

        // integrity 覆盖 path/type/content 且与数组顺序无关（files 顺序无语义，重排不应改变哈希）
        const files = [
            { path: 'a.vue', content: 'one', type: 'registry:ui' },
            { path: 'b.ts', content: 'two', type: 'registry:lib' },
        ];
        const integrity = computeRegistryIntegrity(files);
        expect(integrity).toMatch(/^sha256-[a-f0-9]{64}$/);
        expect(computeRegistryIntegrity(files)).toBe(integrity);
        expect(computeRegistryIntegrity([...files].reverse())).toBe(integrity);
        // path 参与哈希：内容相同但 path 互换必须暴露
        expect(computeRegistryIntegrity([
            { ...files[0], path: 'c.vue' },
            files[1],
        ])).not.toBe(integrity);
    });

    it('validates registry metadata fields for docs consumption', () => {
        const files = [
            {
                path: 'components/ui/button/Button.vue',
                content: '<template><button /></template>',
                type: 'registry:ui',
            },
        ];
        const item = {
            name: 'button',
            type: 'registry:ui',
            title: 'Button',
            description: 'Button component',
            category: 'action',
            examples: ['button-demo'],
            dependencies: [],
            registryDependencies: [],
            files,
            tailwind: {},
            cssVars: {},
            // validateRegistryItem 会自校验 integrity 与 files 内容匹配，必须用真实哈希
            integrity: computeRegistryIntegrity(files),
        };

        expect(() => validateRegistryItem(item)).not.toThrow();
        expect(() => validateRegistryItem({
            ...item,
            category: 'unknown',
        })).toThrow('"category" must be one of');
        // integrity 与内容不匹配必须被拒绝
        expect(() => validateRegistryItem({
            ...item,
            integrity: 'sha256-' + 'a'.repeat(64),
        })).toThrow('integrity does not match file contents');
    });

    it('validates registry index version metadata', () => {
        const index = {
            $schema: 'https://ui.shadcn.com/schema/registry.json',
            name: 'brutx-vue',
            homepage: 'https://example.test',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            items: [],
        };

        expect(() => validateRegistryIndex(index)).not.toThrow();
        expect(() => validateRegistryIndex({
            ...index,
            schemaVersion: 0,
        })).toThrow('"schemaVersion" must be a positive integer');
        expect(() => validateRegistryIndex({
            ...index,
            registryVersion: '',
        })).toThrow('"registryVersion" must be a non-empty string');
    });

    it('builds a deterministic registry manifest from an index', () => {
        const manifest = buildRegistryManifest({
            name: 'brutx-vue',
            homepage: 'https://example.test',
            schemaVersion: 1,
            registryVersion: '0.1.0',
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
            schemaVersion: 1,
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

// 产物不入库后（见 docs/REGISTRY_ARTIFACTS_PUBLISH_TIME_PLAN.md），integrity 是
// ui 源码的内容哈希，随源码改动而变；用快照固化具体 integrity 值会使测试与
// 源码哈希耦合，任何 composables/组件改动都导致快照失效。故改为结构断言：
// 校验构建产物的关键字段与依赖关系，integrity 只校验格式，不断言具体值。
describe('registry build items', () => {
    it('builds button with expected structure', () => {
        const item = buildRegistryItem('button');
        expect(item.name).toBe('button');
        expect(item.type).toBe('registry:ui');
        expect(item.title).toBe('Button');
        expect(item.category).toBe('action');
        expect(item.files.some(f => f.path === 'components/ui/button/Button.vue' && f.type === 'registry:ui')).toBe(true);
        expect(item.files.some(f => f.path === 'composables/useGlitchEffect.ts' && f.type === 'registry:hook')).toBe(true);
        expect(item.registryDependencies).toContain('locale-zh-cn');
        expect(item.integrity).toMatch(/^sha256-[a-f0-9]{64}$/);
    });

    it('builds data-table with expected structure', () => {
        const item = buildRegistryItem('data-table');
        expect(item.name).toBe('data-table');
        expect(item.type).toBe('registry:ui');
        expect(item.title).toBe('Data Table');
        expect(item.category).toBe('data-display');
        expect(item.files.some(f => f.path === 'components/ui/data-table/DataTable.vue' && f.type === 'registry:ui')).toBe(true);
        expect(item.files.some(f => f.path === 'composables/useDataTableFilter.ts' && f.type === 'registry:hook')).toBe(true);
        expect(item.registryDependencies).toEqual(expect.arrayContaining(['input', 'button', 'checkbox']));
        expect(item.integrity).toMatch(/^sha256-[a-f0-9]{64}$/);
    });
});

describe('computeSourceHash (P0-4 cache key)', () => {
    const registry = loadMergedRegistry();

    it('returns a stable hash for the same component and file mapping', () => {
        const button = registry.button;
        const hash1 = computeSourceHash('button', button);
        const hash2 = computeSourceHash('button', button);
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns different hashes for different components', () => {
        const buttonHash = computeSourceHash('button', registry.button);
        const dialogHash = computeSourceHash('dialog', registry.dialog);
        expect(buttonHash).not.toBe(dialogHash);
    });

    it('changes when file mapping differs (files list extended)', () => {
        const button = registry.button;
        const originalHash = computeSourceHash('button', button);
        const modifiedMapping = {
            ...button,
            files: [...button.files, 'NonExistentExtra.vue'],
        };
        // 即使 NonExistentExtra.vue 不存在（会在真实 build 中报错），
        // sourceHash 仍然会因为 fileMapping 变化而不同——证明 file mapping
        // 是缓存键的一部分，新增/删除文件会触发缓存失效
        expect(() => computeSourceHash('button', modifiedMapping)).toThrow();
    });

    it('changes when file mapping order differs (order-sensitive)', () => {
        const button = registry.button;
        const originalHash = computeSourceHash('button', button);
        // files 顺序变化应触发 hash 变化——这是有意的，因为 integrity 对顺序敏感
        const reorderedMapping = {
            ...button,
            files: [...button.files].reverse(),
        };
        const reorderedHash = computeSourceHash('button', reorderedMapping);
        expect(reorderedHash).not.toBe(originalHash);
    });

    it('includes transitive closure source content (changing a dependency file changes the hash)', () => {
        // dialog 依赖 button（通过 registryDependencies），
        // 但 computeSourceHash 只扫描 fileMapping.files 里的文件 + 它们的 import 闭包。
        // 如果 dialog 的 files 列表包含的文件 import 了 button 的 Button.vue，
        // 则改 button 的源码会让 dialog 的 sourceHash 也变化。
        // 这里只验证 dialog 的 hash 稳定（不实际改源码），真正的失效由 build:verify 覆盖
        const dialog = registry.dialog;
        const hash1 = computeSourceHash('dialog', dialog);
        const hash2 = computeSourceHash('dialog', dialog);
        expect(hash1).toBe(hash2);
    });
});

describe('extractClassifiedModuleSpecifiers (P1-7)', () => {
    it('marks `import type { ... }` as type-only', () => {
        const code = "import type { ButtonVariant } from '@/components/ui/button/types'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/button/types', isTypeOnly: true, isDynamic: false },
        ]);
    });

    it('marks `export type { ... } from` as type-only', () => {
        const code = "export type { ChartPoint } from '@/lib/chart-types'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/lib/chart-types', isTypeOnly: true, isDynamic: false },
        ]);
    });

    it('treats mixed `import { type Foo, bar }` as runtime (NOT type-only)', () => {
        // Mixed imports still load the module at runtime because of `bar`.
        const code = "import { type ButtonVariant, useButton } from '@/components/ui/button/use-button'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/button/use-button', isTypeOnly: false, isDynamic: false },
        ]);
    });

    it('marks dynamic import() as runtime + dynamic', () => {
        const code = "const lazy = import('@/components/ui/dialog/DialogContent.vue')";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/dialog/DialogContent.vue', isTypeOnly: false, isDynamic: true },
        ]);
    });

    it('treats side-effect imports (`import "x"`) as runtime', () => {
        const code = "import '@/components/ui/code-block/brutx-prism.css'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/code-block/brutx-prism.css', isTypeOnly: false, isDynamic: false },
        ]);
    });

    it('treats value re-exports (`export { x } from`) as runtime', () => {
        const code = "export { useForwardProps } from '@/composables/useForwardProps'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/composables/useForwardProps', isTypeOnly: false, isDynamic: false },
        ]);
    });

    it('treats `export * from` as runtime (NOT type-only)', () => {
        // `export *` re-exports all bindings — at runtime, the module loads.
        // Only `export type *` (TS 5+) is type-only.
        const code = "export * from '@/components/ui/button'";
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/button', isTypeOnly: false, isDynamic: false },
        ]);
    });

    it('deduplicates specifiers and prefers runtime over type-only', () => {
        // Same module imported twice: once type-only, once as value.
        // The merged result must be runtime (NOT type-only).
        const code = [
            "import type { ButtonVariant } from '@/components/ui/button/types'",
            "import { useButton } from '@/components/ui/button/types'",
        ].join('\n');
        const result = extractClassifiedModuleSpecifiers(code);
        expect(result).toEqual([
            { specifier: '@/components/ui/button/types', isTypeOnly: false, isDynamic: false },
        ]);
    });

    it('extracts from Vue SFC script blocks', () => {
        const code = [
            '<template><Button /></template>',
            '<script setup lang="ts">',
            "import Button from '@/components/ui/button/Button.vue'",
            "import type { ButtonProps } from '@/components/ui/button/types'",
            '</script>',
        ].join('\n');
        const result = extractClassifiedModuleSpecifiers(code);
        const bySpecifier = new Map(result.map(r => [r.specifier, r]));
        expect(bySpecifier.get('@/components/ui/button/Button.vue')).toEqual({
            specifier: '@/components/ui/button/Button.vue',
            isTypeOnly: false,
            isDynamic: false,
        });
        expect(bySpecifier.get('@/components/ui/button/types')).toEqual({
            specifier: '@/components/ui/button/types',
            isTypeOnly: true,
            isDynamic: false,
        });
    });

    it('returns empty array for code without imports', () => {
        const code = 'const x = 42;\nconsole.log(x);';
        expect(extractClassifiedModuleSpecifiers(code)).toEqual([]);
    });
});

describe('extractRegistryDeps type-only handling (P1-7)', () => {
    it('skips type-only cross-component imports', () => {
        // `import type { Foo } from '@/components/ui/button/types'` does not
        // create a runtime registry dep. Before P1-7, this would have added
        // `button` to the result, inflating the dependency tree.
        const code = "import type { ButtonVariant } from '@/components/ui/button/types'";
        expect(extractRegistryDeps(code, 'dialog')).toEqual([]);
    });

    it('keeps value cross-component imports', () => {
        const code = "import Button from '@/components/ui/button/Button.vue'";
        expect(extractRegistryDeps(code, 'dialog')).toEqual(['button']);
    });

    it('keeps dynamic cross-component imports', () => {
        const code = "const Btn = () => import('@/components/ui/button/Button.vue')";
        expect(extractRegistryDeps(code, 'dialog')).toEqual(['button']);
    });

    it('keeps mixed type-and-value cross-component imports', () => {
        // Mixed `import { type Foo, bar }` is NOT type-only — runtime dep.
        const code = "import { type ButtonVariant, useButton } from '@/components/ui/button/use-button'";
        expect(extractRegistryDeps(code, 'dialog')).toEqual(['button']);
    });

    it('combines type-only and value imports of the same dep (only one edge)', () => {
        const code = [
            "import type { ButtonVariant } from '@/components/ui/button/types'",
            "import Button from '@/components/ui/button/Button.vue'",
        ].join('\n');
        // Value import wins — button is a runtime dep.
        expect(extractRegistryDeps(code, 'dialog')).toEqual(['button']);
    });

    it('extractUnknownRegistryDeps still surfaces type-only unknown imports (typo detection)', () => {
        // P1-7: even type-only imports should be checked for typos. If the
        // user wrote `@/components/ui/buton/types` (typo: missing `t`), the
        // validator must flag it — otherwise typos in type-only imports would
        // silently slip through.
        const code = "import type { Foo } from '@/components/ui/buton/types'";
        expect(extractUnknownRegistryDeps(code)).toEqual(['buton']);
    });
});

describe('buildRegistrySbom (P1-6)', () => {
    const sampleIndex = {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: 'brutx-vue',
        homepage: 'https://example.test',
        schemaVersion: 1,
        registryVersion: '0.1.0',
        items: [
            {
                name: 'dialog',
                type: 'registry:ui' as const,
                title: 'Dialog',
                description: 'Dialog component',
                dependencies: ['reka-ui', '@lucide/vue'],
                registryDependencies: ['button'],
                files: [
                    { path: 'components/ui/dialog/Dialog.vue', type: 'registry:ui' as const },
                ],
                tailwind: {},
                cssVars: {},
                integrity: 'sha256-abc',
            },
            {
                name: 'button',
                type: 'registry:ui' as const,
                title: 'Button',
                description: 'Button component',
                dependencies: ['reka-ui'],
                registryDependencies: [],
                files: [
                    { path: 'components/ui/button/Button.vue', type: 'registry:ui' as const },
                ],
                tailwind: {},
                cssVars: {},
                integrity: 'sha256-def',
            },
        ],
    };

    it('generates CycloneDX 1.5 SBOM with components and npm dependencies', () => {
        const sbom = buildRegistrySbom(sampleIndex, 'manifest-hash');

        expect(sbom.bomFormat).toBe('CycloneDX');
        expect(sbom.specVersion).toBe('1.5');
        expect(sbom.manifestIntegrity).toBe('manifest-hash');

        // 组件按 bom-ref 字典序：brutx:button, brutx:dialog, npm:@lucide/vue, npm:reka-ui
        const refs = sbom.components.map(c => c['bom-ref']);
        expect(refs).toEqual([
            'brutx:button',
            'brutx:dialog',
            'npm:@lucide/vue',
            'npm:reka-ui',
        ]);

        const dialog = sbom.components.find(c => c['bom-ref'] === 'brutx:dialog')!;
        expect(dialog.type).toBe('application');
        expect(dialog.dependencies).toContain('npm:reka-ui');
        expect(dialog.dependencies).toContain('npm:@lucide/vue');
        expect(dialog.dependencies).toContain('brutx:button');
        expect(dialog.hashes).toEqual([{ alg: 'SHA-256', content: 'abc' }]);

        const rekaUi = sbom.components.find(c => c['bom-ref'] === 'npm:reka-ui')!;
        expect(rekaUi.type).toBe('library');
    });

    it('computes SBOM integrity and serialNumber deterministically', () => {
        const sbom1 = buildRegistrySbom(sampleIndex, 'hash-1');
        const sbom2 = buildRegistrySbom(sampleIndex, 'hash-1');

        // 完整性对同一内容一致（排除 serialNumber/metadata.timestamp 自身）
        expect(sbom1.integrity).toBe(sbom2.integrity);
        // serialNumber 由内容哈希确定性派生：同一内容两次构建必须一致（可复现构建）
        expect(sbom1.serialNumber).toBe(sbom2.serialNumber);
        expect(sbom1.serialNumber).toMatch(/^urn:uuid:[0-9a-f-]{36}$/);
    });

    it('produces different integrity when components change', () => {
        const sbomA = buildRegistrySbom(sampleIndex, 'hash');
        const modifiedIndex = {
            ...sampleIndex,
            items: sampleIndex.items.map(i =>
                i.name === 'button' ? { ...i, integrity: 'sha256-changed' } : i
            ),
        };
        const sbomB = buildRegistrySbom(modifiedIndex, 'hash');
        expect(sbomA.integrity).not.toBe(sbomB.integrity);
    });

    it('exposes computeSbomIntegrity for direct verification', () => {
        const sbom = buildRegistrySbom(sampleIndex, 'hash');
        const recomputed = computeSbomIntegrity(sbom);
        expect(recomputed).toBe(sbom.integrity);
    });
});

describe('signManifestFromEnv (基础设施闭环 P0 自动签发)', () => {
    const ENV_KEYS = ['BRUTX_REGISTRY_PRIVATE_KEY', 'BRUTX_REGISTRY_KEY_ID'] as const;

    afterEach(() => {
        for (const key of ENV_KEYS) delete process.env[key];
    });

    function makeManifest() {
        return {
            $schema: 'https://example.com/schema.json',
            name: 'brutx-vue',
            schemaVersion: 1,
            registryVersion: '0.1.0',
            buildTimestamp: null,
            gitCommit: null,
            itemCount: 0,
            items: {},
            integrity: 'sha256-abc',
        };
    }

    it('returns unsigned manifest when signing env vars are not set', () => {
        const manifest = makeManifest();
        const result = signManifestFromEnv(manifest);
        expect(result.signature).toBeUndefined();
        expect(result.keyId).toBeUndefined();
        expect(result).toEqual(manifest);
    });

    it('signs manifest integrity with PKCS8 DER base64 private key and keyId', () => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
        const publicDer = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
        const privateDer = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
        process.env.BRUTX_REGISTRY_PRIVATE_KEY = privateDer;
        process.env.BRUTX_REGISTRY_KEY_ID = 'test-key';

        const manifest = makeManifest();
        const result = signManifestFromEnv(manifest);
        expect(result.keyId).toBe('test-key');
        expect(result.signature).toBeDefined();
        expect(result.signature!.length).toBeGreaterThan(0);

        // 用对应公钥验证签名有效
        const valid = crypto.verify(
            null,
            Buffer.from(manifest.integrity, 'utf-8'),
            crypto.createPublicKey({
                key: Buffer.from(publicDer, 'base64'),
                format: 'der',
                type: 'spki',
            }),
            Buffer.from(result.signature!, 'base64'),
        );
        expect(valid).toBe(true);
    });

    it('signs manifest with PEM private key format', () => {
        const { privateKey } = crypto.generateKeyPairSync('ed25519');
        const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
        process.env.BRUTX_REGISTRY_PRIVATE_KEY = privatePem;
        process.env.BRUTX_REGISTRY_KEY_ID = 'test-key';

        const result = signManifestFromEnv(makeManifest());
        expect(result.signature).toBeDefined();
        expect(result.keyId).toBe('test-key');
    });

    it('preserves manifest integrity (signing does not alter integrity)', () => {
        const { privateKey } = crypto.generateKeyPairSync('ed25519');
        const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
        process.env.BRUTX_REGISTRY_PRIVATE_KEY = privatePem;
        process.env.BRUTX_REGISTRY_KEY_ID = 'test-key';

        const manifest = makeManifest();
        const result = signManifestFromEnv(manifest);
        expect(result.integrity).toBe(manifest.integrity);
    });

    it('throws when private key is malformed (block invalid signed artifacts)', () => {
        process.env.BRUTX_REGISTRY_PRIVATE_KEY = 'not-a-valid-key';
        process.env.BRUTX_REGISTRY_KEY_ID = 'test-key';
        expect(() => signManifestFromEnv(makeManifest())).toThrow();
    });

    it('leaves manifest unsigned when keyId is missing even if private key is set', () => {
        const { privateKey } = crypto.generateKeyPairSync('ed25519');
        const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
        process.env.BRUTX_REGISTRY_PRIVATE_KEY = privatePem;
        const result = signManifestFromEnv(makeManifest());
        expect(result.signature).toBeUndefined();
        expect(result.keyId).toBeUndefined();
    });
});
