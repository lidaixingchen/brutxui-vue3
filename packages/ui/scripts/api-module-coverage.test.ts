import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import { collectApiModuleCoverageIssues } from './api-module-coverage.js'

const fixtureRoots: string[] = []

function createFixtureRoot(): string {
    const root = mkdtempSync(path.join(os.tmpdir(), 'brutx-api-module-coverage-'))
    fixtureRoots.push(root)
    return root
}

function writeFixtureFile(root: string, relativePath: string): void {
    const target = path.resolve(root, relativePath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, '', 'utf8')
}

function module(id: string, source: string): ApiContract['modules'][number] {
    return { id, source, owner: id, layer: 'runtime/helper', public: false }
}

afterEach(() => {
    for (const root of fixtureRoots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('API contract module coverage', () => {
    it('accepts registered modules and missing entry files owned by generation', () => {
        const root = createFixtureRoot()
        const modules = [
            module('component:button', 'src/components/button'),
            module('composable:useThing', 'src/composables/useThing.ts'),
            module('directive:focus', 'src/directives/focus.ts'),
            module('source:entries', 'src/entries'),
        ]
        for (const item of modules.filter((candidate) => candidate.id !== 'source:entries')) {
            if (path.extname(item.source)) writeFixtureFile(root, item.source)
            else mkdirSync(path.resolve(root, item.source), { recursive: true })
        }

        expect(collectApiModuleCoverageIssues(
            { modules },
            root,
            [{ relativePath: 'src/entries/useThing.ts', allowMissing: true }],
        )).toEqual([])
    })

    it('reports component, composable, and directive sources missing from the contract', () => {
        const root = createFixtureRoot()
        const modules = [
            module('component:button', 'src/components/button'),
            module('composable:useThing', 'src/composables/useThing.ts'),
            module('directive:focus', 'src/directives/focus.ts'),
        ]
        mkdirSync(path.resolve(root, 'src/components/button'), { recursive: true })
        writeFixtureFile(root, 'src/composables/useThing.ts')
        writeFixtureFile(root, 'src/directives/focus.ts')
        mkdirSync(path.resolve(root, 'src/components/undocumented'), { recursive: true })
        writeFixtureFile(root, 'src/composables/useUnregistered.ts')
        writeFixtureFile(root, 'src/directives/unregistered.ts')

        const issues = collectApiModuleCoverageIssues({ modules }, root)

        const expectedIssues = [
            'unclassified component module → src/components/undocumented',
            'unclassified top-level module → src/composables/useUnregistered.ts',
            'unclassified top-level module → src/directives/unregistered.ts',
        ]
        expect(issues).toEqual(expect.arrayContaining(expectedIssues))
        expect(issues).toHaveLength(expectedIssues.length)
    })
})
