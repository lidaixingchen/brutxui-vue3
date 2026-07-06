import { describe, expect, it } from 'vitest'
import {
    findRegistryDependencyCycles,
    findUnknownRegistryReferences,
    validateRegistryManifestConsistency,
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

    it('accepts a manifest that matches index items', () => {
        expect(validateRegistryManifestConsistency({
            itemCount: 2,
            items: {
                button: {
                    integrity: 'sha256-button',
                    fileCount: 1,
                    dependencies: [],
                    registryDependencies: [],
                    status: 'stable',
                },
                dialog: {
                    integrity: 'sha256-dialog',
                    fileCount: 2,
                    dependencies: ['reka-ui', '@vueuse/core'],
                    registryDependencies: ['button'],
                    status: 'deprecated',
                    replacement: 'modal',
                },
            },
        }, [
            createIndexItem('button', {
                integrity: 'sha256-button',
                fileCount: 1,
                dependencies: [],
                registryDependencies: [],
                status: 'stable',
            }),
            createIndexItem('dialog', {
                integrity: 'sha256-dialog',
                fileCount: 2,
                dependencies: ['@vueuse/core', 'reka-ui'],
                registryDependencies: ['button'],
                status: 'deprecated',
                replacement: 'modal',
            }),
        ])).toEqual([])
    })

    it('reports manifest item count, missing items, and extra items', () => {
        expect(validateRegistryManifestConsistency({
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
        }, [
            createIndexItem('button', { integrity: 'sha256-button', fileCount: 1 }),
            createIndexItem('dialog', { integrity: 'sha256-dialog', fileCount: 1 }),
        ])).toEqual([
            'itemCount 3 does not match index item count 2',
            'missing item "dialog"',
            'extra item "ghost"',
        ])
    })

    it('reports manifest metadata drift for matching items', () => {
        expect(validateRegistryManifestConsistency({
            itemCount: 1,
            items: {
                dialog: {
                    integrity: 'sha256-old',
                    fileCount: 1,
                    dependencies: ['old-dep'],
                    registryDependencies: ['old-component'],
                    status: 'stable',
                    replacement: 'legacy-dialog',
                },
            },
        }, [
            createIndexItem('dialog', {
                integrity: 'sha256-new',
                fileCount: 2,
                dependencies: ['new-dep'],
                registryDependencies: ['button'],
                status: 'deprecated',
                replacement: 'modal',
            }),
        ])).toEqual([
            'item "dialog" integrity mismatch',
            'item "dialog" fileCount 1 does not match index file count 2',
            'item "dialog" dependencies mismatch',
            'item "dialog" registryDependencies mismatch',
            'item "dialog" status mismatch',
            'item "dialog" replacement mismatch',
        ])
    })
})

function createIndexItem(
    name: string,
    overrides: {
        integrity: string
        fileCount: number
        dependencies?: string[]
        registryDependencies?: string[]
        status?: RegistryIndexItem['status']
        replacement?: string
    }
): RegistryIndexItem {
    return {
        name,
        type: 'registry:component',
        title: name,
        description: `${name} component`,
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
