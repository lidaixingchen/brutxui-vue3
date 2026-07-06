import { describe, expect, it } from 'vitest'
import { CLI_INTEGRATION_MATRIX } from './matrix'

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
    })
})
