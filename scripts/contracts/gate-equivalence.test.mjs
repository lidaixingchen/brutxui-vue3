import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import {
    copyFileSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    realpathSync,
    rmSync,
    statSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
    GATE_REGISTRY,
    GATE_REPLACEMENTS,
    REPOSITORY_ROOT,
    SAMPLE_STATUS,
    validateGateRegistry,
    validateGateReplacements,
} from './gate-registry.mjs'

const BASELINE_COMMIT = '7d30ca7e'
const COMMAND_TIMEOUT_MS = 60_000
const FIXTURE_PREFIX = 'brutx-gate-equivalence-'
const TEMP_DIRECTORY = realpathSync(os.tmpdir())
const TOKEN_THEME_END = '/* @brutx:theme-tokens:end */'
const PACKAGE_EXPORTS_DRIFT_KEY = './fixture-stale'
const GENERATED_DRIFT_RISK_ID = 'generated-drift'

function assertRepositoryFile(relativePath) {
    const absolutePath = path.resolve(REPOSITORY_ROOT, relativePath)
    assert.equal(statSync(absolutePath).isFile(), true, `样本文件不存在：${relativePath}`)
}

function assertSampleStatus(samples, expectedStatus, label) {
    assert.ok(samples.length > 0, `${label} 缺少样本`)
    for (const sample of samples) {
        assert.equal(sample.status, expectedStatus, `${label} 样本状态错误：${sample.name}`)
        assertRepositoryFile(sample.file)
    }
}

function writeFixtureFile(fixtureRoot, relativePath, content) {
    const target = path.resolve(fixtureRoot, relativePath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
    return target
}

function materializeBaselineFile(fixtureRoot, relativePath) {
    const content = execFileSync(
        'git',
        ['show', `${BASELINE_COMMIT}:${relativePath}`],
        { cwd: REPOSITORY_ROOT, encoding: 'utf8' },
    )
    return writeFixtureFile(fixtureRoot, relativePath, content)
}

function copyCandidateFile(fixtureRoot, relativePath) {
    const target = path.resolve(fixtureRoot, relativePath)
    mkdirSync(path.dirname(target), { recursive: true })
    copyFileSync(path.resolve(REPOSITORY_ROOT, relativePath), target)
    return target
}

function linkPackageDependencies(packageRoot, packageRelativePath) {
    symlinkSync(
        path.resolve(REPOSITORY_ROOT, packageRelativePath, 'node_modules'),
        path.join(packageRoot, 'node_modules'),
        'dir',
    )
}

function runTsx(scriptPath, cwd, args = []) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', scriptPath, ...args], {
        cwd,
        encoding: 'utf8',
        timeout: COMMAND_TIMEOUT_MS,
        env: { ...process.env, CI: '1' },
    })
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
    return { ...result, output }
}

function assertAccepted(result, label) {
    assert.equal(result.status, 0, `${label} 应返回 0，实际为 ${result.status}\n${result.output}`)
}

function assertRejected(result, label) {
    assert.notEqual(result.status, 0, `${label} 应拒绝漂移\n${result.output}`)
}

function assertSameRiskOutcome(legacyResult, replacementResult, label) {
    assert.equal(
        legacyResult.status === 0,
        replacementResult.status === 0,
        `${label} 的旧入口与替代入口必须有一致风险结论`,
    )
}

function createMinimalCliInputs(packageRoot) {
    writeFixtureFile(packageRoot, 'package.json', JSON.stringify({ name: 'fixture-cli', type: 'module' }, null, 2) + '\n')
    writeFixtureFile(
        packageRoot,
        'src/styles/brutalist.css',
        [
            '/* @brutx:theme-tokens:start */',
            'fixture theme',
            '/* @brutx:theme-tokens:end */',
            '/* @brutx:root-tokens:start */',
            'fixture root',
            '/* @brutx:root-tokens:end */',
            '/* @brutx:theme-presets:start */',
            'fixture presets',
            '/* @brutx:theme-presets:end */',
            '/* @brutx:utility-rules:start */',
            'fixture rules',
            '/* @brutx:utility-rules:end */',
            '',
        ].join('\n'),
    )
    writeFixtureFile(
        packageRoot,
        'src/lib/constants.ts',
        [
            '/* @brutx:cli-utils-template:start */',
            'fixture utils',
            '/* @brutx:cli-utils-template:end */',
            '',
        ].join('\n'),
    )
}

