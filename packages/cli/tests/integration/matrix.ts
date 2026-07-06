export type IntegrationTemplate =
    | 'vite-vue'
    | 'nuxt'
    | 'monorepo-subpackage'

export type TailwindMajor = 3 | 4

export interface IntegrationMatrixCase {
    name: string
    template: IntegrationTemplate
    tailwindMajor: TailwindMajor
    commands: string[]
    runByDefault: boolean
}

export const CLI_INTEGRATION_MATRIX: IntegrationMatrixCase[] = [
    {
        name: 'vite-vue-tailwind-v4',
        template: 'vite-vue',
        tailwindMajor: 4,
        commands: ['init', 'add button', 'add data-table', 'diff', 'remove button', 'doctor'],
        runByDefault: true,
    },
    {
        name: 'vite-vue-tailwind-v3',
        template: 'vite-vue',
        tailwindMajor: 3,
        commands: ['init', 'add button', 'add data-table', 'diff', 'remove button', 'doctor'],
        runByDefault: false,
    },
    {
        name: 'nuxt-tailwind-v4',
        template: 'nuxt',
        tailwindMajor: 4,
        commands: ['init', 'add button', 'add data-table', 'diff', 'remove button', 'doctor'],
        runByDefault: false,
    },
    {
        name: 'monorepo-subpackage-tailwind-v4',
        template: 'monorepo-subpackage',
        tailwindMajor: 4,
        commands: ['init', 'add button', 'add data-table', 'diff', 'remove button', 'doctor'],
        runByDefault: false,
    },
]

