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

export interface IntegrationMatrixCommand {
    label: string
    args: string[]
}

export interface IntegrationMatrixOptions {
    includeHeavy?: boolean
}

export interface IntegrationCommandContext {
    cwd: string
    registry: string
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

export function getIntegrationMatrixCases(options: IntegrationMatrixOptions = {}): IntegrationMatrixCase[] {
    return options.includeHeavy
        ? [...CLI_INTEGRATION_MATRIX]
        : CLI_INTEGRATION_MATRIX.filter(item => item.runByDefault)
}

export function getIntegrationMatrixCommands(
    item: IntegrationMatrixCase,
    context?: IntegrationCommandContext
): IntegrationMatrixCommand[] {
    return item.commands.map(command => ({
        label: command,
        args: context ? getCommandArgs(command, context) : command.split(' '),
    }))
}

function getCommandArgs(command: string, context: IntegrationCommandContext): string[] {
    switch (command) {
        case 'init':
            return ['init', '--yes', '--force', '--cwd', context.cwd]
        case 'add button':
            return ['add', 'button', '--cwd', context.cwd, '--registry', context.registry, '--overwrite']
        case 'add data-table':
            return ['add', 'data-table', '--cwd', context.cwd, '--registry', context.registry, '--overwrite']
        case 'diff':
            return ['diff', '--cwd', context.cwd, '--registry', context.registry]
        case 'remove button':
            return ['remove', 'button', '--cwd', context.cwd, '--yes']
        case 'doctor':
            return ['doctor', '--cwd', context.cwd, '--yes']
        default:
            return command.split(' ')
    }
}
