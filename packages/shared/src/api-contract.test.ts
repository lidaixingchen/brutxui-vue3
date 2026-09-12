import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
    parseModuleExports,
    validateApiContractSourceExports,
    type ApiContract,
    type PublicExport,
} from './api-contract.js'

const fixtureRoots: string[] = []

function createFixture(files: Record<string, string>): string {
    const root = mkdtempSync(path.join(os.tmpdir(), 'brutx-api-contract-'))
    fixtureRoots.push(root)
    for (const [relativePath, content] of Object.entries(files)) {
        const target = path.join(root, relativePath)
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, content, 'utf8')
    }
    return root
}

function fixtureContract(exports: readonly PublicExport[]): ApiContract {
    return {
        modules: [
            { id: 'fixture', source: 'src', owner: 'fixture', layer: 'runtime/helper', public: true },
        ],
        entries: [
            { id: 'root', subpath: '.', kind: 'root', moduleIds: ['fixture'], exports },
        ],
        registry: [],
    }
}

afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('API contract symbol parser', () => {
    it('parses named, aliased, type-only and star exports without resolving files', () => {
        const result = parseModuleExports(`
            const value = 1
            interface Options {}
            export { value as publicValue }
            export type { Options }
            export * from './nested'
        `, 'module.ts')

        expect(result).toEqual(expect.arrayContaining([
            { sourceName: 'value', publicName: 'publicValue', kind: 'value', moduleSpecifier: undefined },
            { sourceName: 'Options', publicName: 'Options', kind: 'type', moduleSpecifier: undefined },
            { sourceName: '*', publicName: '*', kind: 'value', moduleSpecifier: './nested', isStar: true },
        ]))
    })

    it('records the SFC default and normal script exports separately', () => {
        const result = parseModuleExports(`
            <script lang="ts">
            export interface WidgetOptions {}
            export const widgetVersion = 1
            </script>
            <script setup lang="ts">
            const internalState = 1
            </script>
        `, 'Widget.vue')

        expect(result).toEqual(expect.arrayContaining([
            { sourceName: 'default', publicName: 'default', kind: 'value' },
            { sourceName: 'WidgetOptions', publicName: 'WidgetOptions', kind: 'type', moduleSpecifier: undefined },
            { sourceName: 'widgetVersion', publicName: 'widgetVersion', kind: 'value', moduleSpecifier: undefined },
        ]))
        expect(result.map((item) => item.publicName)).not.toContain('internalState')
    })

    it('validates recursive re-exports and ignores script setup local props', () => {
        const root = createFixture({
            'src/index.ts': `
                export { value as publicValue } from './barrel'
                export type { Options } from './barrel'
                export { default as Widget } from './Widget.vue'
                export type { WidgetPublic } from './Widget.vue'
            `,
            'src/barrel.ts': `export * from './public'`,
            'src/public.ts': `export const value = 1\nexport interface Options {}`,
            'src/Widget.vue': `
                <script setup lang="ts">
                interface LocalProps { hidden: boolean }
                </script>
                <script lang="ts">
                export interface WidgetPublic { visible: boolean }
                </script>
                <template><div /></template>
            `,
        })

        const issues = validateApiContractSourceExports(fixtureContract([
            { source: './barrel', sourceName: 'value', publicName: 'publicValue', kind: 'value' },
            { source: './barrel', sourceName: 'Options', publicName: 'Options', kind: 'type' },
            { source: './Widget.vue', sourceName: 'default', publicName: 'Widget', kind: 'value' },
            { source: './Widget.vue', sourceName: 'WidgetPublic', publicName: 'WidgetPublic', kind: 'type' },
        ]), { packageRoot: root })

        expect(issues).toEqual([])

        const localPropsIssues = validateApiContractSourceExports(fixtureContract([
            { source: './Widget.vue', sourceName: 'LocalProps', publicName: 'LocalProps', kind: 'type' },
        ]), { packageRoot: root })
        expect(localPropsIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'PUBLIC_EXPORT_NOT_FOUND', sourceName: 'LocalProps' }),
        ]))
    })

    it('reports a wrong-case source through the resolver', () => {
        const root = createFixture({
            'src/index.ts': `export { value as publicValue } from './public'`,
            'src/Public.ts': `export const value = 1`,
        })

        const issues = validateApiContractSourceExports(fixtureContract([
            { source: './public', sourceName: 'value', publicName: 'publicValue', kind: 'value' },
        ]), { packageRoot: root })

        expect(issues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'ENTRY_SOURCE_UNRESOLVED' }),
        ]))
    })

    it('reports a deleted named export and unresolved recursive re-export', () => {
        const missingExportRoot = createFixture({
            'src/index.ts': `export { value as publicValue } from './public'`,
            'src/public.ts': `export const other = 1`,
        })
        const missingExportIssues = validateApiContractSourceExports(fixtureContract([
            { source: './public', sourceName: 'value', publicName: 'publicValue', kind: 'value' },
        ]), { packageRoot: missingExportRoot })
        expect(missingExportIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'PUBLIC_EXPORT_NOT_FOUND', sourceName: 'value' }),
        ]))

        const reexportRoot = createFixture({
            'src/index.ts': `export { value as publicValue } from './barrel'`,
            'src/barrel.ts': `export { value } from './missing'`,
        })
        const reexportIssues = validateApiContractSourceExports(fixtureContract([
            { source: './barrel', sourceName: 'value', publicName: 'publicValue', kind: 'value' },
        ]), { packageRoot: reexportRoot })
        expect(reexportIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'PUBLIC_EXPORT_REEXPORT_UNRESOLVED' }),
        ]))

        const handEditedRoot = createFixture({
            'src/index.ts': `export { leaked } from './public'`,
            'src/public.ts': `const privateValue = 1\nexport { leaked }`,
        })
        const handEditedIssues = validateApiContractSourceExports(fixtureContract([
            { source: './public', sourceName: 'leaked', publicName: 'leaked', kind: 'value' },
        ]), { packageRoot: handEditedRoot })
        expect(handEditedIssues).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'PUBLIC_EXPORT_NOT_FOUND', sourceName: 'leaked' }),
        ]))
    })
})
