import { describe, expect, it } from 'vitest'
import {
    assertApiExportsManifestShape,
    buildApiExportsManifest,
    buildPublicEntryContent,
} from 'brutx-shared-vue/api-contract'
import { collectExportsOutput } from './generate-exports.js'
import { API_CONTRACT, API_CONTRACT_COUNTS, getApiEntry, projectComponentExports } from '../api-contract.js'
import { collectApiContractOutputs } from './generate-api-contract.js'

const INTERNAL_SELECTION_HELPERS = [
    'useClearableSelection',
    'useSelectableTrigger',
    'useSelectionDisplayText',
    'useTransferPanelSelection',
] as const

describe('UI API contract', () => {
    it('keeps the explicit entry inventory and symbol counts stable', () => {
        expect(API_CONTRACT_COUNTS).toEqual({
            components: 92,
            composables: 31,
            rootExports: 684,
            composableExports: 114,
            localeExports: 59,
        })
        expect(API_CONTRACT.entries.filter((entry) => entry.kind === 'component')).toHaveLength(92)
        expect(API_CONTRACT.entries.filter((entry) => entry.kind === 'composable')).toHaveLength(31)
        expect(API_CONTRACT.entries).toHaveLength(128)
        expect(API_CONTRACT.entries.filter((entry) => entry.kind === 'style').map((entry) => entry.subpath)).toEqual([
            './style.css',
            './preflight.css',
        ])
    })

    it('keeps selection helpers internal while retaining public business entry points', () => {
        const publicNames = API_CONTRACT.entries.flatMap((entry) => entry.exports.map((item) => item.publicName))
        for (const helper of INTERNAL_SELECTION_HELPERS) {
            expect(publicNames).not.toContain(helper)
            expect(API_CONTRACT.modules.find((module) => module.id === `composable:${helper}`)).toMatchObject({
                public: false,
                owner: 'component:selection',
                layer: 'runtime/helper',
            })
        }

        expect(publicNames).toEqual(expect.arrayContaining([
            'useClearable',
            'ComboboxOption',
            'CascaderOption',
            'TreeNode',
            'TransferDataItem',
        ]))
    })

    it('projects the loading component and directive as one named-only entry', () => {
        const loading = projectComponentExports('loading')
        expect(loading.exports.map((item) => item.publicName)).toEqual(['Loading', 'vLoading'])
        expect(getApiEntry('component:loading').moduleIds).toEqual(['component:loading', 'directive:loading'])

        const content = buildPublicEntryContent(loading.exports)
        expect(content).toContain("export { default as Loading } from './Loading.vue'")
        expect(content).toContain("export { vLoading } from '../../directives/loading'")
        expect(content).not.toContain('export *')
    })

    it('rejects duplicate projected names and does not discover extra files', () => {
        expect(() => buildPublicEntryContent([
            { source: './a', sourceName: 'value', publicName: 'Thing', kind: 'value' },
            { source: './b', sourceName: 'value', publicName: 'Thing', kind: 'value' },
        ])).toThrow(/Duplicate public export/)

        const outputs = collectApiContractOutputs()
        const outputPaths = outputs.map((output) => output.relativePath)
        expect(outputPaths).toContain('src/index.ts')
        expect(outputPaths).toContain('src/composables/index.ts')
        expect(outputPaths).not.toContain('src/entries/useClearableSelection.ts')
        expect(outputPaths).not.toContain('src/entries/useSelectableTrigger.ts')
        expect(outputs.find((output) => output.relativePath === 'src/index.ts')?.allowMissing).toBeFalsy()
        expect(outputs.find((output) => output.relativePath === 'src/composables/index.ts')?.allowMissing).toBeFalsy()
    })

    it('derives package exports and rejects a conflicting subpath in the manifest', () => {
        const manifest = buildApiExportsManifest(API_CONTRACT)
        const packageJson = JSON.parse(collectExportsOutput(manifest).content) as {
            exports: Record<string, unknown>
        }
        expect(Object.keys(packageJson.exports)).toEqual(manifest.entries.map((entry) => entry.subpath))
        expect(packageJson.exports['./composables']).toEqual({
            types: './dist/composables.d.ts',
            import: './dist/composables.js',
        })
        expect(packageJson.exports['./useToast']).toEqual({
            types: './dist/entries/useToast.d.ts',
            import: './dist/composables/useToast.js',
        })
        expect(packageJson.exports['./style.css']).toBe('./dist/styles.css')
        expect(packageJson.exports['./preflight.css']).toBe('./dist/preflight.css')
        expect(packageJson.exports['./useClearableSelection']).toBeUndefined()

        const duplicate = {
            ...manifest,
            entries: [...manifest.entries, { ...manifest.entries[0], id: 'duplicate-entry' }],
        }
        expect(() => assertApiExportsManifestShape(duplicate)).toThrow(/Duplicate API (exports manifest|contract) subpath/)
    })
})
