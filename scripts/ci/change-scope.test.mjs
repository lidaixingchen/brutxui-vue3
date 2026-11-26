import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { CHANGE_SCOPE_FIELDS, classifyCiChangeScope, classifyGitChangePaths, normalizeGitChangePaths } from './change-scope.mjs'
import { selectCiChecks } from './evaluate-gate.mjs'

const SCRIPT_PATH = fileURLToPath(new URL('./change-scope.mjs', import.meta.url))
const CI_WORKFLOW_PATH = fileURLToPath(new URL('../../.github/workflows/ci.yml', import.meta.url))

function expectedFlags(...enabled) {
    const flags = Object.fromEntries(CHANGE_SCOPE_FIELDS.map(field => [field, false]))
    for (const field of enabled) flags[field] = true
    return flags
}

function allFlags() {
    return Object.fromEntries(CHANGE_SCOPE_FIELDS.map(field => [field, true]))
}

test('normalizes Git paths and removes duplicates', () => {
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
    assert.deepEqual(classifyGitChangePaths(['apps/docs/components/button.md']), expectedFlags('docs', 'site', 'generated', 'registry'))
    assert.deepEqual(
        classifyGitChangePaths(['apps/docs/.vitepress/api-generated/button.en.json']),
        expectedFlags('docs', 'site', 'generated', 'browser'),
    )
    assert.deepEqual(
        classifyGitChangePaths(['packages/ui/src/components/button/Button.vue']),
        expectedFlags('ui', 'registry', 'browser', 'generated', 'consumers', 'docs', 'site', 'cost'),
    )
})

test('browser configuration, fixtures and cross-package imports select the browser suite', () => {
    for (const file of [
        'packages/ui/vitest.browser.config.ts',
        'packages/ui/src/vitest.browser.setup.ts',
        'packages/ui/src/test/browser-mount.ts',
        'packages/ui/src/test/component-api-primitives.ts',
        'packages/ui/src/test/fixtures/OverlayLayerTestFixture.vue',
        'packages/ui/src/test/vitepress-stub.ts',
        'packages/cli/src/styles/brutalist.css',
        'apps/docs/package.json',
        'apps/docs/.vitepress/api-types.ts',
        'apps/docs/.vitepress/theme/style.css',
        'apps/docs/.vitepress/theme/components/InstallationTabs.vue',
        'apps/docs/.vitepress/theme/components/CopyButton.vue',
        'apps/docs/.vitepress/theme/components/ComponentApiDescription.vue',
        'apps/docs/.vitepress/theme/components/component-api-view.ts',
        'apps/docs/.vitepress/theme/lib/i18n.ts',
    ]) {
        const flags = classifyGitChangePaths([file])
        assert.equal(flags.browser, true, file)
        assert.equal(flags.cost, false, file)
        assert.ok(selectCiChecks(flags).includes('browser'), file)
    }
    assert.deepEqual(classifyGitChangePaths(['packages/ui/src/test/ssr-render.ts']), expectedFlags('ui'))
    assert.deepEqual(
        selectCiChecks(classifyGitChangePaths(['apps/docs/.vitepress/theme/components/InstallationTabs.vue'])),
        ['tooling', 'browser', 'site'],
    )
})

test('site routing and artifact regressions select the site job', () => {
    for (const file of [
        'apps/docs/.vitepress/site-translations.ts',
        'apps/docs/.vitepress/site-translations.test.ts',
        'apps/docs/.vitepress/site-translations-dev.test.ts',
        'scripts/docs/site-languages.test.mjs',
    ]) {
        const flags = classifyGitChangePaths([file])
        assert.deepEqual(flags, expectedFlags('docs', 'site'))
        assert.deepEqual(selectCiChecks(flags), ['tooling', 'site'])
    }
})

test('registry page and demo inputs select registry validation while other site changes stay scoped', () => {
    for (const section of ['components', 'blocks', 'en/components', 'en/blocks']) {
        const flags = classifyGitChangePaths([`apps/docs/${section}/example.md`])
        assert.deepEqual(flags, expectedFlags('docs', 'site', 'generated', 'registry'))
        assert.ok(selectCiChecks(flags).includes('quality'))
    }
    assert.deepEqual(
        classifyGitChangePaths(['apps/docs/.vitepress/theme/components/demos/ButtonDemo.vue']),
        expectedFlags('docs', 'site', 'registry'),
    )
    for (const file of ['apps/docs/blocks/index.md', 'apps/docs/en/components/guide/example.md']) {
        assert.deepEqual(classifyGitChangePaths([file]), expectedFlags('docs', 'site', 'generated'))
    }
    for (const file of ['apps/docs/en/guide/installation.md', 'apps/docs/public/example.svg']) {
        assert.deepEqual(selectCiChecks(classifyGitChangePaths([file])), ['tooling', 'site'])
    }
})

