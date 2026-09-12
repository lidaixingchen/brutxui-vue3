import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

interface TaskDefinition {
    cache?: boolean
    dependsOn?: string[]
    inputs?: string[]
    outputs?: string[]
}

interface DryRunTask {
    taskId: string
    command: string
    inputs?: Record<string, string>
    dependencies?: string[]
    resolvedTaskDefinition: TaskDefinition
}

interface TurboJson {
    tasks?: Record<string, TaskDefinition>
}

interface TurboDryRun {
    tasks: DryRunTask[]
}

const rootDir = resolve(__dirname, '../../..')
const turboJsonPath = resolve(rootDir, 'turbo.json')
const turboBinaryPath = resolve(rootDir, 'node_modules/.bin/turbo')
const TURBO_DRY_RUN_TEST_TIMEOUT_MS = 20_000

function readJson<T>(relativePath: string): T {
    return JSON.parse(readFileSync(resolve(rootDir, relativePath), 'utf-8')) as T
}

function readTurboJson(): TurboJson {
    return readJson<TurboJson>('turbo.json')
}

function runTurboDryRun(args: string[]): TurboDryRun {
    const output = execFileSync(
        turboBinaryPath,
        ['run', ...args, '--dry=json', '--output-logs=none'],
        { cwd: rootDir, encoding: 'utf-8' },
    )
    const jsonStart = output.indexOf('{')
    if (jsonStart < 0) {
        throw new Error(`Turbo dry-run 未返回 JSON：${output}`)
    }
    return JSON.parse(output.slice(jsonStart)) as TurboDryRun
}

function findTask(graph: TurboDryRun, taskId: string): DryRunTask {
    const task = graph.tasks.find(item => item.taskId === taskId)
    if (!task) {
        throw new Error(`Turbo dry-run 缺少任务 ${taskId}`)
    }
    return task
}

function countTasks(graph: TurboDryRun, taskId: string): number {
    return graph.tasks.filter(task => task.taskId === taskId).length
}

function expectInput(task: DryRunTask, relativePath: string): void {
    const hasInput = Object.keys(task.inputs ?? {}).some(input =>
        input === relativePath || input.endsWith(`/${relativePath}`),
    )
    expect(hasInput, `${task.taskId} 未哈希输入 ${relativePath}`).toBe(true)
}

