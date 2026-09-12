import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
    chmodSync,
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    rmdirSync,
    statSync,
    symlinkSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { checkStagedSnapshot, determineAffectedPackages } from './check-staged-snapshot.mjs'

const UI_SOURCE = 'packages/ui/src/components/example/Example.vue'
const UI_GENERATOR = 'packages/ui/scripts/generate.ts'
const UI_MANIFEST = 'packages/ui/registry-manifest.json'
const UI_STYLES = 'packages/ui/src/styles.css'
const SHARED_TOKENS = 'packages/shared/src/design-tokens.ts'

function runGit(repoRoot, ...args) {
    return execFileSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    }).trim()
}

function writeRepoFile(repoRoot, relativePath, content, mode = 0o644) {
    const filePath = join(repoRoot, relativePath)
    mkdirSync(join(filePath, '..'), { recursive: true })
    writeFileSync(filePath, content)
    chmodSync(filePath, mode)
}

function createRepo() {
    const repoRoot = mkdtempSync(join(tmpdir(), 'brutx-snapshot-test-'))
    runGit(repoRoot, 'init', '--quiet')
    runGit(repoRoot, 'config', 'user.email', 'snapshot@example.test')
    runGit(repoRoot, 'config', 'user.name', 'Snapshot Test')
    writeRepoFile(repoRoot, 'packages/ui/package.json', '{"name":"ui"}\n')
    writeRepoFile(repoRoot, 'packages/cli/package.json', '{"name":"cli"}\n')
    writeRepoFile(repoRoot, 'packages/shared/package.json', '{"name":"brutx-shared-vue"}\n')
    writeRepoFile(repoRoot, UI_GENERATOR, 'export const source = "base"\n')
    writeRepoFile(repoRoot, UI_SOURCE, '<template>base</template>\n')
    writeRepoFile(repoRoot, SHARED_TOKENS, 'export const TOKEN = "base"\n')
    writeRepoFile(repoRoot, UI_MANIFEST, '{"source":"base"}\n')
    writeRepoFile(repoRoot, UI_STYLES, '/* @brutx:theme-tokens:start */\nbase\n/* @brutx:theme-tokens:end */\nmanual\n')
    writeRepoFile(repoRoot, 'packages/ui/src/components/example/runner\tinput.ts', 'export const value = "base"\n', 0o755)
    writeRepoFile(repoRoot, '.gitignore', 'packages/ui/src/components/*/index.ts\n')
    runGit(repoRoot, 'add', '.')
    runGit(repoRoot, 'commit', '--quiet', '-m', 'fixture')
    return repoRoot
}

function removeFixtureTree(targetPath) {
    const targetStat = lstatSync(targetPath)
    if (!targetStat.isDirectory()) {
        unlinkSync(targetPath)
        return
    }
    for (const entry of readdirSync(targetPath)) removeFixtureTree(join(targetPath, entry))
    rmdirSync(targetPath)
}

function disposeRepo(repoRoot) {
    if (existsSync(repoRoot)) removeFixtureTree(repoRoot)
}

function stageFile(repoRoot, relativePath, content, mode = 0o644) {
    writeRepoFile(repoRoot, relativePath, content)
    chmodSync(join(repoRoot, relativePath), mode)
    runGit(repoRoot, 'add', '--', relativePath)
}

function modifyWorktree(repoRoot, relativePath, content) {
    writeRepoFile(repoRoot, relativePath, content)
}

function createRunner(calls, implementation) {
    return async request => {
        calls.push(request)
        return implementation(request)
    }
}

function successfulRun(stdout = '') {
    return { exitCode: 0, stdout, stderr: '' }
}

function failedRun(stderr) {
    return { exitCode: 1, stdout: '', stderr }
}

