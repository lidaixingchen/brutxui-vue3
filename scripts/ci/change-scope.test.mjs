import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { CHANGE_SCOPE_FIELDS, classifyGitChangePaths, normalizeGitChangePaths } from './change-scope.mjs'

const SCRIPT_PATH = fileURLToPath(new URL('./change-scope.mjs', import.meta.url))

function expectedFlags(...enabled) {
    const flags = Object.fromEntries(CHANGE_SCOPE_FIELDS.map(field => [field, false]))
    for (const field of enabled) flags[field] = true
    return flags
}

function allFlags() {
    return Object.fromEntries(CHANGE_SCOPE_FIELDS.map(field => [field, true]))
}

test('normalizes Git paths and deduplicates old and new rename paths', () => {
    assert.deepEqual(
        normalizeGitChangePaths(['./docs/guides/guide.md', 'docs/guides/guide.md', 'packages\\cli\\src\\command.ts']),
        ['docs/guides/guide.md', 'packages/cli/src/command.ts'],
    )
})

test('internal reports and guides select only documentation checks', () => {
    assert.deepEqual(classifyGitChangePaths(['docs/reports/audits/gate.md']), expectedFlags('docs'))
    assert.deepEqual(classifyGitChangePaths(['docs/guides/COMMANDS.md']), expectedFlags('docs'))
})