function createLegacyCliFixture(fixtureRoot) {
    const packageRoot = path.join(fixtureRoot, 'packages/cli')
    materializeBaselineFile(fixtureRoot, 'packages/cli/scripts/check-brutalist-tokens.ts')
    materializeBaselineFile(fixtureRoot, 'packages/cli/scripts/generate-tokens.ts')
    createMinimalCliInputs(packageRoot)
    linkPackageDependencies(packageRoot, 'packages/cli')

    const generation = runTsx(path.join(packageRoot, 'scripts/generate-tokens.ts'), packageRoot)
    assertAccepted(generation, '基线 CLI 生成脚本')

    return {
        packageRoot,
        outputPath: path.join(packageRoot, 'src/styles/brutalist.css'),
        checkPath: path.join(packageRoot, 'scripts/check-brutalist-tokens.ts'),
    }
}

function createCandidateCliFixture(fixtureRoot) {
    const packageRoot = path.join(fixtureRoot, 'packages/cli')
    copyCandidateFile(fixtureRoot, 'packages/cli/scripts/generate.ts')
    copyCandidateFile(fixtureRoot, 'packages/cli/scripts/generate-tokens.ts')
    createMinimalCliInputs(packageRoot)
    linkPackageDependencies(packageRoot, 'packages/cli')

    const generation = runTsx(path.join(packageRoot, 'scripts/generate.ts'), packageRoot)
    assertAccepted(generation, '候选 CLI 生成脚本')

    return {
        packageRoot,
        outputPath: path.join(packageRoot, 'src/styles/brutalist.css'),
        checkPath: path.join(packageRoot, 'scripts/generate.ts'),
    }
}

function addTokenDrift(outputPath) {
    const current = readFileSync(outputPath, 'utf8')
    assert.equal(current.includes(TOKEN_THEME_END), true, `缺少 token 区域标记：${outputPath}`)
    writeFileSync(
        outputPath,
        current.replace(TOKEN_THEME_END, '/* fixture token drift */\n' + TOKEN_THEME_END),
        'utf8',
    )
}

function createLegacyUiFixture(fixtureRoot) {
    const packageRoot = path.join(fixtureRoot, 'packages/ui')
    materializeBaselineFile(fixtureRoot, 'packages/ui/package.json')
    materializeBaselineFile(fixtureRoot, 'packages/ui/exports-manifest.json')
    materializeBaselineFile(fixtureRoot, 'packages/ui/scripts/check-exports.ts')
    materializeBaselineFile(fixtureRoot, 'packages/ui/scripts/generate-exports.ts')

    const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'exports-manifest.json'), 'utf8'))
    for (const component of manifest.components) mkdirSync(path.join(packageRoot, 'src/components', component), { recursive: true })
    for (const composable of manifest.composables) {
        writeFixtureFile(packageRoot, `src/composables/${composable}`, '')
    }
    for (const directive of manifest.directives) {
        writeFixtureFile(packageRoot, `src/directives/${directive}`, '')
    }
    const indexExports = [
        ...manifest.components.map((name) => `export * from './components/${name}'`),
        ...manifest.composables.map((name) => `export * from './composables/${name.replace(/\.ts$/u, '')}'`),
    ]
    writeFixtureFile(packageRoot, 'src/index.ts', `${indexExports.join('\n')}\n`)
    linkPackageDependencies(packageRoot, 'packages/ui')

    return {
        packageRoot,
        checkPath: path.join(packageRoot, 'scripts/check-exports.ts'),
        outputPath: path.join(packageRoot, 'package.json'),
    }
}

