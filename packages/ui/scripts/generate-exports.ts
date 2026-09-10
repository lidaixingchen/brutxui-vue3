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
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

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

// 手工 key 的期望 exports 值（与 package.json 现值逐字比对）。
// 这些 key 不与任何组件/组合式函数对应，由 generate-exports 保留原样，
// 故 --verify 需单独校验它们的存在性与指向，防止手工维护时漏改/错改。
const MANUAL_EXPORTS_EXPECTED: Record<(typeof MANUAL_EXPORTS_KEYS)[number], string | ExportEntry> = {
    '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
    },
    './style.css': './dist/styles.css',
    './preflight.css': './dist/preflight.css',
    './locales': {
        types: './dist/locales.d.ts',
        import: './dist/locales.js',
    },
}

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

function manualEntryMatches(actual: unknown, expected: string | ExportEntry): boolean {
    if (typeof expected === 'string') return actual === expected
    if (typeof actual !== 'object' || actual === null) return false
    const entry = actual as Record<string, unknown>
    // 此处已由 typeof expected === 'string' 收窄为 ExportEntry；断言为索引签名以支持按 key 取值
    const expectedEntry = expected as unknown as Record<string, unknown>
    const expectedKeys = Object.keys(expectedEntry)
    // 完整比对字段集合与每个值：仅比 types/import 会漏掉误加的 default/require 等条件字段（静默通过）
    return (
        Object.keys(entry).length === expectedKeys.length &&
        expectedKeys.every((key) => entry[key] === expectedEntry[key])
    )
}

