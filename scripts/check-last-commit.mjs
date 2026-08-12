#!/usr/bin/env node
/**
 * 自检最近一次提交是否符合 commitlint 规范（跨平台，Windows 兼容）。
 * 与 .husky/commit-msg 钩子同一套规则（docs/guides/COMMIT_CONVENTION.md「兜底验证」）。
 *
 * 区分「工具链失败」与「提交不符合规范」：pnpm/commitlint 不可用或 git 无提交时，
 * 提示环境问题而非误报提交违规。
 */
import { execSync } from 'node:child_process'

let subject
try {
    subject = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim()
} catch {
    console.error('✗ 无法读取最近提交（仓库无提交 / 分支为空 / git 不可用）')
    process.exit(1)
}

try {
    execSync('pnpm exec commitlint', {
        input: subject + '\n',
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: true,
    })
    console.log('✓ 最近提交符合 commitlint 规范')
    process.exit(0)
} catch (err) {
    const isToolchain = err && (err.code === 'ENOENT' || err.status == null)
    if (isToolchain) {
        console.error('✗ 工具链异常：commitlint / pnpm 不可用或执行失败，请检查安装')
    } else {
        console.error(`✗ 最近提交不符合规范：${subject}`)
    }
    process.exit(1)
}
