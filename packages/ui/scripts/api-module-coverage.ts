import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import type { ApiContract } from 'brutx-shared-vue/api-contract'
import type { GeneratedOutput } from 'brutx-shared-vue/generation'

type ModuleInventory = Pick<ApiContract, 'modules'>
type GeneratedOutputPath = Pick<GeneratedOutput, 'relativePath' | 'allowMissing'>

const TOP_LEVEL_SOURCE_PATTERN = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/
const TEST_SOURCE_PATTERN = /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/

function normalizeRelativePath(value: string): string {
    return path.posix.normalize(value.replace(/\\/g, '/'))
}

function containsOutput(moduleSource: string, generatedOutputs: readonly GeneratedOutputPath[]): boolean {
    const normalizedSource = normalizeRelativePath(moduleSource)
    return generatedOutputs.some(({ relativePath, allowMissing }) => {
        const normalizedOutput = normalizeRelativePath(relativePath)
        return allowMissing === true && (
            normalizedOutput === normalizedSource || normalizedOutput.startsWith(`${normalizedSource}/`)
        )
    })
}

export function collectApiModuleCoverageIssues(
    contract: ModuleInventory,
    packageRoot: string,
    generatedOutputs: readonly GeneratedOutputPath[] = [],
): string[] {
    const contractSources = new Set(contract.modules.map((module) => normalizeRelativePath(module.source)))
    const missingSources: string[] = []

    for (const module of contract.modules) {
        const absolute = path.resolve(packageRoot, module.source)
        const expectedKind = path.extname(module.source) ? 'file' : 'directory'
        const exists = existsSync(absolute) && (
            expectedKind === 'directory' ? statSync(absolute).isDirectory() : statSync(absolute).isFile()
        )
        if (!exists && !containsOutput(module.source, generatedOutputs)) {
            missingSources.push(`${module.id} → ${module.source}`)
        }
    }

    const sourceRoot = path.resolve(packageRoot, 'src')
    const sourceDirectories = [
        [path.resolve(sourceRoot, 'composables'), 'src/composables'] as const,
        [path.resolve(sourceRoot, 'directives'), 'src/directives'] as const,
    ]
    for (const [directory, prefix] of sourceDirectories) {
        if (!existsSync(directory)) continue
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (
                !entry.isFile() ||
                entry.name === 'index.ts' ||
                !TOP_LEVEL_SOURCE_PATTERN.test(entry.name) ||
                TEST_SOURCE_PATTERN.test(entry.name)
            ) continue
            const source = normalizeRelativePath(path.posix.join(prefix, entry.name))
            if (!contractSources.has(source)) missingSources.push(`unclassified top-level module → ${source}`)
        }
    }

    const componentsDirectory = path.resolve(sourceRoot, 'components')
    if (existsSync(componentsDirectory)) {
        for (const entry of readdirSync(componentsDirectory, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue
            const source = normalizeRelativePath(path.posix.join('src/components', entry.name))
            if (!contractSources.has(source)) missingSources.push(`unclassified component module → ${source}`)
        }
    }

    return missingSources
}

export function assertApiModuleCoverage(
    contract: ModuleInventory,
    packageRoot: string,
    generatedOutputs: readonly GeneratedOutputPath[] = [],
): void {
    const missingSources = collectApiModuleCoverageIssues(contract, packageRoot, generatedOutputs)
    if (missingSources.length === 0) return
    throw new Error(
        `API contract module coverage is incomplete (${missingSources.length}):\n` +
        missingSources.map((source) => `  - ${source}`).join('\n'),
    )
}