function createCandidateUiFixture(fixtureRoot) {
    const packageRoot = path.join(fixtureRoot, 'packages/ui')
    const currentScripts = [
        'packages/ui/scripts/generate.ts',
        'packages/ui/scripts/generate-styles-tokens.ts',
        'packages/ui/scripts/prebuild-scan.ts',
        'packages/ui/scripts/generate-api-contract.ts',
        'packages/ui/scripts/generate-component-index.ts',
        'packages/ui/scripts/generate-exports.ts',
    ]
    for (const relativePath of currentScripts) copyCandidateFile(fixtureRoot, relativePath)

    writeFixtureFile(
        packageRoot,
        'package.json',
        JSON.stringify({ name: 'fixture-ui', version: '0.0.0', type: 'module', exports: {} }, null, 2) + '\n',
    )
    writeFixtureFile(
        packageRoot,
        'tsconfig.json',
        JSON.stringify({ compilerOptions: { moduleResolution: 'bundler', module: 'ESNext' } }, null, 2) + '\n',
    )
    writeFixtureFile(
        packageRoot,
        'api-contract.ts',
        [
            "import type { ApiContract, ComponentExportProjection } from 'brutx-shared-vue/api-contract'",
            '',
            'export const API_CONTRACT: ApiContract = {',
            "    modules: [\n        { id: 'root', source: 'src/index.ts', owner: 'root', layer: 'runtime/helper', public: true },\n        { id: 'composables', source: 'src/composables', owner: 'composables', layer: 'runtime/helper', public: false },\n    ],",
            "    entries: [\n        { id: 'root', subpath: '.', kind: 'root', moduleIds: ['root'], exports: [] },\n        { id: 'composables', subpath: './composables', kind: 'composable', moduleIds: ['composables'], exports: [] },\n    ],",
            '    registry: [],',
            '}',
            '',
            'export function projectComponentExports(_componentId: string): ComponentExportProjection {',
            "    throw new Error('fixture has no component projections')",
            '}',
            '',
        ].join('\n'),
    )
    for (const relativePath of [
        'src/components',
        'src/composables',
        'src/directives',
        'src/lib',
    ]) mkdirSync(path.join(packageRoot, relativePath), { recursive: true })
    writeFixtureFile(
        packageRoot,
        'src/styles.css',
        [
            '/* @brutx:theme-tokens:start */',
            'fixture theme',
            '/* @brutx:theme-tokens:end */',
            '/* @brutx:root-tokens:start */',
            'fixture root',
            '/* @brutx:root-tokens:end */',
            '/* @brutx:theme-presets:start */',
            'fixture presets',
            '/* @brutx:theme-presets:end */',
            '/* @brutx:pattern-utilities:start */',
            'fixture patterns',
            '/* @brutx:pattern-utilities:end */',
            '',
        ].join('\n'),
    )
    writeFixtureFile(
        packageRoot,
        'src/preflight.css',
        '/* @brutx:font-stack:start */\nfixture font\n/* @brutx:font-stack:end */\n',
    )
    writeFixtureFile(
        packageRoot,
        'src/lib/utils.ts',
        [
            '/* @brutx:color-names:start */',
            'fixture colors',
            '/* @brutx:color-names:end */',
            '/* @brutx:z-index-names:start */',
            'fixture z-index',
            '/* @brutx:z-index-names:end */',
            '',
        ].join('\n'),
    )
    linkPackageDependencies(packageRoot, 'packages/ui')

    const generation = runTsx(path.join(packageRoot, 'scripts/generate.ts'), packageRoot)
    assertAccepted(generation, '候选 UI 生成脚本')

    return {
        packageRoot,
        checkPath: path.join(packageRoot, 'scripts/generate.ts'),
        outputPath: path.join(packageRoot, 'package.json'),
    }
}

function addExportsDrift(packageJsonPath) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    packageJson.exports = {
        ...packageJson.exports,
        [PACKAGE_EXPORTS_DRIFT_KEY]: './dist/fixture-stale.js',
    }
    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')
}

function runWithFaultFiles(faultFiles, mutate, verify) {
    const originals = faultFiles.map((filePath) => readFileSync(filePath, 'utf8'))
    try {
        for (const filePath of faultFiles) mutate(filePath)
        verify()
    } finally {
        faultFiles.forEach((filePath, index) => writeFileSync(filePath, originals[index], 'utf8'))
    }
}

test('门禁登记覆盖风险、执行入口和正反样本', () => {
    const result = validateGateRegistry()
    assert.deepEqual(result, { valid: true, errors: [] })
    for (const gate of GATE_REGISTRY) {
        assertSampleStatus(gate.samples.positive, SAMPLE_STATUS.PASS, `门禁 ${gate.id} positive`)
        assertSampleStatus(gate.samples.negative, SAMPLE_STATUS.FAIL, `门禁 ${gate.id} negative`)
    }
})

test('被替换聚合检查登记旧入口、替代入口及正反样本', () => {
    const result = validateGateReplacements()
    assert.deepEqual(result, { valid: true, errors: [] })
    for (const replacement of GATE_REPLACEMENTS) {
        assertRepositoryFile(replacement.legacyTarget)
        assertRepositoryFile(replacement.replacementTarget)
        assertSampleStatus(replacement.samples.positive, SAMPLE_STATUS.PASS, `替换 ${replacement.id} positive`)
        assertSampleStatus(replacement.samples.negative, SAMPLE_STATUS.FAIL, `替换 ${replacement.id} negative`)
        assert.equal(replacement.riskId, GENERATED_DRIFT_RISK_ID)
        assert.deepEqual(replacement.replacementArgs, ['--check'])
    }
})

test('CLI token 旧门禁与新 generate --check 在隔离 fixture 中保持风险等价', () => {
    const fixtureRoot = mkdtempSync(path.join(TEMP_DIRECTORY, FIXTURE_PREFIX))
    try {
        const legacy = createLegacyCliFixture(path.join(fixtureRoot, 'legacy'))
        const candidate = createCandidateCliFixture(path.join(fixtureRoot, 'candidate'))

        const legacyClean = runTsx(legacy.checkPath, legacy.packageRoot)
        const candidateClean = runTsx(candidate.checkPath, candidate.packageRoot, ['--check'])
        assertAccepted(legacyClean, 'CLI 基线 token 检查')
        assertAccepted(candidateClean, 'CLI 候选 generate --check')

        runWithFaultFiles(
            [legacy.outputPath, candidate.outputPath],
            addTokenDrift,
            () => {
                const legacyDrift = runTsx(legacy.checkPath, legacy.packageRoot)
                const candidateDrift = runTsx(candidate.checkPath, candidate.packageRoot, ['--check'])
                assertRejected(legacyDrift, 'CLI 基线 token 检查')
                assertRejected(candidateDrift, 'CLI 候选 generate --check')
                assertSameRiskOutcome(legacyDrift, candidateDrift, 'CLI token 漂移')
            },
        )
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true })
    }
})

