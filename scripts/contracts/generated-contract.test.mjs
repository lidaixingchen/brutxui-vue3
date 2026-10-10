import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const TEMP_DIRECTORY = realpathSync(os.tmpdir())
const COMMAND_TIMEOUT_MS = 60_000

test('UI 与 CLI generate --check 接受当前生成输出', () => {
    for (const [name, packagePath] of [
        ['UI', 'packages/ui'],
        ['CLI', 'packages/cli'],
    ]) {
        const result = spawnSync(
            process.execPath,
            ['--import', 'tsx', 'scripts/generate.ts', '--check'],
            {
                cwd: path.join(REPOSITORY_ROOT, packagePath),
                encoding: 'utf8',
                timeout: COMMAND_TIMEOUT_MS,
            },
        )
        const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
        assert.equal(result.status, 0, `${name} generate --check 应接受当前输出\n${output}`)
    }
})

test('UI 与 CLI 当前生成器接受同步输出并拒绝漂移', () => {
    const fixtureRoot = mkdtempSync(path.join(TEMP_DIRECTORY, 'brutx-generated-contract-'))
    try {
        const source = `
import path from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import { compareGeneratedOutputs, hasMissingGeneratedOutputs } from './packages/shared/src/generation.ts'
import { collectExpectedOutputs as collectUiOutputs } from './packages/ui/scripts/generate.ts'
import { collectExpectedOutputs as collectCliOutputs } from './packages/cli/scripts/generate.ts'

for (const [name, outputs] of [['ui', collectUiOutputs()], ['cli', collectCliOutputs()]]) {
    const root = path.join(process.env.BRUTX_FIXTURE_ROOT, name)
    for (const output of outputs) {
        const target = path.resolve(root, output.relativePath)
        mkdirSync(path.dirname(target), { recursive: true })
        writeFileSync(target, output.content, 'utf8')
    }
    if (compareGeneratedOutputs(root, outputs).length !== 0 || hasMissingGeneratedOutputs(root, outputs)) {
        throw new Error(name + ' generated fixture should be accepted')
    }

    const [output] = outputs
    if (!output) throw new Error(name + ' generator returned no outputs')
    const target = path.resolve(root, output.relativePath)
    writeFileSync(target, output.content + '\\nfixture drift\\n', 'utf8')
    if (compareGeneratedOutputs(root, outputs).length === 0) {
        throw new Error(name + ' generated fixture should reject drift')
    }
}
`
        const result = spawnSync(
            process.execPath,
            ['--import', 'tsx', '--input-type=module', '-e', source],
            {
                cwd: REPOSITORY_ROOT,
                encoding: 'utf8',
                timeout: COMMAND_TIMEOUT_MS,
                env: { ...process.env, BRUTX_FIXTURE_ROOT: fixtureRoot },
            },
        )
        const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
        assert.equal(result.status, 0, `当前 UI/CLI 生成契约检查失败\n${output}`)
    } finally {
        rmSync(fixtureRoot, { recursive: true, force: true })
    }
})

test('CI 和发布工作流在构建前运行只读生成检查', () => {
    const ciWorkflow = readFileSync(path.join(REPOSITORY_ROOT, '.github/workflows/ci.yml'), 'utf8')
    const publishWorkflow = readFileSync(path.join(REPOSITORY_ROOT, '.github/workflows/publish.yml'), 'utf8')
    const generatedCheck = 'pnpm check:generated'
    const artifactBuild = 'turbo run build:artifact'

    assert.ok(ciWorkflow.includes(generatedCheck), 'CI 应运行 check:generated')
    assert.ok(publishWorkflow.includes(generatedCheck), '发布工作流应运行 check:generated')
    assert.ok(
        publishWorkflow.indexOf(generatedCheck) < publishWorkflow.indexOf(artifactBuild),
        '发布工作流应在 build:artifact 前运行 check:generated',
    )
})