test('deleted registry demos and renamed browser fixtures select their checks in pull requests', () => {
    const repository = mkdtempSync(path.join(os.tmpdir(), 'brutx-docs-change-scope-'))
    try {
        function git(...args) {
            return execFileSync('git', args, { cwd: repository, encoding: 'utf8' }).trim()
        }

        git('init', '--quiet')
        git('config', 'user.name', 'Scope Test')
        git('config', 'user.email', 'scope@example.test')

        const demo = 'apps/docs/.vitepress/theme/components/demos/ButtonDemo.vue'
        const fixture = 'apps/docs/.vitepress/theme/components/InstallationTabs.vue'
        const guide = 'apps/docs/guide/installation.md'
        for (const file of [demo, fixture, guide]) mkdirSync(path.dirname(path.join(repository, file)), { recursive: true })
        writeFileSync(path.join(repository, demo), '<template>Button</template>\n')
        writeFileSync(path.join(repository, fixture), '<template>Installation</template>\n')
        git('add', '.')
        git('commit', '--quiet', '-m', 'base')
        const base = git('rev-parse', 'HEAD')

        git('rm', demo)
        git('commit', '--quiet', '-m', 'delete demo')
        const deleted = git('rev-parse', 'HEAD')
        assert.deepEqual(
            selectCiChecks(classifyCiChangeScope({ eventName: 'pull_request', base, head: deleted, cwd: repository })),
            ['tooling', 'quality', 'test', 'site'],
        )

        git('mv', fixture, guide)
        git('commit', '--quiet', '-m', 'rename browser fixture')
        const renamed = git('rev-parse', 'HEAD')
        assert.deepEqual(
            selectCiChecks(classifyCiChangeScope({ eventName: 'pull_request', base: deleted, head: renamed, cwd: repository })),
            ['tooling', 'browser', 'site'],
        )
    } finally {
        rmSync(repository, { recursive: true, force: true })
    }
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
        assert.deepEqual(JSON.parse(output.get('selected')), ['tooling', 'quality', 'test', 'integration', 'consumers'])
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

        const result = spawnSync(process.execPath, [SCRIPT_PATH, '--event', 'pull_request', '--base', base, '--head', head], {
            cwd: repository,
            encoding: 'utf8',
        })

        assert.equal(result.status, 0, result.stderr)
        assert.deepEqual(JSON.parse(result.stdout), expectedFlags('docs', 'site'))
    } finally {
        rmSync(repository, { recursive: true, force: true })
    }
})

test('main push validation covers a code commit even when a following docs push replaces its run', () => {
    const repository = mkdtempSync(path.join(os.tmpdir(), 'brutx-change-scope-push-'))
    try {
        execFileSync('git', ['init', '--quiet'], { cwd: repository })
        execFileSync('git', ['config', 'user.name', 'Scope Test'], { cwd: repository })
        execFileSync('git', ['config', 'user.email', 'scope@example.test'], { cwd: repository })
        mkdirSync(path.join(repository, 'packages/ui/src'), { recursive: true })
        writeFileSync(path.join(repository, 'README.md'), 'base\n')
        writeFileSync(path.join(repository, 'packages/ui/src/input.ts'), 'export const input = 1\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'base'], { cwd: repository })

        writeFileSync(path.join(repository, 'packages/ui/src/input.ts'), 'export const input = 2\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'fix(ui): update input'], { cwd: repository })
        const codeCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()

        writeFileSync(path.join(repository, 'README.md'), 'docs update\n')
        execFileSync('git', ['add', '.'], { cwd: repository })
        execFileSync('git', ['commit', '--quiet', '-m', 'docs: update readme'], { cwd: repository })
        const docsCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()

        const pushResult = spawnSync(process.execPath, [SCRIPT_PATH, '--event', 'push', '--base', codeCommit, '--head', docsCommit], {
            cwd: repository,
            encoding: 'utf8',
        })
        assert.equal(pushResult.status, 0, pushResult.stderr)
        assert.deepEqual(JSON.parse(pushResult.stdout), allFlags(), 'each main push must select full checks for its exact head')
        assert.deepEqual(
            classifyCiChangeScope({ eventName: 'workflow_dispatch', base: codeCommit, head: docsCommit, cwd: repository }),
            expectedFlags('docs'),
            'an explicit manual baseline must retain direct-diff selection',
        )
        assert.deepEqual(
            classifyCiChangeScope({ eventName: 'workflow_dispatch', head: docsCommit, cwd: repository }),
            allFlags(),
            'a manual run without a baseline must remain full-scope',
        )
        assert.match(readFileSync(CI_WORKFLOW_PATH, 'utf8'), /node scripts\/ci\/change-scope\.mjs --event "\$EVENT_NAME" --base "\$BASE_SHA" --head "\$HEAD_SHA"/u)
    } finally {
        rmSync(repository, { recursive: true, force: true })
    }
})
