import { describe, expect, it } from 'vitest'
import {
    CLI_INTEGRATION_MATRIX,
    getIntegrationMatrixCases,
    getIntegrationMatrixCommands,
} from './matrix'
import { shouldKeepTestProject } from './helpers'

describe('CLI integration matrix', () => {
    it('keeps the release matrix explicit and local-registry friendly', () => {
        expect(CLI_INTEGRATION_MATRIX.map(item => item.name)).toEqual([
            'vite-vue-tailwind-v4',
            'vite-vue-tailwind-v3',
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
