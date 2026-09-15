import { describe, it } from 'node:test'
import assert from 'node:assert'
import { validateCommandLine } from './check-commands.mjs'

describe('check-commands', () => {
  it('应当通过合法的根命令', () => {
    const err = validateCommandLine('pnpm build', 'test.md', 1)
    assert.strictEqual(err, null)
  })

  it('应当通过合法的包子命令', () => {
    const err = validateCommandLine('pnpm --filter brutx-ui-vue test:watch', 'test.md', 1)
    assert.strictEqual(err, null)
  })

  it('应当通过合法的现有本地脚本路径', () => {
    const err = validateCommandLine('node scripts/docs/check-doc-links.mjs', 'test.md', 1)
    assert.strictEqual(err, null)
  })

  it('应当拦截不存在的根脚本', () => {
    const err = validateCommandLine('pnpm non_existent_script_xyz', 'test.md', 1)
    assert.notStrictEqual(err, null)
    assert.strictEqual(err?.ruleId, 'commands/missing-root-script')
  })

  it('应当拦截子包中不存在的脚本', () => {
    const err = validateCommandLine('pnpm --filter brutx-ui-vue fake_sub_command', 'test.md', 1)
    assert.notStrictEqual(err, null)
    assert.strictEqual(err?.ruleId, 'commands/missing-package-script')
  })

  it('应当拦截不存在的子包名称', () => {
    const err = validateCommandLine('pnpm --filter non_existent_pkg test', 'test.md', 1)
    assert.notStrictEqual(err, null)
    assert.strictEqual(err?.ruleId, 'commands/unknown-filter-target')
  })

  it('应当拦截不存在的本地脚本文件', () => {
    const err = validateCommandLine('node scripts/not-found-script.mjs', 'test.md', 1)
    assert.notStrictEqual(err, null)
    assert.strictEqual(err?.ruleId, 'commands/missing-script-path')
  })

  it('应当跳过带占位符的命令与路径', () => {
    const err1 = validateCommandLine('pnpm --filter <pkg> test <path>', 'test.md', 1)
    assert.strictEqual(err1, null)

    const err2 = validateCommandLine('node scripts/bench-diff.mjs <main-bench.json> <pr-bench.json>', 'test.md', 1)
    assert.strictEqual(err2, null)
  })

  it('checkFileCommands 能够正确解析多行 Markdown 中的围栏与行内命令并报告违规', async () => {
    const { checkFileCommands } = await import('./check-commands.mjs')
    const fs = await import('node:fs')
    const path = await import('node:path')
    const os = await import('node:os')

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-commands-test-'))
    const testMd = path.join(tmpDir, 'test-doc.md')

    const mdContent = [
      '# 测试文档',
      '',
      '这里是一段行内命令：`pnpm non_existent_inline`，应该被检测到。',
      '',
      '````bash',
      '# 四个反引号围栏',
      'pnpm fake_script_in_fence',
      '````',
      '',
      '~~~sh',
      '# 波浪号围栏',
      'pnpm build',
      '~~~',
      '',
      '| 序号 | 命令 |',
      '| --- | --- |',
      '| 1 | `pnpm invalid_in_table` |',
      '',
      '```js',
      '// 非 shell 围栏跳过',
      'const pnpm = 1',
      '```',
    ].join('\n')

    fs.writeFileSync(testMd, mdContent)

    try {
      const violations = checkFileCommands(testMd)
      assert.strictEqual(violations.length, 3)
      assert.strictEqual(violations[0].command, 'pnpm non_existent_inline')
      assert.strictEqual(violations[1].command, 'pnpm fake_script_in_fence')
      assert.strictEqual(violations[2].command, 'pnpm invalid_in_table')
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
