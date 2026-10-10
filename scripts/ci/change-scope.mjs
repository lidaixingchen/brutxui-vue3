import { appendFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const CHANGE_SCOPE_FIELDS = Object.freeze([
    'full',
    'ui',
    'cli',
    'registry',
    'docs',
    'site',
    'generated',
    'tooling',
    'release',
    'browser',
    'consumers',
    'cost',
])

const ROOT_FULL_PATHS = new Set([
    '.browserslistrc',
    '.gitattributes',
    '.gitignore',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'turbo.json',
    '.github/workflows/ci.yml',
])

const ROOT_DOCUMENT_PATHS = new Set([
    'AGENTS.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'README.md',
])

const BUTTON_COST_PATHS = new Set([
    'packages/shared/src/api-contract.ts',
    'packages/shared/src/design-tokens.ts',
    'packages/ui/api-contract.ts',
    'packages/ui/exports-manifest.json',
    'packages/ui/package.json',
    'packages/ui/perf/cost-profile.ts',
    'packages/ui/perf/cost-runner.ts',
    'packages/ui/perf/fixtures/consumer-lock.yaml',
    'packages/ui/src/components/button/index.ts',
    'packages/ui/src/composables/useGlitchEffect.ts',
    'packages/ui/src/composables/useLocale.ts',
    'packages/ui/src/composables/useReducedMotion.ts',
    'packages/ui/src/index.ts',
    'packages/ui/src/lib/brutal-interaction-variants.ts',
    'packages/ui/src/lib/defaults.ts',
    'packages/ui/src/lib/env.ts',
    'packages/ui/src/lib/icon-size-variants.ts',
    'packages/ui/src/lib/utils.ts',
    'packages/ui/src/locales/en.ts',
    'packages/ui/src/locales/index.ts',
    'packages/ui/src/locales/types.ts',
    'packages/ui/src/locales/zh-CN.ts',
    'packages/ui/src/preflight.css',
    'packages/ui/src/styles.css',
    'packages/ui/vite.config.ts',
    'packages/ui/scripts/generate-component-index.ts',
    'packages/ui/scripts/generate-api-contract.ts',
    'packages/ui/scripts/generate-exports.ts',
    'packages/ui/scripts/generate-styles-tokens.ts',
    'packages/ui/scripts/generate.ts',
])

const GENERATED_OUTPUT_PATHS = new Set([
    'packages/cli/src/lib/constants.ts',
    'packages/cli/src/styles/brutalist.css',
    'packages/ui/exports-manifest.json',
    'packages/ui/registry-manifest.json',
    'packages/ui/src/index.ts',
    'packages/ui/src/lib/utils.ts',
    'packages/ui/src/preflight.css',
    'packages/ui/src/styles.css',
])

const GENERATED_ENTRY_PATTERN = /^packages\/ui\/src\/components\/[^/]+\/index\.ts$/u
const UI_API_GENERATOR_PATHS = new Set([
    'packages/ui/scripts/generate-api-catalog.ts',
    'packages/ui/scripts/generate-component-api.ts',
    'packages/ui/scripts/api-docs/catalog.ts',
    'packages/ui/scripts/api-docs/extract.ts',
    'packages/ui/scripts/api-docs/merge.ts',
])

const GITHUB_WORKFLOW_SCOPES = new Map([
    ['.github/workflows/bench.yml', ['tooling']],
    ['.github/workflows/deploy-docs.yml', ['docs', 'site', 'tooling']],
    ['.github/workflows/publish.yml', ['release', 'tooling']],
])

function emptyFlags() {
    return Object.fromEntries(CHANGE_SCOPE_FIELDS.map(field => [field, false]))
}

function mark(flags, ...fields) {
    for (const field of fields) flags[field] = true
}

function markFull(flags) {
    for (const field of CHANGE_SCOPE_FIELDS) flags[field] = true
}

function isWithin(file, directory) {
    return file === directory || file.startsWith(`${directory}/`)
}

function isTestPath(file) {
    return /(?:^|\/)(?:tests?|__tests__)\//u.test(file)
        || /\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(file)
}

function isSourcePath(file) {
    return /\.(?:[cm]?[jt]sx?|vue|css)$/u.test(file)
}

function normalizePath(file) {
    if (typeof file !== 'string') throw new TypeError('变更路径必须是字符串')
    const path = file.replaceAll('\\', '/')
    return path.startsWith('./') ? path.replace(/^(?:\.\/)+/u, '') : path
}

export function normalizeGitChangePaths(paths) {
    if (!Array.isArray(paths)) throw new TypeError('变更路径必须是数组')
    return [...new Set(paths.map(normalizePath).filter(path => path !== '' && path !== '.'))].sort()
}

function markSharedClosure(flags) {
    mark(flags, 'ui', 'cli', 'registry', 'docs', 'site', 'generated', 'browser', 'consumers')
}

function classifyUiPath(file, flags) {
    mark(flags, 'ui')

    if (isWithin(file, 'packages/ui/docs')) {
        mark(flags, 'docs')
        return
    }

    if (file === 'packages/ui/api-contract.ts') {
        mark(flags, 'browser', 'generated', 'consumers', 'registry', 'docs', 'site', 'cost')
        return
    }

    if (file === 'packages/ui/package.json') {
        mark(flags, 'browser', 'generated', 'consumers', 'cost')
        return
    }

    if (file === 'packages/ui/registry-manifest.json') {
        mark(flags, 'registry', 'generated', 'consumers')
        return
    }

    if (file === 'packages/ui/exports-manifest.json' || file === 'packages/ui/src/index.ts' || GENERATED_ENTRY_PATTERN.test(file)) {
        mark(flags, 'generated', 'consumers', 'browser', 'cost')
        return
    }

    if (isWithin(file, 'packages/ui/src')) {
        if (isTestPath(file)) {
            if (/\.browser\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(file)) mark(flags, 'browser')
            return
        }

        mark(flags, 'browser', 'generated', 'consumers')
        if (isWithin(file, 'packages/ui/src/components') && file.endsWith('.vue')) {
            mark(flags, 'docs', 'site')
        }
        if (isButtonCostSource(file)) mark(flags, 'cost')
        return
    }

    if (isWithin(file, 'packages/ui/scripts')) {
        mark(flags, 'tooling')
        if (GENERATED_OUTPUT_PATHS.has(file) || /\/generate-[^/]+\.[cm]?[jt]sx?$/u.test(file) || file.endsWith('/generate.ts')) {
            mark(flags, 'generated')
        }
        if (
            file.includes('/api-contract')
            || file.includes('/api-module-coverage')
            || file.endsWith('/check-exports.ts')
        ) {
            mark(flags, 'generated', 'consumers')
        }
        if ([
            'packages/ui/scripts/generate-api-contract.ts',
            'packages/ui/scripts/generate-component-index.ts',
            'packages/ui/scripts/generate-exports.ts',
            'packages/ui/scripts/generate-styles-tokens.ts',
            'packages/ui/scripts/generate.ts',
            'packages/ui/scripts/prebuild-scan.ts',
        ].includes(file)) {
            mark(flags, 'browser', 'consumers')
        }
        if (UI_API_GENERATOR_PATHS.has(file) && !isTestPath(file)) {
            mark(flags, 'generated', 'docs', 'site')
        }
        if (
            isWithin(file, 'packages/ui/scripts/api-docs')
            || file === 'packages/ui/scripts/api-manifest.test.ts'
            || file === 'packages/ui/scripts/api-page.test.ts'
        ) {
            mark(flags, 'docs', 'site')
        }
        if (BUTTON_COST_PATHS.has(file)) mark(flags, 'cost')
        return
    }

    if (isWithin(file, 'packages/ui/perf')) {
        mark(flags, 'tooling')
        if (BUTTON_COST_PATHS.has(file)) mark(flags, 'cost')
        return
    }

    if (file === 'packages/ui/vitest.config.ts' || file === 'packages/ui/playwright.config.ts') {
        mark(flags, 'tooling', 'browser')
        return
    }

    if (file === 'packages/ui/vite.config.ts') {
        mark(flags, 'generated', 'consumers', 'browser', 'cost')
        return
    }

    if (file.endsWith('.md') || file.endsWith('.mdx')) {
        mark(flags, 'docs')
        return
    }

    if (isWithin(file, 'packages/ui')) {
        mark(flags, 'tooling')
        return
    }
}

function isButtonCostSource(file) {
    if (!isSourcePath(file) || isTestPath(file)) return false
    return isWithin(file, 'packages/ui/src/components/button') || BUTTON_COST_PATHS.has(file)
}

function classifyCliPath(file, flags) {
    mark(flags, 'cli')
    if (isTestPath(file) || isWithin(file, 'packages/cli/scripts')) mark(flags, 'tooling')
    if (isWithin(file, 'packages/cli/src') && !isTestPath(file)) mark(flags, 'consumers')
    if (GENERATED_OUTPUT_PATHS.has(file) || file === 'packages/cli/scripts/generate-tokens.ts') {
        mark(flags, 'generated', 'consumers')
    }
    if (file.endsWith('.md') || file.endsWith('.mdx')) mark(flags, 'docs')
}

function classifyRegistryPath(file, flags) {
    mark(flags, 'registry')
    if (isTestPath(file)) {
        mark(flags, 'tooling')
        return
    }
    if (file.endsWith('.md') || file.endsWith('.mdx')) {
        mark(flags, 'docs')
        return
    }
    mark(flags, 'cli', 'consumers', 'generated')
    if (isWithin(file, 'packages/registry/scripts')) mark(flags, 'tooling')
}

function classifySharedPath(file, flags) {
    if (isWithin(file, 'packages/shared/docs') || file.endsWith('.md') || file.endsWith('.mdx')) {
        mark(flags, 'docs')
        return
    }
    if (isTestPath(file)) {
        mark(flags, 'tooling')
        return
    }

    markSharedClosure(flags)
    if (file === 'packages/shared/src/design-tokens.ts') mark(flags, 'cost')
    if (file === 'packages/shared/src/component-metadata.ts' || file === 'packages/shared/src/api-contract.ts') {
        mark(flags, 'docs', 'site')
    }
}

function classifyScriptPath(file, flags) {
    mark(flags, 'tooling')

    if (isWithin(file, 'scripts/ci')) {
        markFull(flags)
        return
    }

    if (isWithin(file, 'scripts/release')) {
        mark(flags, 'release')
        return
    }

    if (isWithin(file, 'scripts/docs') || /^scripts\/(?:check-doc|check-guide-refs|check-i18n)/u.test(file)) {
        mark(flags, 'docs')
        return
    }

    if (isWithin(file, 'scripts/generation')) {
        mark(flags, 'generated')
        if (file.endsWith('/watch-docs-api.mjs') || file.endsWith('/watch-docs-api.test.mjs')) {
            mark(flags, 'docs', 'site')
        }
        if (file.endsWith('/check-staged-snapshot.mjs') || file.endsWith('/check-staged-snapshot.test.mjs')) {
            mark(flags, 'ui', 'cli', 'docs', 'generated')
        }
        return
    }

    if (isWithin(file, 'scripts/contracts') || file === 'scripts/check-contracts-all.mjs') {
        mark(flags, 'ui', 'cli', 'registry', 'generated', 'consumers')
        return
    }

    if (isWithin(file, 'scripts/testing')) {
        mark(flags, 'consumers')
        return
    }

    if (file === 'scripts/bench-diff.mjs' || isWithin(file, 'scripts')) return
}

function classifyPath(file, flags) {
    if (ROOT_FULL_PATHS.has(file)) {
        markFull(flags)
        return true
    }

    if (isWithin(file, '.github/workflows')) {
        if (GITHUB_WORKFLOW_SCOPES.has(file)) {
            mark(flags, ...GITHUB_WORKFLOW_SCOPES.get(file))
            return true
        }
        markFull(flags)
        return true
    }

    if (isWithin(file, 'scripts/ci')) {
        mark(flags, 'tooling')
        markFull(flags)
        return true
    }

    if (file === '.github/dependabot.yml' || isWithin(file, '.husky') || file === 'commitlint.config.mjs') {
        mark(flags, 'tooling')
        return true
    }

    if (file === '.github/PULL_REQUEST_TEMPLATE.md' || file === '.github/copilot-instructions.md') {
        mark(flags, 'docs')
        return true
    }

    if (isWithin(file, '.github')) {
        markFull(flags)
        return true
    }

    if (isWithin(file, '.changeset')) {
        mark(flags, 'release')
        return true
    }

    if (file === 'CHANGELOG.md') {
        mark(flags, 'docs', 'release')
        return true
    }

    if (ROOT_DOCUMENT_PATHS.has(file)) {
        mark(flags, 'docs')
        return true
    }

    if (file === 'vercel.json') {
        mark(flags, 'docs', 'site', 'tooling')
        return true
    }

    if (isWithin(file, 'docs') || isWithin(file, 'skills')) {
        mark(flags, 'docs')
        return true
    }

    if (isWithin(file, 'apps/docs')) {
        mark(flags, 'docs', 'site')
        if (isWithin(file, 'apps/docs/.vitepress/api-generated')) mark(flags, 'generated')
        return true
    }

    if (isWithin(file, 'packages/shared')) {
        classifySharedPath(file, flags)
        return true
    }

    if (isWithin(file, 'packages/ui')) {
        classifyUiPath(file, flags)
        return true
    }

    if (isWithin(file, 'packages/cli')) {
        classifyCliPath(file, flags)
        return true
    }

    if (isWithin(file, 'packages/registry')) {
        classifyRegistryPath(file, flags)
        return true
    }

    if (isWithin(file, 'packages')) {
        markFull(flags)
        return true
    }

    if (isWithin(file, 'apps')) {
        markFull(flags)
        return true
    }

    if (isWithin(file, 'scripts')) {
        classifyScriptPath(file, flags)
        return true
    }

    if (file.startsWith('.') || !file.includes('/')) {
        if (file === 'README.md' || file === 'CONTRIBUTING.md' || file === 'LICENSE' || file === 'AGENTS.md') {
            mark(flags, 'docs')
        } else if (file === 'commitlint.config.mjs') {
            mark(flags, 'tooling')
        } else {
            markFull(flags)
        }
        return true
    }

    markFull(flags)
    return true
}

export function classifyGitChangePaths(paths) {
    const normalizedPaths = normalizeGitChangePaths(paths)
    const flags = emptyFlags()

    if (normalizedPaths.length === 0) markFull(flags)
    for (const file of normalizedPaths) classifyPath(file, flags)
    if (flags.full) markFull(flags)

    return flags
}

function runGit(args, cwd) {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function resolveCommit(ref, cwd) {
    if (!ref || ref.startsWith('-')) throw new Error('必须为 --base 和 --head 提供有效的 Git 提交或引用')
    return runGit(['rev-parse', '--verify', `${ref}^{commit}`], cwd)
}

export function readGitChangePaths({ base, head, diffMode = 'merge-base', cwd = process.cwd() }) {
    if (!['merge-base', 'direct'].includes(diffMode)) {
        throw new Error('--diff-mode 只能是 merge-base 或 direct')
    }
    const baseCommit = resolveCommit(base, cwd)
    const headCommit = resolveCommit(head, cwd)
    const comparisonBase = diffMode === 'merge-base'
        ? runGit(['merge-base', baseCommit, headCommit], cwd)
        : baseCommit
    const output = execFileSync('git', [
        'diff',
        '--name-only',
        '--no-renames',
        '-z',
        comparisonBase,
        headCommit,
        '--',
    ], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return normalizeGitChangePaths(output.split('\0'))
}

function parseArguments(argv) {
    const options = { base: '', head: '', diffMode: 'merge-base' }
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index]
        if (argument === '--base') options.base = argv[++index] ?? ''
        else if (argument === '--head') options.head = argv[++index] ?? ''
        else if (argument === '--diff-mode') options.diffMode = argv[++index] ?? ''
        else if (argument === '--help') return { help: true }
        else throw new Error(`未知参数：${argument}`)
    }
    if (!options.base || !options.head) throw new Error('必须明确传入 --base 和 --head')
    return options
}

function writeGitHubOutputs(flags) {
    const outputFile = process.env.GITHUB_OUTPUT
    if (!outputFile) return
    const lines = CHANGE_SCOPE_FIELDS.map(field => `${field}=${String(flags[field])}`)
    lines.push(`json=${JSON.stringify(flags)}`)
    appendFileSync(outputFile, `${lines.join('\n')}\n`)
}

function printUsage() {
    console.log('用法：node scripts/ci/change-scope.mjs --base <ref> --head <ref> [--diff-mode merge-base|direct]')
}

function main(argv) {
    const options = parseArguments(argv)
    if (options.help) {
        printUsage()
        return
    }
    const paths = readGitChangePaths(options)
    const flags = classifyGitChangePaths(paths)
    writeGitHubOutputs(flags)
    console.log(JSON.stringify(flags, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        main(process.argv.slice(2))
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(message)
        process.exitCode = 1
    }
}