test('只按 index 快照运行 UI 生成检查，并保持工作树和 index 不变', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    const calls = []
    stageFile(repoRoot, UI_SOURCE, '<template>staged</template>\n')
    stageFile(repoRoot, UI_GENERATOR, 'export const source = "staged"\n')
    stageFile(repoRoot, UI_MANIFEST, '{"source":"staged"}\n')
    modifyWorktree(repoRoot, UI_SOURCE, '<template>unstaged</template>\n')
    modifyWorktree(repoRoot, UI_GENERATOR, 'export const source = "unstaged"\n')
    const indexBefore = readFileSync(join(repoRoot, runGit(repoRoot, 'rev-parse', '--git-path', 'index')))
    const statusBefore = runGit(repoRoot, 'status', '--porcelain=v1', '--untracked-files=all')
    const result = await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner(calls, ({ packageName, candidateRoot }) => {
            assert.equal(packageName, 'ui')
            assert.equal(readFileSync(join(candidateRoot, UI_SOURCE), 'utf8'), '<template>staged</template>\n')
            assert.equal(readFileSync(join(candidateRoot, UI_GENERATOR), 'utf8'), 'export const source = "staged"\n')
            assert.equal(readFileSync(join(candidateRoot, UI_MANIFEST), 'utf8'), '{"source":"staged"}\n')
            return successfulRun()
        }),
    })
    const indexAfter = readFileSync(join(repoRoot, runGit(repoRoot, 'rev-parse', '--git-path', 'index')))
    const statusAfter = runGit(repoRoot, 'status', '--porcelain=v1', '--untracked-files=all')

    assert.equal(result.checked, true)
    assert.deepEqual(calls.map(call => call.packageName), ['ui'])
    assert.deepEqual(indexAfter, indexBefore)
    assert.equal(statusAfter, statusBefore)
})

test('即使 Git status 未变化也能检测工作树文件字节被改写', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, UI_SOURCE, '<template>staged</template>\n')
    runGit(repoRoot, 'update-index', '--assume-unchanged', '--', UI_SOURCE)
    const indexPath = join(repoRoot, runGit(repoRoot, 'rev-parse', '--git-path', 'index'))
    const indexBefore = readFileSync(indexPath)
    const statusBefore = runGit(repoRoot, 'status', '--porcelain=v1', '--untracked-files=all')

    await assert.rejects(
        checkStagedSnapshot({
            repoRoot,
            generatorRunner: createRunner([], ({ packageName }) => {
                assert.equal(packageName, 'ui')
                writeRepoFile(repoRoot, UI_SOURCE, '<template>silently changed</template>\n')
                return successfulRun()
            }),
        }),
        /工作树文件内容\/状态/,
    )

    assert.deepEqual(readFileSync(indexPath), indexBefore)
    assert.equal(runGit(repoRoot, 'status', '--porcelain=v1', '--untracked-files=all'), statusBefore)
})

test('根生成输入和快照检查入口会检查两个包，文档仍走快速路径', () => {
    assert.deepEqual(
        determineAffectedPackages([
            'package.json',
            'pnpm-lock.yaml',
            'pnpm-workspace.yaml',
            'tsconfig.base.json',
            '.husky/pre-commit',
            'scripts/generation/check-staged-snapshot.mjs',
            'scripts/generation/check-staged-snapshot-support.mjs',
        ]),
        ['ui', 'cli'],
    )
    assert.deepEqual(determineAffectedPackages(['docs/notes.md']), [])
    assert.deepEqual(determineAffectedPackages(['scripts/generation/check-staged-snapshot.test.mjs']), [])
})

test('跨文件未暂存 Shared 输入不会污染候选快照', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, UI_SOURCE, '<template>staged</template>\n')
    stageFile(repoRoot, UI_MANIFEST, '{"source":"base","token":"base"}\n')
    modifyWorktree(repoRoot, SHARED_TOKENS, 'export const TOKEN = "unstaged"\n')
    const calls = []
    await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner(calls, ({ candidateRoot }) => {
            assert.equal(readFileSync(join(candidateRoot, SHARED_TOKENS), 'utf8'), 'export const TOKEN = "base"\n')
            return successfulRun()
        }),
    })
    assert.deepEqual(calls.map(call => call.packageName), ['ui'])
})

test('同一快照中的 CLI 生成检查使用候选 Shared 输入', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, SHARED_TOKENS, 'export const TOKEN = "staged"\n')
    modifyWorktree(repoRoot, SHARED_TOKENS, 'export const TOKEN = "unstaged"\n')
    const calls = []
    await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner(calls, ({ candidateRoot }) => {
            assert.equal(readFileSync(join(candidateRoot, SHARED_TOKENS), 'utf8'), 'export const TOKEN = "staged"\n')
            return successfulRun()
        }),
    })
    assert.deepEqual(calls.map(call => call.packageName), ['ui', 'cli'])
})