test('UI exports 旧门禁与新 generate --check 在隔离 fixture 中保持风险等价', () => {
    const fixtureRoot = mkdtempSync(path.join(TEMP_DIRECTORY, FIXTURE_PREFIX))
    try {
        const legacy = createLegacyUiFixture(path.join(fixtureRoot, 'legacy'))
        const candidate = createCandidateUiFixture(path.join(fixtureRoot, 'candidate'))

        const legacyClean = runTsx(legacy.checkPath, legacy.packageRoot)
        const candidateClean = runTsx(candidate.checkPath, candidate.packageRoot, ['--check'])
        assertAccepted(legacyClean, 'UI 基线 exports 检查')
        assertAccepted(candidateClean, 'UI 候选 generate --check')

        runWithFaultFiles(
            [legacy.outputPath, candidate.outputPath],
            addExportsDrift,
            () => {
                const legacyDrift = runTsx(legacy.checkPath, legacy.packageRoot)
                const candidateDrift = runTsx(candidate.checkPath, candidate.packageRoot, ['--check'])
                assertRejected(legacyDrift, 'UI 基线 exports 检查')
                assertRejected(candidateDrift, 'UI 候选 generate --check')
                assertSameRiskOutcome(legacyDrift, candidateDrift, 'UI exports 漂移')
            },
        )
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true })
    }
})

test('生成漂移门禁使用完整采集入口，CI 不硬编码四个文件', () => {
    const generatorSource = readFileSync(path.resolve(REPOSITORY_ROOT, 'packages/ui/scripts/generate.ts'), 'utf8')
    const cliGeneratorSource = readFileSync(path.resolve(REPOSITORY_ROOT, 'packages/cli/scripts/generate.ts'), 'utf8')
    const workflowSource = readFileSync(path.resolve(REPOSITORY_ROOT, '.github/workflows/ci.yml'), 'utf8')
    const generatedGate = GATE_REGISTRY.find(gate => gate.id === 'generated-drift')

    assert.equal(generatedGate?.outputOwnership, 'collectExpectedOutputs')
    assert.match(generatorSource, /collectExpectedOutputs/)
    assert.match(cliGeneratorSource, /collectExpectedOutputs/)
    assert.match(workflowSource, /(?:pnpm check:generated|pnpm --filter brutx-ui-vue generate -- --check)/)
    assert.doesNotMatch(workflowSource, /git diff --exit-code --\s+packages\/ui\/registry-manifest\.json/)
})

test('CI 将旧 wrapper 替换为同一低层 Turbo 任务图并接入 R3b 门禁', () => {
    const workflowSource = readFileSync(path.resolve(REPOSITORY_ROOT, '.github/workflows/ci.yml'), 'utf8')
    for (const marker of [
        'turbo run build:artifact typecheck:source lint:source',
        'turbo run build:artifact test test:ssr',
        'pnpm check:contracts',
        'pnpm --filter brutx-ui-vue test:types',
        'pnpm --filter brutx-ui-vue check:isolation',
        'pnpm test:tooling',
        'test:coverage',
        'pnpm --filter brutx-ui-vue test:browser',
        'perf/cost-runner.ts',
        '--assert-resources',
        'pnpm test:consumers --all',
        'pnpm exec turbo run validate --filter=brutx-registry-vue',
        'pnpm test:release',
        'pnpm check:docs',
    ]) {
        assert.match(workflowSource, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `CI 缺少门禁：${marker}`)
    }
    assert.doesNotMatch(workflowSource, /turbo run build typecheck lint/)
    assert.doesNotMatch(workflowSource, /turbo run build test test:ssr/)
    const publishSource = readFileSync(path.resolve(REPOSITORY_ROOT, '.github/workflows/publish.yml'), 'utf8')
    assert.match(publishSource, /turbo run build:artifact test typecheck:source lint:source/)
    assert.ok(publishSource.indexOf('pnpm check:generated') < publishSource.indexOf('turbo run build:artifact'))
    const releaseSource = readFileSync(path.resolve(REPOSITORY_ROOT, 'scripts/release/check.mjs'), 'utf8')
    assert.match(releaseSource, /'build:artifact', 'test', 'typecheck:source', 'lint:source'/)
})
