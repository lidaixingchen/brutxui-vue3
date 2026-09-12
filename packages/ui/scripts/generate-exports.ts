/**
 * Generate package.json `exports` from the derived API exports manifest.
 *
 * The manifest is produced from the explicit UI API contract by the unified
 * generate task. This script only projects its source/output mapping into the
 * package field, so it cannot invent a public entry from a directory scan.
 *
 * Modes:
 *   - default: writes the generated exports field (prebuild)
 *   - --verify: checks every mapped dist artifact (postbuild)
 *   - --check: compares the generated package.json content without writing
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    assertApiExportsManifestShape,
    type ApiExportsManifest,
    type ApiOutputMapping,
} from 'brutx-shared-vue/api-contract'
import {
    compareGeneratedOutputs,
    type GeneratedOutput,
    withGenerateLock,
    writeGeneratedOutputs,
} from 'brutx-shared-vue/generation'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PACKAGE_ROOT = resolve(__dirname, '..')

function readManifest(packageRoot: string): ApiExportsManifest {
    const manifestPath = resolve(packageRoot, 'exports-manifest.json')
    if (!existsSync(manifestPath)) {
        throw new Error(
            `exports-manifest.json not found at ${manifestPath}\n` +
            'Run `pnpm generate` first.',
        )
    }
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as ApiExportsManifest
    assertApiExportsManifestShape(manifest)
    return manifest
}

function renderExportTarget(output: ApiOutputMapping): string | { types: string; import: string } {
    if (!output.import) throw new Error('JavaScript output mapping is required for a package export')
    if (!output.types) return output.import
    return { types: output.types, import: output.import }
}

function buildAutoExports(manifest: ApiExportsManifest): Record<string, string | { types: string; import: string }> {
    const entries: Record<string, string | { types: string; import: string }> = {}
    for (const entry of manifest.entries) {
        entries[entry.subpath] = renderExportTarget(entry.output)
    }
    return entries
}

function verifyArtifacts(
    autoExports: Record<string, string | { types: string; import: string }>,
    manifest: ApiExportsManifest,
    packageRoot: string,
): void {
    const missing: string[] = []
    for (const entry of manifest.entries) {
        if (entry.kind === 'style') continue
        const subpath = entry.subpath
        const output = autoExports[subpath]
        if (!output) continue
        const importPath = typeof output === 'string' ? output : output.import
        const importAbs = resolve(packageRoot, importPath)
        if (!existsSync(importAbs)) missing.push(`${subpath} → ${importPath}`)
        if (typeof output !== 'string') {
            const typesAbs = resolve(packageRoot, output.types)
            if (!existsSync(typesAbs)) missing.push(`${subpath} → ${output.types}`)
        }
    }
    if (missing.length > 0) {
        throw new Error(
            `exports artifacts missing (${missing.length}):\n` +
            missing.map((item) => `  - ${item}`).join('\n') +
            '\nRun `pnpm build` to regenerate dist/.',
        )
    }
}

function buildExpectedPackageJson(
    autoExports: Record<string, string | { types: string; import: string }>,
    packageRoot: string,
): string {
    const packageJsonPath = resolve(packageRoot, 'package.json')
    const packageRaw = readFileSync(packageJsonPath, 'utf-8')
    const packageJson = JSON.parse(packageRaw) as Record<string, unknown>
    packageJson.exports = autoExports
    const suffix = packageRaw.endsWith('\n') ? '\n' : ''
    return JSON.stringify(packageJson, null, 4) + suffix
}

export function collectExportsOutput(manifest: ApiExportsManifest, packageRoot?: string): GeneratedOutput
export function collectExportsOutput(packageRoot?: string): GeneratedOutput
export function collectExportsOutput(
    manifestOrPackageRoot: ApiExportsManifest | string = PACKAGE_ROOT,
    explicitPackageRoot?: string,
): GeneratedOutput {
    const packageRoot = typeof manifestOrPackageRoot === 'string'
        ? manifestOrPackageRoot
        : explicitPackageRoot ?? PACKAGE_ROOT
    const manifest = typeof manifestOrPackageRoot === 'string'
        ? readManifest(packageRoot)
        : manifestOrPackageRoot
    assertApiExportsManifestShape(manifest)
    const autoExports = buildAutoExports(manifest)
    return {
        relativePath: 'package.json',
        content: buildExpectedPackageJson(autoExports, packageRoot),
    }
}

function runStandalone(): void {
    const args = new Set(process.argv.slice(2))
    const isVerifyMode = args.has('--verify')
    const isCheckMode = args.has('--check')
    const manifest = readManifest(PACKAGE_ROOT)
    const output = collectExportsOutput(manifest, PACKAGE_ROOT)
    const autoExports = buildAutoExports(manifest)

    if (isVerifyMode) {
        verifyArtifacts(autoExports, manifest, PACKAGE_ROOT)
        console.log(`✓ Verified ${Object.keys(autoExports).length} exports artifacts`)
        return
    }

    const differences = compareGeneratedOutputs(PACKAGE_ROOT, [output])
    if (isCheckMode) {
        if (differences.length === 0) {
            console.log('✓ package.json exports in sync')
            return
        }
        console.error('✗ package.json exports is out of sync with exports-manifest.json.')
        for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`)
        throw new Error('UI exports 生成检查失败')
    }

    writeGeneratedOutputs(PACKAGE_ROOT, [output])
    console.log(`✓ Wrote ${Object.keys(autoExports).length} exports entries to package.json`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
    const isReadOnly = process.argv.includes('--check') || process.argv.includes('--verify')
    const runPromise = isReadOnly
        ? Promise.resolve().then(runStandalone)
        : withGenerateLock(
            { packageName: 'brutx-ui-vue', cacheDir: resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            runStandalone,
        )
    runPromise.catch((error) => {
        console.error(error)
        process.exit(1)
    })
}
