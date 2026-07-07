import { describe, expect, it } from 'vitest'
import {
    findRegistryDependencyCycles,
    findUnknownRegistryReferences,
    formatRegistryDependencyGraph,
    REGISTRY_MANIFEST_SCHEMA_URL,
    validateComponentSourceFiles,
    validateDocsComponentPageCoverage,
    validateGeneratedItemMatchesMetadata,
    validateRegistryManifestConsistency,
    type RegistryBuildManifestSnapshot,
} from '../scripts/validate-utils'
import type { RegistryIndexItem } from 'brutx-shared-vue'

describe('validate-registry helpers', () => {
    it('finds registry dependencies that do not reference known items', () => {
        expect(findUnknownRegistryReferences([
            { name: 'button', registryDependencies: [] },
            { name: 'dialog', registryDependencies: ['button', 'missing'] },
        ])).toEqual([
            { component: 'dialog', dependency: 'missing' },
        ])
    })

    it('finds dependency cycles across registry items', () => {
        expect(findRegistryDependencyCycles([
            { name: 'a', registryDependencies: ['b'] },
            { name: 'b', registryDependencies: ['c'] },
            { name: 'c', registryDependencies: ['a'] },
            { name: 'd', registryDependencies: ['a'] },
        ])).toEqual([
            ['a', 'b', 'c', 'a'],
        ])
    })

    it('ignores acyclic dependency graphs', () => {
        expect(findRegistryDependencyCycles([
            { name: 'button', registryDependencies: [] },
            { name: 'dialog', registryDependencies: ['button'] },
            { name: 'popover', registryDependencies: ['button'] },
        ])).toEqual([])
    })

    it('formats a sorted registry dependency graph', () => {
        expect(formatRegistryDependencyGraph([
            { name: 'dialog', registryDependencies: ['button', 'popover'] },
            { name: 'button', registryDependencies: [] },
            { name: 'alert-dialog', registryDependencies: ['dialog', 'button'] },
        ])).toEqual([
            'alert-dialog -> button, dialog',
            'button -> (none)',
            'dialog -> button, popover',
        ])
    })

    it('accepts a manifest that matches index items', () => {
        expect(validateRegistryManifestConsistency(createManifest({
            items: {
                button: {
                    integrity: 'sha256-button',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                    category: 'action',
                    examples: [],
                    status: 'stable',
                },
                dialog: {
                    integrity: 'sha256-dialog',
                    fileCount: 2,
                    dependencies: ['reka-ui', '@vueuse/core'],
                    registryDependencies: ['button'],
                    category: 'overlay',
                    examples: ['dialog-demo'],
                    status: 'deprecated',
                    replacement: 'modal',
                },
            },
        }), createIndex([
            createIndexItem('button', {
                integrity: 'sha256-button',
                fileCount: 1,
                dependencies: [],
                registryDependencies: [],
                category: 'action',
                examples: [],
                status: 'stable',
            }),
            createIndexItem('dialog', {
                integrity: 'sha256-dialog',
                fileCount: 2,
                dependencies: ['@vueuse/core', 'reka-ui'],
                registryDependencies: ['button'],
                category: 'overlay',
                examples: ['dialog-demo'],
                status: 'deprecated',
                replacement: 'modal',
            }),
        ]))).toEqual([])
    })

    it('reports manifest schema and registry version drift', () => {
        expect(validateRegistryManifestConsistency(createManifest({
            schemaVersion: 2,
            registryVersion: '0.0.0',
            itemCount: 0,
            items: {},
        }), createIndex([], {
            schemaVersion: 1,
            registryVersion: '0.1.0',
        }))).toEqual([
            'schemaVersion 2 does not match index schemaVersion 1',
            'registryVersion "0.0.0" does not match index registryVersion "0.1.0"',
        ])
    })

    it('reports manifest item count, missing items, and extra items', () => {
        expect(validateRegistryManifestConsistency(createManifest({
            itemCount: 3,
            items: {
                button: {
                    integrity: 'sha256-button',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                },
                ghost: {
                    integrity: 'sha256-ghost',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        }), createIndex([
            createIndexItem('button', { integrity: 'sha256-button', fileCount: 1 }),
            createIndexItem('dialog', { integrity: 'sha256-dialog', fileCount: 1 }),
        ]))).toEqual([
            'itemCount 3 does not match index item count 2',
            'missing item "dialog"',
            'extra item "ghost"',
        ])
    })

    it('reports manifest metadata drift for matching items', () => {
        expect(validateRegistryManifestConsistency(createManifest({
            items: {
                dialog: {
                    integrity: 'sha256-old',
                    fileCount: 1,
                    dependencies: ['old-dep'],
                    registryDependencies: ['old-component'],
                    category: 'layout',
                    examples: ['old-example'],
                    status: 'stable',
                    replacement: 'legacy-dialog',
                },
            },
        }), createIndex([
            createIndexItem('dialog', {
                integrity: 'sha256-new',
                fileCount: 2,
                dependencies: ['new-dep'],
                registryDependencies: ['button'],
                category: 'overlay',
                examples: ['dialog-demo'],
                status: 'deprecated',
                replacement: 'modal',
            }),
        ]))).toEqual([
            'item "dialog" integrity mismatch',
            'item "dialog" fileCount 1 does not match index file count 2',
            'item "dialog" dependencies mismatch',
            'item "dialog" registryDependencies mismatch',
            'item "dialog" examples mismatch',
            'item "dialog" category mismatch',
            'item "dialog" status mismatch',
            'item "dialog" replacement mismatch',
        ])
    })

    it('reports manifest top-level contract drift', () => {
        expect(validateRegistryManifestConsistency(createManifest({
            $schema: 'https://example.test/registry-manifest.schema.json',
            name: 'brutx-next',
            buildTimestamp: 'not-a-date',
            gitCommit: '',
            items: {
                dialog: {
                    integrity: 'sha256-dialog',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                },
                button: {
                    integrity: 'sha256-button',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                },
            },
        }), createIndex([
            createIndexItem('button', { integrity: 'sha256-button', fileCount: 1 }),
            createIndexItem('dialog', { integrity: 'sha256-dialog', fileCount: 1 }),
        ]))).toEqual([
            `$schema "https://example.test/registry-manifest.schema.json" does not match expected "${REGISTRY_MANIFEST_SCHEMA_URL}"`,
            'name "brutx-next" does not match index name "brutx-vue"',
            'buildTimestamp "not-a-date" is not a valid date-time',
            'gitCommit must be null or a non-empty string',
            'manifest items must be sorted by name',
        ])
    })

    it('validates component metadata against source file inventory', () => {
        expect(validateComponentSourceFiles('button', {
            name: 'button',
            description: 'Button component',
            dependencies: [],
            category: 'action',
            examples: [],
            files: ['Button.vue', 'button-variants.ts'],
            composables: ['useButton.ts'],
            directives: ['button.ts'],
        }, {
            componentFiles: new Set(['Button.vue', 'button-variants.ts']),
            composables: new Set(['useButton.ts']),
            directives: new Set(['button.ts']),
        })).toEqual([])
    })

    it('reports unsafe, duplicate, and missing metadata source files', () => {
        expect(validateComponentSourceFiles('button', {
            name: 'wrong-button',
            description: 'Button component',
            dependencies: [],
            category: 'action',
            examples: [],
            files: ['Button.vue', 'Button.vue', '../escape.ts', 'Missing.vue'],
            composables: ['missingComposable.ts'],
            directives: ['missingDirective.ts'],
        }, {
            componentFiles: new Set(['Button.vue']),
            composables: new Set(),
            directives: new Set(),
        })).toEqual([
            '[button] COMPONENT_REGISTRY entry name "wrong-button" does not match its key',
            '[button] duplicate component file "Button.vue"',
            '[button] component file "../escape.ts" must be a portable relative file path',
            '[button] declared component file "Missing.vue" does not exist in source',
            '[button] declared composable "missingComposable.ts" does not exist in source',
            '[button] declared directive "missingDirective.ts" does not exist in source',
        ])
    })

    it('validates docs component page coverage with aliases and exemptions', () => {
        expect(validateDocsComponentPageCoverage({
            locale: 'en',
            componentNames: ['button', 'color-picker', 'legacy-card'],
            pageSlugs: new Set(['button', 'color-picker']),
            aliases: {
                'color-picker': 'color-picker',
            },
            exemptions: new Set(['legacy-card']),
        })).toEqual([])
    })

    it('reports missing and unknown docs component pages', () => {
        expect(validateDocsComponentPageCoverage({
            locale: 'zh',
            componentNames: ['button', 'tree-select'],
            pageSlugs: new Set(['button', 'ghost']),
        })).toEqual([
            '[docs:zh] Missing docs page for "tree-select" at "tree-select.md"',
            '[docs:zh] Docs page "ghost.md" does not map to COMPONENT_REGISTRY',
        ])
    })

    it('validates generated registry item metadata against shared metadata', () => {
        const item = createRegistryItem('button', {
            title: 'Button',
            description: 'Button component',
            dependencies: ['reka-ui'],
            category: 'action',
            examples: ['button-demo'],
            files: [
                'components/ui/button/Button.vue',
                'components/ui/button/button-variants.ts',
                'composables/useButton.ts',
            ],
        })

        expect(validateGeneratedItemMatchesMetadata(item, {
            name: 'button',
            title: 'Button',
            description: 'Button component',
            dependencies: ['reka-ui'],
            category: 'action',
            examples: ['button-demo'],
            files: ['Button.vue', 'button-variants.ts'],
            composables: ['useButton.ts'],
        })).toEqual([])
    })

    it('reports generated registry item drift from shared metadata', () => {
        const item = createRegistryItem('button', {
            title: 'Old Button',
            description: 'Old description',
            dependencies: ['old-dep'],
            category: 'layout',
            examples: ['old-demo'],
            status: 'stable',
            replacement: 'old-button',
            files: ['components/ui/button/Button.vue'],
        })

        expect(validateGeneratedItemMatchesMetadata(item, {
            name: 'button',
            title: 'Button',
            description: 'Button component',
            dependencies: ['reka-ui'],
            category: 'action',
            examples: ['button-demo'],
            status: 'legacy',
            replacement: 'new-button',
            files: ['Button.vue', 'button-variants.ts'],
        })).toEqual([
            'title does not match COMPONENT_REGISTRY',
            'description does not match COMPONENT_REGISTRY',
            'item "button" dependencies mismatch',
            'item "button" examples mismatch',
            'category does not match COMPONENT_REGISTRY',
            'status does not match COMPONENT_REGISTRY',
            'replacement does not match COMPONENT_REGISTRY',
            'declared file "components/ui/button/button-variants.ts" is missing from generated registry item',
        ])
    })
})

function createIndex(
    items: RegistryIndexItem[],
    overrides: {
        schemaVersion?: number
        registryVersion?: string
    } = {}
) {
    return {
        name: 'brutx-vue',
        schemaVersion: overrides.schemaVersion ?? 1,
        registryVersion: overrides.registryVersion ?? '0.1.0',
        items,
    }
}

function createManifest(overrides: Partial<RegistryBuildManifestSnapshot>): RegistryBuildManifestSnapshot {
    const items = overrides.items ?? {}

    return {
        $schema: REGISTRY_MANIFEST_SCHEMA_URL,
        name: 'brutx-vue',
        schemaVersion: 1,
        registryVersion: '0.1.0',
        buildTimestamp: null,
        gitCommit: null,
        itemCount: Object.keys(items).length,
        items,
        ...overrides,
    }
}

function createIndexItem(
    name: string,
    overrides: {
        integrity: string
        fileCount: number
        dependencies?: string[]
        registryDependencies?: string[]
        category?: RegistryIndexItem['category']
        examples?: string[]
        status?: RegistryIndexItem['status']
        replacement?: string
    }
): RegistryIndexItem {
    return {
        name,
        type: 'registry:component',
        title: name,
        description: `${name} component`,
        category: overrides.category,
        examples: overrides.examples,
        dependencies: overrides.dependencies ?? [],
        registryDependencies: overrides.registryDependencies ?? [],
        files: Array.from({ length: overrides.fileCount }, (_, index) => ({
            path: `components/ui/${name}/${index}.vue`,
            type: 'registry:component',
        })),
        tailwind: {},
        cssVars: {},
        integrity: overrides.integrity,
        status: overrides.status,
        replacement: overrides.replacement,
    }
}

function createRegistryItem(
    name: string,
    overrides: {
        title?: string
        description: string
        dependencies?: string[]
        category?: RegistryIndexItem['category']
        examples?: string[]
        status?: RegistryIndexItem['status']
        replacement?: string
        files: string[]
    }
) {
    return {
        name,
        type: 'registry:ui' as const,
        title: overrides.title ?? name,
        description: overrides.description,
        category: overrides.category,
        examples: overrides.examples,
        dependencies: overrides.dependencies ?? [],
        registryDependencies: [],
        files: overrides.files.map(file => ({
            path: file,
            content: `${file} content`,
            type: 'registry:ui' as const,
        })),
        tailwind: {},
        cssVars: {},
        integrity: 'sha256-test',
        status: overrides.status,
        replacement: overrides.replacement,
    }
}
