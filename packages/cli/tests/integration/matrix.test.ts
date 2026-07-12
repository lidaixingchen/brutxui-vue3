import { afterEach, describe, expect, it } from 'vitest'
import fs from 'fs-extra'
import path from 'path'
import {
    CLI_INTEGRATION_MATRIX,
    getIntegrationMatrixCases,
    getIntegrationMatrixCommands,
} from './matrix'
import {
    createTestProject,
    localRegistry,
    removeTestProject,
    shouldKeepTestProject,
    type TestProject,
} from './helpers'

describe('CLI integration matrix', () => {
    const projects: TestProject[] = []

    afterEach(async () => {
        while (projects.length > 0) {
            const project = projects.pop()
            if (project) {
                await removeTestProject(project)
            }
        }
    })

    it('keeps the release matrix explicit and local-registry friendly', () => {
        expect(CLI_INTEGRATION_MATRIX.map(item => item.name)).toEqual([
            'vite-vue-tailwind-v4',
            'nuxt-tailwind-v4',
            'monorepo-subpackage-tailwind-v4',
        ])

        for (const item of CLI_INTEGRATION_MATRIX) {
            expect(item.commands).toEqual([
                'init',
                'add button',
                'add data-table',
                'diff',
                'remove button',
                'doctor',
            ])
        }
    })

    it('runs only the lightweight smoke case by default', () => {
        expect(CLI_INTEGRATION_MATRIX.filter(item => item.runByDefault).map(item => item.name)).toEqual([
            'vite-vue-tailwind-v4',
        ])
        expect(getIntegrationMatrixCases().map(item => item.name)).toEqual([
            'vite-vue-tailwind-v4',
        ])
    })

    it('can opt into the full release matrix', () => {
        const releaseCases = getIntegrationMatrixCases({ includeHeavy: true })

        expect(releaseCases).toHaveLength(CLI_INTEGRATION_MATRIX.length)
        expect(releaseCases.map(item => item.name)).toEqual(CLI_INTEGRATION_MATRIX.map(item => item.name))
        expect(releaseCases).not.toBe(CLI_INTEGRATION_MATRIX)
    })

    it('converts matrix command labels into CLI argument arrays', () => {
        expect(getIntegrationMatrixCommands(CLI_INTEGRATION_MATRIX[0])).toEqual([
            { label: 'init', args: ['init'] },
            { label: 'add button', args: ['add', 'button'] },
            { label: 'add data-table', args: ['add', 'data-table'] },
            { label: 'diff', args: ['diff'] },
            { label: 'remove button', args: ['remove', 'button'] },
            { label: 'doctor', args: ['doctor'] },
        ])
    })

    it('expands matrix commands into local-registry CLI invocations', () => {
        expect(getIntegrationMatrixCommands(CLI_INTEGRATION_MATRIX[0], {
            cwd: 'PROJECT_ROOT',
            registry: 'LOCAL_REGISTRY',
        })).toEqual([
            { label: 'init', args: ['init', '--yes', '--force', '--cwd', 'PROJECT_ROOT'] },
            { label: 'add button', args: ['add', 'button', '--cwd', 'PROJECT_ROOT', '--registry', 'LOCAL_REGISTRY', '--overwrite'] },
            { label: 'add data-table', args: ['add', 'data-table', '--cwd', 'PROJECT_ROOT', '--registry', 'LOCAL_REGISTRY', '--overwrite'] },
            { label: 'diff', args: ['diff', '--cwd', 'PROJECT_ROOT', '--registry', 'LOCAL_REGISTRY'] },
            { label: 'remove button', args: ['remove', 'button', '--cwd', 'PROJECT_ROOT', '--yes'] },
            { label: 'doctor', args: ['doctor', '--cwd', 'PROJECT_ROOT', '--yes'] },
        ])
    })

    it('creates lightweight project fixtures for every matrix case', async () => {
        for (const item of CLI_INTEGRATION_MATRIX) {
            const project = await createTestProject({
                template: item.template,
            })
            projects.push(project)

            expect(project.template).toBe(item.template)
            expect(await fs.pathExists(path.join(project.root, 'package.json'))).toBe(true)
            expect(await fs.pathExists(project.fakeBin)).toBe(true)
            expect(localRegistry).toContain(path.join('packages', 'registry', 'registry'))

            if (item.template === 'nuxt') {
                expect(await fs.pathExists(path.join(project.root, 'nuxt.config.ts'))).toBe(true)
                expect(await fs.pathExists(path.join(project.root, 'assets', 'css', 'main.css'))).toBe(true)
            } else {
                expect(await fs.pathExists(path.join(project.root, 'src', 'main.ts'))).toBe(true)
                expect(await fs.pathExists(path.join(project.root, 'src', 'index.css'))).toBe(true)
            }

            if (item.template === 'monorepo-subpackage') {
                expect(project.workspaceRoot).not.toBe(project.root)
                expect(await fs.pathExists(path.join(project.workspaceRoot, 'pnpm-workspace.yaml'))).toBe(true)
                expect(project.root).toBe(path.join(project.workspaceRoot, 'apps', 'web'))
            }
        }
    })

    it('supports keeping failed integration workspaces for debugging', () => {
        const previous = process.env.BRUTX_KEEP_INTEGRATION_TMP

        try {
            delete process.env.BRUTX_KEEP_INTEGRATION_TMP
            expect(shouldKeepTestProject()).toBe(false)

            process.env.BRUTX_KEEP_INTEGRATION_TMP = '1'
            expect(shouldKeepTestProject()).toBe(true)
        } finally {
            if (previous === undefined) {
                delete process.env.BRUTX_KEEP_INTEGRATION_TMP
            } else {
                process.env.BRUTX_KEEP_INTEGRATION_TMP = previous
            }
        }
    })
})