describe('Turbo Build Task Graph Contract', () => {
    it('turbo.json must exist and be valid JSON', () => {
        expect(existsSync(turboJsonPath)).toBe(true)
        expect(readTurboJson()).toBeDefined()
    })

    it('root and package wrappers use the canonical Turbo task graph', () => {
        const rootPackage = readJson<{ scripts?: Record<string, string> }>('package.json')
        const uiPackage = readJson<{ scripts?: Record<string, string> }>('packages/ui/package.json')
        const cliPackage = readJson<{ scripts?: Record<string, string> }>('packages/cli/package.json')
        const sharedPackage = readJson<{ scripts?: Record<string, string> }>('packages/shared/package.json')
        const registryPackage = readJson<{ scripts?: Record<string, string> }>('packages/registry/package.json')
        const docsPackage = readJson<{ scripts?: Record<string, string> }>('apps/docs/package.json')

        expect(rootPackage.scripts?.build).toBe('turbo run build:artifact')
        expect(rootPackage.scripts?.lint).toBe('turbo run lint:source')
        expect(rootPackage.scripts?.typecheck).toBe('turbo run typecheck:source')
        expect(rootPackage.scripts?.['generate:tokens']).toBe(
            'turbo run generate --filter=brutx-ui-vue --filter=brutx-vue',
        )

        expect(uiPackage.scripts?.generate).toBe('node --import tsx scripts/generate.ts')
        expect(uiPackage.scripts?.build).toBe(
            'pnpm exec turbo run build:artifact --filter=brutx-ui-vue',
        )
        expect(uiPackage.scripts?.lint).toBe(
            'pnpm exec turbo run lint:source --filter=brutx-ui-vue',
        )
        expect(uiPackage.scripts?.typecheck).toBe(
            'pnpm exec turbo run typecheck:source --filter=brutx-ui-vue',
        )
        expect(uiPackage.scripts?.prepack).toBe('pnpm build')

        expect(cliPackage.scripts?.generate).toBe('node --import tsx scripts/generate.ts')
        expect(cliPackage.scripts?.build).toBe(
            'pnpm exec turbo run build:artifact --filter=brutx-vue',
        )
        expect(cliPackage.scripts?.lint).toBe(
            'pnpm exec turbo run lint:source --filter=brutx-vue',
        )
        expect(cliPackage.scripts?.typecheck).toBe(
            'pnpm exec turbo run typecheck:source --filter=brutx-vue',
        )
        expect(cliPackage.scripts?.prebuild).toBeUndefined()
        expect(cliPackage.scripts?.prepack).toBe('pnpm build')
        expect(uiPackage.scripts?.['build:artifact']).not.toContain('generate')
        expect(cliPackage.scripts?.['build:artifact']).not.toContain('generate')

        expect(sharedPackage.scripts?.typecheck).toBe(
            'pnpm exec turbo run typecheck:source --filter=brutx-shared-vue',
        )
        expect(sharedPackage.scripts?.lint).toBe(
            'pnpm exec turbo run lint:source --filter=brutx-shared-vue',
        )
        expect(registryPackage.scripts?.build).toBe(
            'pnpm exec turbo run build:artifact --filter=brutx-registry-vue',
        )
        expect(registryPackage.scripts?.lint).toBe(
            'pnpm exec turbo run lint:source --filter=brutx-registry-vue',
        )
        expect(registryPackage.scripts?.typecheck).toBe(
            'pnpm exec turbo run typecheck:source --filter=brutx-registry-vue',
        )
        expect(docsPackage.scripts?.build).toBe(
            'pnpm exec turbo run build:artifact --filter=docs',
        )
        expect(docsPackage.scripts?.typecheck).toBe(
            'pnpm exec turbo run typecheck:source --filter=docs',
        )

        for (const script of [
            uiPackage.scripts?.['build:artifact'],
            uiPackage.scripts?.['lint:source'],
            uiPackage.scripts?.['typecheck:source'],
            cliPackage.scripts?.['build:artifact'],
            cliPackage.scripts?.['lint:source'],
            cliPackage.scripts?.['typecheck:source'],
            uiPackage.scripts?.build,
            uiPackage.scripts?.lint,
            uiPackage.scripts?.typecheck,
            cliPackage.scripts?.build,
            cliPackage.scripts?.lint,
            cliPackage.scripts?.typecheck,
            registryPackage.scripts?.build,
            registryPackage.scripts?.lint,
            registryPackage.scripts?.typecheck,
        ]) {
            expect(script ?? '').not.toContain('pnpm build:artifact')
            expect(script ?? '').not.toContain('pnpm lint:source')
            expect(script ?? '').not.toContain('pnpm typecheck:source')
        }
        for (const script of [
            uiPackage.scripts?.['build:artifact'],
            uiPackage.scripts?.['lint:source'],
            uiPackage.scripts?.['typecheck:source'],
            cliPackage.scripts?.['build:artifact'],
            cliPackage.scripts?.['lint:source'],
            cliPackage.scripts?.['typecheck:source'],
        ]) {
            expect(script ?? '').not.toContain('turbo run')
        }
    })

    it('source writers are uncached and artifact consumers own only build outputs', () => {
        const turboContent = readTurboJson()
        const generateTask = turboContent.tasks?.generate
        const artifactTask = turboContent.tasks?.['build:artifact']

        expect(generateTask?.cache).toBe(false)
        expect(generateTask?.outputs).toEqual([])
        expect(artifactTask?.dependsOn).toContain('generate')
        expect(artifactTask?.outputs).toEqual(['dist/**'])
        for (const wrapper of ['build', 'brutx-registry-vue#build', 'docs#build', 'lint', 'typecheck']) {
            expect(turboContent.tasks?.[wrapper]).toBeUndefined()
        }
        expect(artifactTask?.outputs ?? []).not.toContain('registry-manifest.json')
        expect(artifactTask?.outputs ?? []).not.toContain('exports-manifest.json')
        expect(artifactTask?.outputs ?? []).not.toContain('src/components/*/index.ts')
    })

    it('Registry and docs consume generated UI state through the artifact graph', () => {
        const turboContent = readTurboJson()
        const registryArtifact = turboContent.tasks?.['brutx-registry-vue#build:artifact']
        const docsArtifact = turboContent.tasks?.['docs#build:artifact']
        const docsTypecheck = turboContent.tasks?.['docs#typecheck:source']

        expect(registryArtifact?.cache).toBe(false)
        expect(registryArtifact?.dependsOn).toContain('brutx-ui-vue#generate')
        expect(registryArtifact?.outputs).toEqual([])
        expect(docsArtifact?.dependsOn).toContain('brutx-ui-vue#build:artifact')
        expect(docsArtifact?.outputs).toEqual(['.vitepress/dist/**'])
        expect(docsTypecheck?.dependsOn).toContain('brutx-ui-vue#build:artifact')
    })

    it('a composite graph schedules each package generator once and keeps generators uncached', () => {
        const graph = runTurboDryRun(['build:artifact', 'typecheck:source', 'lint:source'])

        for (const packageName of ['brutx-ui-vue', 'brutx-vue']) {
            const generateTaskId = `${packageName}#generate`
            expect(countTasks(graph, generateTaskId)).toBe(1)
            const generateTask = findTask(graph, generateTaskId)
            expect(generateTask.resolvedTaskDefinition.cache).toBe(false)
            expect(generateTask.resolvedTaskDefinition.outputs).toEqual([])
            expect(generateTask.command).toBe('node --import tsx scripts/generate.ts')
        }

        const uiArtifact = findTask(graph, 'brutx-ui-vue#build:artifact')
        const cliArtifact = findTask(graph, 'brutx-vue#build:artifact')
        const registryArtifact = findTask(graph, 'brutx-registry-vue#build:artifact')
        const docsArtifact = findTask(graph, 'docs#build:artifact')

        expect(uiArtifact.resolvedTaskDefinition.outputs).toEqual(['dist/**'])
        expect(cliArtifact.resolvedTaskDefinition.outputs).toEqual(['dist/**'])
        expect(registryArtifact.resolvedTaskDefinition.outputs).toEqual([])
        expect(docsArtifact.resolvedTaskDefinition.outputs).toEqual(['.vitepress/dist/**'])
        expect(uiArtifact.dependencies).toContain('brutx-ui-vue#generate')
        expect(cliArtifact.dependencies).toContain('brutx-vue#generate')
        expect(registryArtifact.dependencies).toContain('brutx-ui-vue#generate')

        for (const relativePath of [
            'api-contract.ts',
            'package.json',
            'scripts/generate.ts',
            'vite.config.ts',
            'src/styles.css',
            'src/preflight.css',
            'src/lib/utils.ts',
            'shared/src/design-tokens.ts',
        ]) {
            expectInput(uiArtifact, relativePath)
        }
        for (const relativePath of [
            'package.json',
            'scripts/generate.ts',
            'tsup.config.ts',
            'src/styles/brutalist.css',
            'src/lib/constants.ts',
            'shared/src/design-tokens.ts',
        ]) {
            expectInput(cliArtifact, relativePath)
        }
    })

    it('cold and hot generate graph runs retain uncached writers and hash mixed inputs', () => {
        const args = ['generate', '--filter=brutx-ui-vue', '--filter=brutx-vue']
        const coldGraph = runTurboDryRun(args)
        const hotGraph = runTurboDryRun(args)

        const uiGenerate = findTask(coldGraph, 'brutx-ui-vue#generate')
        const cliGenerate = findTask(coldGraph, 'brutx-vue#generate')
        const hotUiGenerate = findTask(hotGraph, 'brutx-ui-vue#generate')
        const hotCliGenerate = findTask(hotGraph, 'brutx-vue#generate')

        for (const task of [uiGenerate, cliGenerate, hotUiGenerate, hotCliGenerate]) {
            expect(task.resolvedTaskDefinition.cache).toBe(false)
            expect(task.resolvedTaskDefinition.outputs).toEqual([])
        }

        for (const relativePath of [
            'api-contract.ts',
            'package.json',
            'scripts/generate.ts',
            'src/styles.css',
            'src/preflight.css',
            'src/lib/utils.ts',
            'shared/src/design-tokens.ts',
            'shared/src/api-contract.ts',
            'shared/src/generation.ts',
            'shared/src/lock.ts',
        ]) {
            expectInput(uiGenerate, relativePath)
        }

        for (const relativePath of [
            'package.json',
            'scripts/generate.ts',
            'src/styles/brutalist.css',
            'src/lib/constants.ts',
            'shared/src/design-tokens.ts',
            'shared/src/api-contract.ts',
            'shared/src/generation.ts',
            'shared/src/lock.ts',
        ]) {
            expectInput(cliGenerate, relativePath)
        }
    }, TURBO_DRY_RUN_TEST_TIMEOUT_MS)
})
