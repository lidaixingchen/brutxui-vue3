/**
 * Generate package.json `exports` field from exports-manifest.json.
 *
 * Reads `exports-manifest.json` (flat list of components/composables/directives)
 * and merges auto-generated subpath entries into `package.json` `exports`.
 *
 * Manual keys (preserved as-is from existing package.json):
 *   - `.`                    main entry
 *   - `./style.css`          CSS canonical name (only alias kept)
 *   - `./preflight.css`      standalone preflight artifact (not a styles.css alias)
 *   - `./locales`            i18n aggregate data entry
 *
 * All other keys are auto-generated. Stale keys (not in MANUAL + not auto)
 * cause an error — they must be cleaned up explicitly.
 *
 * Modes:
 *   - default: writes merged exports to package.json (prebuild)
 *   - --verify: also checks dist/* artifact existence (postbuild)
 *   - --check: diff-only mode for CI (see check-exports.ts)
 *
 * Usage:
 *   tsx scripts/generate-exports.ts             # prebuild: write
 *   tsx scripts/generate-exports.ts --verify    # postbuild: verify artifacts
 *   tsx scripts/generate-exports.ts --check     # CI: diff-only check
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ExportsManifest {
    components: string[]
    composables: string[]
    directives: string[]
}

interface ExportEntry {
    types: string
    import: string
}

const PACKAGE_ROOT = resolve(__dirname, '..')
const MANIFEST_PATH = resolve(PACKAGE_ROOT, 'exports-manifest.json')
const PACKAGE_JSON_PATH = resolve(PACKAGE_ROOT, 'package.json')

// Manual subpath keys that are NOT auto-generated.
// i18n is aggregate data (all locales flattened), kept as single entry.
// ./preflight.css points to standalone dist/preflight.css artifact (not a styles.css alias).
const MANUAL_EXPORTS_KEYS = [
    '.',
    './style.css',
    './preflight.css',
    './locales',
] as const

function buildEntry(distRel: string): ExportEntry {
    return {
        types: `./dist/${distRel}.d.ts`,
        import: `./dist/${distRel}.js`,
    }
}

function readManifest(): ExportsManifest {
    if (!existsSync(MANIFEST_PATH)) {
        throw new Error(
            `exports-manifest.json not found at ${MANIFEST_PATH}\n` +
            'Run `pnpm prebuild:scan` first.',
        )
    }
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'))
}

function buildAutoExports(manifest: ExportsManifest): Record<string, ExportEntry> {
    const entries: Record<string, ExportEntry> = {}

    // 1. Component subpaths: ./button → dist/components/button/index
    for (const component of manifest.components) {
        entries[`./${component}`] = buildEntry(`components/${component}/index`)
    }

    // 2. Composable subpaths: ./useToast → dist/composables/useToast
    for (const composable of manifest.composables) {
        const name = composable.replace(/\.ts$/, '')
        entries[`./${name}`] = buildEntry(`composables/${name}`)
    }

    // 3. Directive subpaths: ./loading → dist/directives/loading
    for (const directive of manifest.directives) {
        const name = directive.replace(/\.ts$/, '')
        entries[`./${name}`] = buildEntry(`directives/${name}`)
    }

    return entries
}

function verifyArtifacts(autoExports: Record<string, ExportEntry>): void {
    const missing: string[] = []
    for (const [subpath, entry] of Object.entries(autoExports)) {
        const importAbs = resolve(PACKAGE_ROOT, entry.import)
        if (!existsSync(importAbs)) {
            missing.push(`${subpath} → ${entry.import}`)
        }
    }
    if (missing.length > 0) {
        throw new Error(
            `exports artifacts missing (${missing.length}):\n` +
            missing.map(m => `  - ${m}`).join('\n') +
            '\nRun `pnpm build` to regenerate dist/.',
        )
    }
}

function mergeAndWrite(autoExports: Record<string, ExportEntry>, dryRun: boolean): void {
    const pkgRaw = readFileSync(PACKAGE_JSON_PATH, 'utf-8')
    const pkg = JSON.parse(pkgRaw)
    const existingExports: Record<string, unknown> = pkg.exports ?? {}

    const merged: Record<string, unknown> = {}

    // Preserve manual keys (with their existing values)
    for (const key of MANUAL_EXPORTS_KEYS) {
        if (key in existingExports) {
            merged[key] = existingExports[key]
        }
    }

    // Auto-generated keys
    for (const [key, value] of Object.entries(autoExports)) {
        merged[key] = value
    }

    // Stale key detection — any key not in MANUAL and not in auto is an error
    const knownKeys = new Set<string>([...MANUAL_EXPORTS_KEYS, ...Object.keys(autoExports)])
    const staleKeys = Object.keys(existingExports).filter(k => !knownKeys.has(k))
    if (staleKeys.length > 0) {
        throw new Error(
            `exports contains stale subpaths that must be removed:\n` +
            staleKeys.map(k => `  - ${k}`).join('\n') +
            '\nThese are deprecated and intentionally not preserved. If a subpath truly ' +
            'must be kept, add it to MANUAL_EXPORTS_KEYS with justification.',
        )
    }

    if (dryRun) {
        // CI diff mode: compare merged vs existing
        const existingJson = JSON.stringify(existingExports, null, 4)
        const mergedJson = JSON.stringify(merged, null, 4)
        if (existingJson !== mergedJson) {
            console.error('package.json exports is out of sync with exports-manifest.json.')
            console.error('Run `pnpm prebuild:exports` to regenerate.')
            console.error('Diff (existing → expected):')
            console.error(`--- existing\n${existingJson}\n--- expected\n${mergedJson}\n---`)
            process.exit(1)
        }
        console.log(`✓ exports in sync (${Object.keys(merged).length} entries)`)
        return
    }

    pkg.exports = merged
    // Preserve trailing newline style consistent with existing file
    const suffix = pkgRaw.endsWith('\n') ? '\n' : ''
    writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 4) + suffix, 'utf-8')
    console.log(`✓ Wrote ${Object.keys(merged).length} exports entries to package.json`)
}

function main(): void {
    const args = new Set(process.argv.slice(2))
    const isVerifyMode = args.has('--verify')
    const isCheckMode = args.has('--check')

    const manifest = readManifest()
    const autoExports = buildAutoExports(manifest)

    if (isVerifyMode) {
        verifyArtifacts(autoExports)
        console.log(`✓ Verified ${Object.keys(autoExports).length} export artifacts exist in dist/`)
        return
    }

    if (isCheckMode) {
        mergeAndWrite(autoExports, true)
        return
    }

    mergeAndWrite(autoExports, false)
}

main()
