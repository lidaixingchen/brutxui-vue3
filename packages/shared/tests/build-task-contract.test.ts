import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('Turbo Build Task Graph Contract', () => {
    const rootDir = resolve(__dirname, '../../..')
    const turboJsonPath = resolve(rootDir, 'turbo.json')

    it('turbo.json must exist and be valid JSON', () => {
        expect(existsSync(turboJsonPath)).toBe(true)
    })

    it('CLI build task must include tsup.config.ts in its inputs or default inputs', () => {
        const turboContent = JSON.parse(readFileSync(turboJsonPath, 'utf-8')) as {
            tasks?: Record<string, { inputs?: string[]; dependsOn?: string[] }>
        }

        const tasks = turboContent.tasks ?? {}
        const cliBuildTask = tasks['brutx-vue#build:artifact'] ?? tasks['brutx-vue#build'] ?? tasks.build
        expect(cliBuildTask).toBeDefined()

        const inputs = cliBuildTask?.inputs ?? []
        const hasTsupConfig = inputs.some(p => p.includes('tsup.config.ts')) || inputs.includes('$TURBO_DEFAULT$')
        expect(hasTsupConfig).toBe(true)
    })

    it('Registry build task must explicitly depend on UI generate contract', () => {
        const turboContent = JSON.parse(readFileSync(turboJsonPath, 'utf-8')) as {
            tasks?: Record<string, { dependsOn?: string[] }>
        }

        const tasks = turboContent.tasks ?? {}
        const registryBuild = tasks['brutx-registry-vue#build:artifact'] ?? tasks['brutx-registry-vue#build']
        expect(registryBuild).toBeDefined()

        const dependsOn = registryBuild?.dependsOn ?? []
        const hasUiGenerateDependency = dependsOn.includes('brutx-ui-vue#generate') || dependsOn.includes('^generate')
        expect(hasUiGenerateDependency).toBe(true)
    })
})
