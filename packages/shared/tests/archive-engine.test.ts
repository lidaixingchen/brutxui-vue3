import { describe, it, expect, beforeEach } from 'vitest'
import { ArchiveEngine } from '../../../scripts/docs/lib/archive-engine.mjs'
import { MemoryFileSystemAdapter } from '../../../scripts/docs/lib/doc-link-fs.mjs'

describe('ArchiveEngine (方案自动归档与自愈核心引擎)', () => {
  let vfs: MemoryFileSystemAdapter
  const ROOT = '/workspace'
  const mockNow = new Date('2026-09-10T12:00:00Z')

  beforeEach(() => {
    vfs = new MemoryFileSystemAdapter()
  })

  it('单文件由 active 归档为 archived，注入完工日期并完成正向相对链接层级绝对重算', async () => {
    const planContent = [
      '---',
      '方案类型: 重构',
      '状态: active',
      '日期: 2026-08-01',
      '关联文档:',
      '  - ../../guides/DOC_GOVERNANCE.md',
      '---',
      '',
      '# 示例重构方案',
      '',
      '> 本方案针对核心模块进行重构。',
      '',
      '详见 [规范手册](../../guides/DOC_GOVERNANCE.md) 与 [代码规范](../../../AGENTS.md)。',
    ].join('\n')

    const indexContent = [
      '# 文档中心',
      '',
      '<!-- AUTO_ACTIVE_PLANS_START -->',
      '<!-- AUTO_ACTIVE_PLANS_END -->',
      '',
      '<!-- AUTO_ARCHIVE_PLANS_START -->',
      '<!-- AUTO_ARCHIVE_PLANS_END -->',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/guides/DOC_GOVERNANCE.md`, '# Doc Governance')
    await vfs.writeFile(`${ROOT}/AGENTS.md`, '# Agents')
    await vfs.writeFile(`${ROOT}/docs/plans/core/示例重构方案.md`, planContent)
    await vfs.writeFile(`${ROOT}/docs/index.md`, indexContent)

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    const result = await engine.archive('docs/plans/core/示例重构方案.md')

    expect(result.newPath).toBe('docs/archive/2026/core/示例重构方案.md')
    expect(await vfs.pathExists(`${ROOT}/docs/plans/core/示例重构方案.md`)).toBe(false)
    expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/示例重构方案.md`)).toBe(true)

    const archivedContent = await vfs.readFile(`${ROOT}/docs/archive/2026/core/示例重构方案.md`)

    // 断言状态固化与完工日期注入
    expect(archivedContent).toContain('状态: archived')
    expect(archivedContent).toContain('完工日期: 2026-09-10')
    expect(archivedContent).toContain('日期: 2026-08-01')

    // 断言相对链接深度绝对重算（由深度 3 增至深度 4）
    expect(archivedContent).toContain('[规范手册](../../../guides/DOC_GOVERNANCE.md)')
    expect(archivedContent).toContain('[代码规范](../../../../AGENTS.md)')
  })

  it('跨年方案按完工年份归档，杜绝被错误塞入往年封存库', async () => {
    const planContent = [
      '---',
      '方案类型: 架构演进',
      '状态: active',
      '日期: 2025-11-20',
      '---',
      '',
      '# 跨年重大方案',
      '',
      '> 历经数月推进。',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/跨年重大方案.md`, planContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow, // 2026年完工
      git: false,
    })

    const result = await engine.archive('docs/plans/core/跨年重大方案.md')

    expect(result.deliveryYear).toBe('2026')
    expect(result.newPath).toBe('docs/archive/2026/core/跨年重大方案.md')
    expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/跨年重大方案.md`)).toBe(true)
  })

  it('全仓反向引用自动重定向至新归档路径', async () => {
    const planContent = [
      '---',
      '方案类型: 架构',
      '状态: done',
      '日期: 2026-09-01',
      '---',
      '',
      '# 被引用的方案',
    ].join('\n')

    const guideContent = [
      '# 指南文档',
      '',
      '参考方案：[核心方案](../plans/core/被引用的方案.md)。',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/被引用的方案.md`, planContent)
    await vfs.writeFile(`${ROOT}/docs/guides/GUIDE.md`, guideContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await engine.archive('docs/plans/core/被引用的方案.md')

    const updatedGuide = await vfs.readFile(`${ROOT}/docs/guides/GUIDE.md`)
    expect(updatedGuide).toContain('[核心方案](../archive/2026/core/被引用的方案.md)')
  })

  it('声明式更新 docs/index.md 活跃区与归档区排版', async () => {
    const planA = [
      '---',
      '方案类型: CLI',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# 活跃方案A',
      '> 这是一个活跃方案。',
    ].join('\n')

    const planB = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-02',
      '---',
      '# 待归档方案B',
      '> 即将完结的方案。',
    ].join('\n')

    const indexTemplate = [
      '# BrutxUI 文档中心',
      '',
      '<!-- AUTO_ACTIVE_PLANS_START -->',
      '旧活跃内容',
      '<!-- AUTO_ACTIVE_PLANS_END -->',
      '',
      '<!-- AUTO_ARCHIVE_PLANS_START -->',
      '旧归档内容',
      '<!-- AUTO_ARCHIVE_PLANS_END -->',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/cli/活跃方案A.md`, planA)
    await vfs.writeFile(`${ROOT}/docs/plans/core/待归档方案B.md`, planB)
    await vfs.writeFile(`${ROOT}/docs/index.md`, indexTemplate)

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await engine.archive('docs/plans/core/待归档方案B.md')

    const newIndex = await vfs.readFile(`${ROOT}/docs/index.md`)

    // 活跃区应该仍有 planA，但没有 planB
    expect(newIndex).toContain('[活跃方案A](plans/cli/活跃方案A.md)')
    expect(newIndex).not.toContain('[待归档方案B](plans/core/待归档方案B.md)')

    // 归档区应该有 2026 年度统计与主题名
    expect(newIndex).toContain('### 2026 年度落地方案')
    expect(newIndex).toContain('核心架构与基建（1 篇）')
    expect(newIndex).toContain('待归档方案B等。')
  })

  it('--dry-run 模式下不修改磁盘与文件树', async () => {
    const planContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# 测试方案',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/测试方案.md`, planContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      dryRun: true,
      git: false,
    })

    const result = await engine.archive('docs/plans/core/测试方案.md')

    expect(result.dryRun).toBe(true)
    expect(await vfs.pathExists(`${ROOT}/docs/plans/core/测试方案.md`)).toBe(true)
    expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/测试方案.md`)).toBe(false)
  })

  it('目标归档路径已存在同名文件时安全抛错阻断', async () => {
    const planContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# 冲突方案',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/冲突方案.md`, planContent)
    await vfs.writeFile(`${ROOT}/docs/archive/2026/core/冲突方案.md`, '# 已存在的归档文件')

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await expect(engine.archive('docs/plans/core/冲突方案.md')).rejects.toThrow(
      /目标归档路径已存在同名文件/
    )
  })

  it('docs/index.md 缺失标记时抛出防御性异常，阻止静默假成功', async () => {
    const planContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# 无标记方案',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/无标记方案.md`, planContent)
    // index.md 缺少标记注释
    await vfs.writeFile(`${ROOT}/docs/index.md`, '# 没有标记的知识地图')

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await expect(engine.archive('docs/plans/core/无标记方案.md')).rejects.toThrow(
      /缺失活跃方案区域标记/
    )
  })

  it('0 篇领域在归档区中渲染为无死超链接的纯文本形式', async () => {
    const planContent = [
      '---',
      '方案类型: CLI',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# CLI单项方案',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/cli/CLI单项方案.md`, planContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await engine.archive('docs/plans/cli/CLI单项方案.md')

    const newIndex = await vfs.readFile(`${ROOT}/docs/index.md`)

    // CLI 有 1 篇，有超链接
    expect(newIndex).toContain('[CLI 领域（1 篇）](archive/2026/cli/)')
    // UI 为 0 篇，无超链接，防 404
    expect(newIndex).toContain('- **UI 组件领域（0 篇）**：暂无归档。')
    expect(newIndex).not.toContain('(archive/2026/ui/)')
  })

  it('Windows CRLF 换行符的文档在更新 Frontmatter 后保持原换行符不变', async () => {
    const crlfContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '',
      '# CRLF 测试方案',
    ].join('\r\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/CRLF方案.md`, crlfContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    await engine.archive('docs/plans/core/CRLF方案.md')

    const archived = await vfs.readFile(`${ROOT}/docs/archive/2026/core/CRLF方案.md`)
    expect(archived).toContain('\r\n完工日期: 2026-09-10\r\n')
    expect(archived.includes('\r\n')).toBe(true)
  })
})