test('候选组件引用未跟踪手写依赖时明确失败', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, UI_SOURCE, '<script setup>import helper from "./helper"</script>\n')
    stageFile(repoRoot, UI_MANIFEST, '{"source":"staged"}\n')
    writeRepoFile(repoRoot, 'packages/ui/src/components/example/helper.ts', 'export default 1\n')
    await assert.rejects(
        checkStagedSnapshot({
            repoRoot,
            generatorRunner: createRunner([], ({ candidateRoot }) => {
                assert.equal(existsSync(join(candidateRoot, 'packages/ui/src/components/example/helper.ts')), false)
                return failedRun('Error [ERR_MODULE_NOT_FOUND]: ./helper.ts')
            }),
        }),
        /候选快照缺少手写依赖/,
    )
})

test('候选依赖不会通过外部 workspace 符号链接回指工作树源码', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    mkdirSync(join(repoRoot, 'node_modules'), { recursive: true })
    symlinkSync(join(repoRoot, 'packages/shared'), join(repoRoot, 'node_modules/brutx-shared-vue'))
    symlinkSync(join(repoRoot, 'packages/shared'), join(repoRoot, 'node_modules/legacy-shared'))
    stageFile(repoRoot, UI_SOURCE, '<template>staged</template>\n')

    await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner([], ({ candidateRoot }) => {
            assert.equal(
                realpathSync(join(candidateRoot, 'node_modules/brutx-shared-vue')),
                realpathSync(join(candidateRoot, 'packages/shared')),
            )
            assert.equal(existsSync(join(candidateRoot, 'node_modules/legacy-shared')), false)
            return successfulRun()
        }),
    })
})

test('混合输出只校验暂存生成区域并保留暂存手写区域', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(
        repoRoot,
        UI_STYLES,
        '/* @brutx:theme-tokens:start */\nstaged-generated\n/* @brutx:theme-tokens:end */\nstaged-manual\n',
    )
    modifyWorktree(
        repoRoot,
        UI_STYLES,
        '/* @brutx:theme-tokens:start */\nstaged-generated\n/* @brutx:theme-tokens:end */\nunstaged-manual\n',
    )
    await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner([], ({ candidateRoot }) => {
            assert.equal(
                readFileSync(join(candidateRoot, UI_STYLES), 'utf8'),
                '/* @brutx:theme-tokens:start */\nstaged-generated\n/* @brutx:theme-tokens:end */\nstaged-manual\n',
            )
            return successfulRun()
        }),
    })
})

test('生成漂移失败并指出文件和显式生成命令', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, UI_SOURCE, '<template>staged</template>\n')
    stageFile(repoRoot, UI_MANIFEST, '{"source":"stale"}\n')
    await assert.rejects(
        checkStagedSnapshot({
            repoRoot,
            generatorRunner: createRunner([], ({ candidateRoot }) =>
                failedRun(`生成内容与 ${join(candidateRoot, UI_MANIFEST)} 不一致`),
            ),
        }),
        error => /registry-manifest\.json/.test(error.message) && /pnpm --filter brutx-ui-vue generate/.test(error.message),
    )
})

test('仅文档暂存时快速通过且不运行生成器', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, 'docs/notes.md', 'docs\n')
    let called = false
    const result = await checkStagedSnapshot({
        repoRoot,
        generatorRunner: async () => {
            called = true
            return successfulRun()
        },
    })
    assert.equal(result.checked, false)
    assert.equal(called, false)
})

test('物化 index 保留带制表符路径内容和可执行 mode', async t => {
    const repoRoot = createRepo()
    t.after(() => disposeRepo(repoRoot))
    stageFile(repoRoot, 'packages/ui/src/components/example/runner\tinput.ts', 'export const value = "staged"\n', 0o755)
    await checkStagedSnapshot({
        repoRoot,
        generatorRunner: createRunner([], ({ candidateRoot }) => {
            const filePath = join(candidateRoot, 'packages/ui/src/components/example/runner\tinput.ts')
            assert.equal(readFileSync(filePath, 'utf8'), 'export const value = "staged"\n')
            assert.equal(statSync(filePath).mode & 0o111, 0o111)
            assert.equal(existsSync(join(candidateRoot, 'packages/ui/src/components/example/index.ts')), false)
            return successfulRun()
        }),
    })
})
