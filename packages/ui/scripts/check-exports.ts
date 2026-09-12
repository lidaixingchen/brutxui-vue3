/**
 * CI verification: ensure the package exports and every generated public API
 * projection are in sync with the explicit UI API contract.
 *
 * Delegates to generate-exports.ts with `--check` flag (diff-only, no write).
 * Exits with code 1 if package.json exports is stale — CI gate forces
 * `pnpm prebuild:exports` to be run before commit.
 *
 * Usage: tsx scripts/check-exports.ts
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { compareGeneratedOutputs } from 'brutx-shared-vue/generation'
import {
    assertApiContractShape,
    assertApiContractSourceExports,
    assertApiExportsManifestShape,
    buildApiExportsManifest,
    buildPublicEntryContent,
} from 'brutx-shared-vue/api-contract'
import { API_CONTRACT } from '../api-contract.js'
import { collectApiContractOutputs } from './generate-api-contract.js'
import { collectComponentIndexOutputs } from './generate-component-index.js'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = resolve(__dirname, '..')
const TOP_LEVEL_SOURCE_PATTERN = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/
const TEST_SOURCE_PATTERN = /\.(?:test|spec)\.(?:ts|tsx|js|jsx)$/

function checkModuleCoverage(): void {
    const contractSources = new Set(API_CONTRACT.modules.map((module) => module.source.replace(/\\/g, '/')))
    const missingSources: string[] = []

    for (const module of API_CONTRACT.modules) {
        const absolute = resolve(PACKAGE_ROOT, module.source)
        const expectedKind = extname(module.source) ? 'file' : 'directory'
        const exists = existsSync(absolute) && (
            expectedKind === 'directory' ? statSync(absolute).isDirectory() : statSync(absolute).isFile()
        )
        if (!exists) missingSources.push(`${module.id} → ${module.source}`)
    }

    const sourceRoot = resolve(PACKAGE_ROOT, 'src')
    const composableDir = resolve(sourceRoot, 'composables')
    const directiveDir = resolve(sourceRoot, 'directives')
    for (const [directory, prefix] of [
        [composableDir, 'src/composables/'] as const,
        [directiveDir, 'src/directives/'] as const,
    ]) {
        if (!existsSync(directory)) continue
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (
                !entry.isFile() ||
                entry.name === 'index.ts' ||
                !TOP_LEVEL_SOURCE_PATTERN.test(entry.name) ||
                TEST_SOURCE_PATTERN.test(entry.name)
            ) continue
            const source = `${prefix}${entry.name}`
            if (!contractSources.has(source)) missingSources.push(`unclassified top-level module → ${source}`)
        }
    }

    const componentsDir = resolve(sourceRoot, 'components')
    if (existsSync(componentsDir)) {
        for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith('.')) continue
            const source = `src/components/${entry.name}`
            if (!contractSources.has(source)) missingSources.push(`unclassified component module → ${source}`)
        }
    }

    if (missingSources.length > 0) {
        throw new Error(
            `API contract module coverage is incomplete (${missingSources.length}):\n` +
            missingSources.map((source) => `  - ${source}`).join('\n'),
        )
    }
}

function checkApiContractProjections(): void {
    assertApiContractShape(API_CONTRACT)
    assertApiContractSourceExports(API_CONTRACT, {
        packageRoot: PACKAGE_ROOT,
        tsconfigPath: resolve(PACKAGE_ROOT, 'tsconfig.json'),
    })
    checkModuleCoverage()

    const manifestPath = resolve(PACKAGE_ROOT, 'exports-manifest.json')
    const actualManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    assertApiExportsManifestShape(actualManifest)
    const expectedManifest = buildApiExportsManifest(API_CONTRACT)
    if (JSON.stringify(actualManifest) !== JSON.stringify(expectedManifest)) {
        throw new Error('exports-manifest.json is not derived from the current API contract')
    }

    for (const entry of API_CONTRACT.entries) {
        buildPublicEntryContent(entry.exports, entry.sideEffects ?? [])
    }

    const outputs = [
        ...collectApiContractOutputs(PACKAGE_ROOT),
        ...collectComponentIndexOutputs(PACKAGE_ROOT),
    ]
    const differences = compareGeneratedOutputs(PACKAGE_ROOT, outputs)
    if (differences.length > 0) {
        console.error('✗ API contract projection files are out of sync')
        for (const difference of differences) {
            console.error(`  - ${difference.relativePath} (${difference.kind})`)
        }
        throw new Error('API contract projection check failed')
    }
    console.log(`✓ API contract projections in sync (${outputs.length} files)`)
}

checkApiContractProjections()

// Resolve tsx binary from node_modules (works in pnpm workspace)
const tsxBin = resolve(__dirname, '..', 'node_modules', '.bin', 'tsx')

const result = spawnSync(
    tsxBin,
    [resolve(__dirname, 'generate-exports.ts'), '--check'],
    {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    },
)

process.exit(result.status ?? 1)