function verifyManualExports(pkgExports: Record<string, unknown>): void {
    const problems: string[] = []
    for (const key of MANUAL_EXPORTS_KEYS) {
        const expected = MANUAL_EXPORTS_EXPECTED[key]
        const actual = pkgExports[key]
        if (actual === undefined) {
            problems.push(`${key} is missing from package.json exports`)
            continue
        }
        if (!manualEntryMatches(actual, expected)) {
            problems.push(`${key} points to ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
        }
    }
    if (problems.length > 0) {
        throw new Error(
            `manual exports keys are invalid (${problems.length}):\n` +
            problems.map(p => `  - ${p}`).join('\n'),
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

/**
 * 组件主入口导出核对：
 * exports-manifest 中的每个组件都必须在 src/index.ts 有对应 re-export，
 * 否则新增组件会静默丢失主入口 API（子路径存在但主入口不可用）。
 * 有意不挂主入口的组件须登记于 SKIP_MAIN_ENTRY_COMPONENTS 并注明理由。
 */
const SKIP_MAIN_ENTRY_COMPONENTS: Record<string, string> = {
    // MessageContainer 是 useMessage 命令式单例的内部实现（docs components/message.md：
    // 自动挂载、无需手动声明），仅经 ./message 子路径暴露，不进入主入口 API 面
    message: '命令式单例内部组件（useMessage 自动挂载），文档化用法为函数式 API',
}

function getCoveredMainEntryEntities(indexSrc: string): { components: Set<string>; composables: Set<string> } {
    const sourceFile = ts.createSourceFile(
        'index.ts',
        indexSrc,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    )

    const components = new Set<string>()
    const composables = new Set<string>()

    for (const stmt of sourceFile.statements) {
        if (!ts.isExportDeclaration(stmt)) continue
        if (stmt.isTypeOnly) continue
        if (!stmt.moduleSpecifier || !ts.isStringLiteral(stmt.moduleSpecifier)) continue

        const specifier = stmt.moduleSpecifier.text

        if (specifier.startsWith('./components/')) {
            const rel = specifier.slice('./components/'.length)
            const parts = rel.split('/')
            const compName = parts[0]
            if (!compName) continue

            // 仅整目录 barrel、index 或 .vue 组件文件重导出算组件覆盖；子路径（如 variants .ts）不算
            if (parts.length === 1) {
                components.add(compName)
            } else if (parts.length === 2 && (parts[1]?.endsWith('.vue') || parts[1]?.startsWith('index'))) {
                components.add(compName)
            }
        } else if (specifier.startsWith('./composables/')) {
            const rel = specifier.slice('./composables/'.length)
            const name = rel.replace(/\.ts$/, '')
            if (name) {
                composables.add(name)
            }
        }
    }

    return { components, composables }
}

function verifyMainEntryCoverage(manifest: ExportsManifest): void {
    const indexPath = resolve(PACKAGE_ROOT, 'src', 'index.ts')
    const indexSrc = readFileSync(indexPath, 'utf-8')
    const { components, composables } = getCoveredMainEntryEntities(indexSrc)
    const missingComponents: string[] = []

    for (const component of manifest.components) {
        if (component in SKIP_MAIN_ENTRY_COMPONENTS) continue
        if (!components.has(component)) {
            missingComponents.push(component)
        }
    }

    if (missingComponents.length > 0) {
        throw new Error(
            `components missing from main entry src/index.ts (${missingComponents.length}):\n` +
            missingComponents.map((m) => `  - ${m}`).join('\n') +
            '\nAdd a re-export in src/index.ts, or register in SKIP_MAIN_ENTRY_COMPONENTS with justification.',
        )
    }

    const missingComposables: string[] = []
    for (const composable of manifest.composables) {
        const name = composable.replace(/\.ts$/, '')
        if (!composables.has(name)) {
            missingComposables.push(name)
        }
    }

    if (missingComposables.length > 0) {
        throw new Error(
            `composables missing from main entry src/index.ts (${missingComposables.length}):\n` +
            missingComposables.map((m) => `  - ${m}`).join('\n') +
            '\nAdd a re-export in src/index.ts.',
        )
    }

    const coveredCount = manifest.components.length - Object.keys(SKIP_MAIN_ENTRY_COMPONENTS).length
    console.log(`✓ All ${coveredCount} required manifest components and ${manifest.composables.length} composables re-exported from src/index.ts`)
}

/** 与 prebuild-scan.ts 保持一致的采集规则：components 目录全量（排除隐藏/测试目录），
 *  composables/directives 取非测试、非 index.ts 的 .ts 文件 */
const IGNORED_DIR_NAMES = new Set(['node_modules', '__tests__', '__snapshots__'])
const TEST_FILE_PATTERN = /\.(test|spec)\.(ts|js|tsx|jsx)$/

function listPublicSourceFiles(dir: string): string[] {
    if (!existsSync(dir)) return []
    const result: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isFile()) continue
        if (TEST_FILE_PATTERN.test(entry.name)) continue
        if (entry.name === 'index.ts') continue
        if (entry.name.endsWith('.ts')) result.push(entry.name)
    }
    return result.sort()
}

/**
 * 清单新鲜度核对：反向核对「源码 ⊆ manifest」，确保源码目录变动及时同步。
 */
function verifyManifestFreshness(manifest: ExportsManifest): void {
    const componentsDir = resolve(PACKAGE_ROOT, 'src', 'components')
    if (!existsSync(componentsDir)) {
        throw new Error(`components 目录不存在：${componentsDir}（manifest 新鲜度核对无法进行）`)
    }
    const sourceComponents = readdirSync(componentsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((name) => !name.startsWith('.') && !IGNORED_DIR_NAMES.has(name))
        .sort()
    const sourceComposables = listPublicSourceFiles(resolve(PACKAGE_ROOT, 'src', 'composables'))
    const sourceDirectives = listPublicSourceFiles(resolve(PACKAGE_ROOT, 'src', 'directives'))

    const manifestComponents = new Set(manifest.components)
    const manifestComposables = new Set(manifest.composables)
    const manifestDirectives = new Set(manifest.directives)

    const missingComponents = sourceComponents.filter((c) => !manifestComponents.has(c))
    const missingComposables = sourceComposables.filter((c) => !manifestComposables.has(c))
    const missingDirectives = sourceDirectives.filter((c) => !manifestDirectives.has(c))

    if (missingComponents.length + missingComposables.length + missingDirectives.length > 0) {
        throw new Error(
            'exports-manifest.json is stale — new source files are missing from it:\n' +
            [
                ...missingComponents.map((m) => `  component: ${m}`),
                ...missingComposables.map((m) => `  composable: ${m}`),
                ...missingDirectives.map((m) => `  directive: ${m}`),
            ].join('\n') +
            '\nRun `pnpm prebuild:scan` to regenerate exports-manifest.json.',
        )
    }
    console.log(
        `✓ exports-manifest.json fresh (${sourceComponents.length} components, ${sourceComposables.length} composables, ${sourceDirectives.length} directives)`,
    )
}

function main(): void {
    const args = new Set(process.argv.slice(2))
    const isVerifyMode = args.has('--verify')
    const isCheckMode = args.has('--check')

    const manifest = readManifest()
    verifyMainEntryCoverage(manifest)
    verifyManifestFreshness(manifest)
    const autoExports = buildAutoExports(manifest)

    if (isVerifyMode) {
        verifyArtifacts(autoExports)
        const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'))
        verifyManualExports((pkg.exports ?? {}) as Record<string, unknown>)
        console.log(`✓ Verified ${Object.keys(autoExports).length} auto export artifacts and ${MANUAL_EXPORTS_KEYS.length} manual keys in package.json`)
        return
    }

    if (isCheckMode) {
        mergeAndWrite(autoExports, true)
        return
    }

    mergeAndWrite(autoExports, false)
}

main()
