#!/usr/bin/env node
/**
 * 自检最近一次提交是否符合 commitlint 规范（跨平台，Windows 兼容）。
 * 与 .husky/commit-msg 钩子同一套规则（docs/guides/COMMIT_CONVENTION.md「兜底验证」）。
 */
import { execSync } from 'node:child_process'

const subject = execSync('git log -1 --pretty=%s', { encoding: 'utf-8' }).trim()
try {
    execSync('pnpm exec commitlint', {
        input: subject + '\n',
        stdio: ['pipe', 'inherit', 'inherit'],
        shell: true,
    })
    console.log('✓ 最近提交符合 commitlint 规范')
    process.exit(0)
} catch {
    console.error(`✗ 最近提交不符合规范：${subject}`)
    process.exit(1)
}