test('site pages and API data select documentation and site checks', () => {
    assert.deepEqual(classifyGitChangePaths(['apps/docs/guide/installation.md']), expectedFlags('docs', 'site'))
    assert.deepEqual(classifyGitChangePaths(['apps/docs/components/button.md']), expectedFlags('docs', 'site', 'generated'))
    assert.deepEqual(
        classifyGitChangePaths(['apps/docs/.vitepress/api-generated/button.en.json']),
        expectedFlags('docs', 'site', 'generated'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/components/button/Button.vue']),
        expectedFlags('ui', 'registry', 'browser', 'generated', 'consumers', 'docs', 'site', 'cost'),
    )
})

test('UI changes and Button cost inputs follow their actual dependency scopes', () => {
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/components/input/Input.vue']),
        expectedFlags('ui', 'registry', 'browser', 'generated', 'consumers', 'docs', 'site'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/components/button/button.test.ts']),
        expectedFlags('ui'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/components/button/button.browser.test.ts']),
        expectedFlags('ui', 'browser'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/composables/useGlitchEffect.ts']),
        expectedFlags('ui', 'registry', 'browser', 'generated', 'consumers', 'docs', 'site', 'cost'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/scripts/generate-api-contract.ts']),
        expectedFlags('ui', 'browser', 'generated', 'tooling', 'consumers', 'cost'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/scripts/api-docs/catalog.test.ts']),
        expectedFlags('ui', 'docs', 'site', 'tooling'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/scripts/api-module-coverage.ts']),
        expectedFlags('ui', 'generated', 'tooling', 'consumers'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/styles.css']),
        expectedFlags('ui', 'registry', 'browser', 'generated', 'consumers', 'docs', 'site', 'cost'),
    )
})

test('UI distribution and type inputs select dependent site and registry checks', () => {
    for (const file of ['packages/ui/package.json', 'packages/ui/src/index.ts', 'packages/ui/vite.config.ts', 'packages/ui/tsconfig.json']) {
        const flags = classifyGitChangePaths([file])
        for (const required of ['ui', 'registry', 'site', 'docs', 'generated', 'consumers', 'browser', 'cost']) assert.equal(flags[required], true, `${file}: ${required}`)
    }
})

test('shared source changes select the dependent package closure', () => {
    assert.deepEqual(
        classifyGitChangePaths(['packages/shared/src/ast/sfc-ast-engine.ts']),
        expectedFlags('ui', 'cli', 'registry', 'docs', 'site', 'generated', 'browser', 'consumers'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/shared/src/design-tokens.ts']),
        expectedFlags('ui', 'cli', 'registry', 'docs', 'site', 'generated', 'browser', 'consumers', 'cost'),
    )
})

test('CLI, Registry, release, and package fixture changes select their owning checks', () => {
    assert.deepEqual(classifyGitChangePaths(['packages/cli/src/commands/add.ts']), expectedFlags('cli', 'consumers'))
    assert.deepEqual(
        classifyGitChangePaths(['packages/registry/src/compiler.ts']),
        expectedFlags('registry', 'cli', 'consumers', 'generated'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['scripts/release/release-coordinator.mjs']),
        expectedFlags('tooling', 'release'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['.github/workflows/publish.yml']),
        expectedFlags('tooling', 'release'),
    )
})

test('package documentation stays scoped while CLI distribution inputs select consumers', () => {
    for (const file of ['packages/ui/README.md', 'packages/cli/README.md', 'packages/registry/README.md']) {
        assert.deepEqual(classifyGitChangePaths([file]), expectedFlags('docs'))
    }
    for (const file of ['packages/cli/package.json', 'packages/cli/tsup.config.ts', 'packages/cli/tsconfig.json']) {
        assert.deepEqual(classifyGitChangePaths([file]), expectedFlags('cli', 'consumers'))
    }
})

test('consumer and cost fixtures select their real execution checks', () => {
    assert.equal(classifyGitChangePaths(['packages/cli/scripts/fixtures/consumers/u1/pnpm-lock.yaml']).consumers, true)
    assert.equal(classifyGitChangePaths(['packages/cli/scripts/test-consumers.mjs']).consumers, true)
    assert.equal(classifyGitChangePaths(['packages/ui/perf/fixtures/consumer-lock.yaml']).cost, true)
    assert.equal(classifyGitChangePaths(['packages/shared/src/api-contract.ts']).cost, true)
})

test('root build inputs and change-scope logic force a full comparable run', () => {
    assert.deepEqual(classifyGitChangePaths(['pnpm-lock.yaml']), allFlags())
    assert.deepEqual(classifyGitChangePaths(['.github/workflows/ci.yml']), allFlags())
    assert.deepEqual(classifyGitChangePaths(['scripts/ci/evaluate-gate.mjs']), allFlags())
    assert.deepEqual(classifyGitChangePaths(['new-root-config.toml']), allFlags())
    assert.deepEqual(classifyGitChangePaths([]), allFlags())
})

test('the CLI includes deleted and renamed paths in its Git-derived scope and writes GitHub outputs', () => {
    const repository = mkdtempSync(path.join(os.tmpdir(), 'brutx-change-scope-'))
    try {
        execFileSync('git', ['init', '--quiet'], { cwd: repository })
        execFileSync('git', ['config', 'user.name', 'Scope Test'], { cwd: repository })
        execFileSync('git', ['config', 'user.email', 'scope@example.test'], { cwd: repository })

        mkdirSync(path.join(repository, 'docs/guides'), { recursive: true })
        mkdirSync(path.join(repository, 'packages/registry/src'), { recursive: true })
        writeFileSync(path.join(repository, 'docs/guides/old.md'), 'guide\n')
        writeFileSync(path.join(repository, 'packages/registry/src/removed.ts'), 'export {}\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'base'], { cwd: repository })
        const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()

        mkdirSync(path.join(repository, 'packages/cli/src'), { recursive: true })
        execFileSync('git', ['mv', 'docs/guides/old.md', 'packages/cli/src/new-command.ts'], { cwd: repository })
        execFileSync('git', ['rm', 'packages/registry/src/removed.ts'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'rename and delete'], { cwd: repository })
        const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
        const outputFile = path.join(repository, 'github-output.txt')
        writeFileSync(outputFile, '')

        const processResult = spawnSync(process.execPath, [SCRIPT_PATH, '--base', base, '--head', head, '--diff-mode', 'direct'], {
            cwd: repository,
            encoding: 'utf8',
            env: { ...process.env, GITHUB_OUTPUT: outputFile },
        })

        assert.equal(processResult.status, 0, processResult.stderr)
        const flags = JSON.parse(processResult.stdout)
        assert.deepEqual(flags, expectedFlags('cli', 'registry', 'docs', 'generated', 'consumers'))

        const output = new Map(readFileSync(outputFile, 'utf8').trim().split('\n').map(line => {
            const separator = line.indexOf('=')
            return [line.slice(0, separator), line.slice(separator + 1)]
        }))
        assert.equal(output.get('cli'), 'true')
        assert.equal(output.get('docs'), 'true')
        assert.equal(output.get('registry'), 'true')
        assert.equal(output.get('full'), 'false')
        assert.deepEqual(JSON.parse(output.get('json')), flags)
    } finally {
        rmSync(repository, { recursive: true, force: true })
    }
})

test('the merge-base mode excludes changes made only on the target branch', () => {
    const repository = mkdtempSync(path.join(os.tmpdir(), 'brutx-change-scope-'))
    try {
        execFileSync('git', ['init', '--quiet'], { cwd: repository })
        execFileSync('git', ['config', 'user.name', 'Scope Test'], { cwd: repository })
        execFileSync('git', ['config', 'user.email', 'scope@example.test'], { cwd: repository })
        writeFileSync(path.join(repository, 'README.md'), 'base\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'base'], { cwd: repository })
        execFileSync('git', ['branch', '--move', 'target'], { cwd: repository })
        execFileSync('git', ['checkout', '--quiet', '-b', 'feature'], { cwd: repository })
        mkdirSync(path.join(repository, 'apps/docs/guide'), { recursive: true })
        writeFileSync(path.join(repository, 'apps/docs/guide/feature.md'), 'feature\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'feature'], { cwd: repository })
        const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
        execFileSync('git', ['checkout', '--quiet', 'target'], { cwd: repository })
        mkdirSync(path.join(repository, 'docs/reports'), { recursive: true })
        writeFileSync(path.join(repository, 'docs/reports/target-only.md'), 'target\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'target'], { cwd: repository })
        const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()

        const result = spawnSync(process.execPath, [SCRIPT_PATH, '--base', base, '--head', head, '--diff-mode', 'merge-base'], {
            cwd: repository,
            encoding: 'utf8',
        })

        assert.equal(result.status, 0, result.stderr)
        assert.deepEqual(JSON.parse(result.stdout), expectedFlags('docs', 'site'))
    } finally {
        rmSync(repository, { recursive: true, force: true })
    }
})
