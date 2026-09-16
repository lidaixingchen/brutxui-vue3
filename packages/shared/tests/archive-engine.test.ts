import path from 'node:path'
import { describe, it, expect, beforeEach } from 'vitest'
import { ArchiveEngine, resolvePlanInputPath } from '../../../scripts/docs/lib/archive-engine.mjs'
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

  it('VALID_STATUSES 严格收敛为 draft, active, done, archived，且不包含 implemented', async () => {
    const { VALID_STATUSES } = await import('../../../scripts/docs/lib/archive-engine.mjs')
    expect(VALID_STATUSES).toEqual(['draft', 'active', 'done', 'archived'])
    expect(VALID_STATUSES).not.toContain('implemented')
  })

  it('refreshIndex 支持 checkOnly 与落盘模式，覆盖新方案感知与幂等性', async () => {
    const planContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-15',
      '---',
      '',
      '# 新增活跃方案',
      '',
      '> 这是一个活跃方案的测试描述。',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/新增活跃方案.md`, planContent)
    await vfs.writeFile(
      `${ROOT}/docs/index.md`,
      '<!-- AUTO_ACTIVE_PLANS_START -->\n旧活跃区内容\n<!-- AUTO_ACTIVE_PLANS_END -->\n<!-- AUTO_ARCHIVE_PLANS_START -->\n<!-- AUTO_ARCHIVE_PLANS_END -->'
    )

    const engine = new ArchiveEngine({
      rootDir: ROOT,
      fs: vfs,
      now: mockNow,
      git: false,
    })

    // 1. checkOnly 为 true，检测到不一致
    const checkRes = await engine.refreshIndex({ checkOnly: true })
    expect(checkRes.consistent).toBe(false)
    expect(checkRes.changed).toBe(true)

    // 确认 index.md 此时未被修改
    const unchangedIndex = await vfs.readFile(`${ROOT}/docs/index.md`)
    expect(unchangedIndex).toContain('旧活跃区内容')

    // 2. 执行刷新落盘
    const refreshRes = await engine.refreshIndex({ checkOnly: false })
    expect(refreshRes.changed).toBe(true)

    const updatedIndex = await vfs.readFile(`${ROOT}/docs/index.md`)
    expect(updatedIndex).toContain('[新增活跃方案](plans/core/新增活跃方案.md)（状态：`active`）')
    expect(updatedIndex).toContain('*这是一个活跃方案的测试描述。*')

    // 3. 再次 checkOnly，应当一致（幂等）
    const idempotentCheck = await engine.refreshIndex({ checkOnly: true })
    expect(idempotentCheck.consistent).toBe(true)
    expect(idempotentCheck.changed).toBe(false)
  })

  it('archiveAllDone 能够精准提取全部 done 方案批量归档并保持幂等', async () => {
    const planDraft = '---\n方案类型: 核心\n状态: draft\n日期: 2026-09-01\n---\n# 草案\n'
    const planActive = '---\n方案类型: 核心\n状态: active\n日期: 2026-09-01\n---\n# 活跃\n'
    const planDone1 = '---\n方案类型: core\n状态: done\n日期: 2026-09-01\n---\n# 待归档1\n'
    const planDone2 = '---\n方案类型: cli\n状态: done\n日期: 2026-09-01\n---\n# 待归档2\n'

    await vfs.writeFile(`${ROOT}/docs/plans/core/草案.md`, planDraft)
    await vfs.writeFile(`${ROOT}/docs/plans/core/活跃.md`, planActive)
    await vfs.writeFile(`${ROOT}/docs/plans/core/待归档1.md`, planDone1)
    await vfs.writeFile(`${ROOT}/docs/plans/cli/待归档2.md`, planDone2)
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

    const results = await engine.archiveAllDone()
    expect(results).toHaveLength(2)
    expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/待归档1.md`)).toBe(true)
    expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/cli/待归档2.md`)).toBe(true)
    expect(await vfs.pathExists(`${ROOT}/docs/plans/core/草案.md`)).toBe(true)
    expect(await vfs.pathExists(`${ROOT}/docs/plans/core/活跃.md`)).toBe(true)

    // 再次调用，没有待归档方案
    const secondResults = await engine.archiveAllDone()
    expect(secondResults).toHaveLength(0)
  })

  it('支持 Windows 前缀路径输入并自愈 Frontmatter 关联文档相对路径', async () => {
    const planContent = [
      '---',
      '方案类型: 核心',
      '状态: active',
      '日期: 2026-09-01',
      '关联文档:',
      '  - ../../guides/DOC_GOVERNANCE.md',
      '  - https://example.com/external',
      '---',
      '# 路径容错方案',
    ].join('\n')

    await vfs.writeFile(`${ROOT}/docs/plans/core/路径容错方案.md`, planContent)
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

    // 模拟 Windows PowerShell 补全输入带有 .\\docs\\plans\\...
    const result = await engine.archive('.\\docs\\plans\\core\\路径容错方案.md')
    expect(result.newPath).toBe('docs/archive/2026/core/路径容错方案.md')

    const archived = await vfs.readFile(`${ROOT}/docs/archive/2026/core/路径容错方案.md`)
    // 相对路径由 ../../ 自愈为 ../../../
    expect(archived).toContain('- ../../../guides/DOC_GOVERNANCE.md')
    // 外部链接保持不变
    expect(archived).toContain('- https://example.com/external')
  })

  it('resolvePlanInputPath 跨平台纯逻辑矩阵：正反斜杠、混合分隔符、点段与绝对路径解析', () => {
    const rootPosix = '/workspace/repo'
    const rootWin = 'C:\\workspace\\repo'

    // 1. 可移植相对路径在 Linux (posix) 语义下解析为统一的 docs/plans/...
    const posixRes1 = resolvePlanInputPath('.\\docs\\plans\\core\\a.md', rootPosix, {
      platform: 'linux',
      pathImpl: path.posix,
    })
    expect(posixRes1.normalizedRel).toBe('docs/plans/core/a.md')
    expect(posixRes1.absPath).toBe('/workspace/repo/docs/plans/core/a.md')

    const posixRes2 = resolvePlanInputPath('docs\\plans/core\\sub/a.md', rootPosix, {
      platform: 'linux',
      pathImpl: path.posix,
    })
    expect(posixRes2.normalizedRel).toBe('docs/plans/core/sub/a.md')

    // 2. 合法点段折叠
    const foldedRes = resolvePlanInputPath('./docs/plans/core/../core/b.md', rootPosix, {
      platform: 'linux',
      pathImpl: path.posix,
    })
    expect(foldedRes.normalizedRel).toBe('docs/plans/core/b.md')

    // 3. 可移植相对路径在 Windows 语义下正确解析
    const winRes = resolvePlanInputPath('.\\docs\\plans\\core\\a.md', rootWin, {
      platform: 'win32',
      pathImpl: path.win32,
    })
    expect(winRes.normalizedRel).toBe('docs/plans/core/a.md')
    expect(winRes.absPath).toBe('C:\\workspace\\repo\\docs\\plans\\core\\a.md')

    // 4. Linux 原生绝对路径接受合法范围
    const posixAbs = resolvePlanInputPath('/workspace/repo/docs/plans/core/a.md', rootPosix, {
      platform: 'linux',
      pathImpl: path.posix,
    })
    expect(posixAbs.normalizedRel).toBe('docs/plans/core/a.md')

    // 5. Windows 原生绝对路径接受合法范围
    const winAbs = resolvePlanInputPath('C:\\workspace\\repo\\docs\\plans\\core\\a.md', rootWin, {
      platform: 'win32',
      pathImpl: path.win32,
    })
    expect(winAbs.normalizedRel).toBe('docs/plans/core/a.md')
  })

  it('resolvePlanInputPath 严格拒绝非法及异系统格式', () => {
    const rootPosix = '/workspace/repo'
    const rootWin = 'C:\\workspace\\repo'

    // 1. 空输入
    expect(() => resolvePlanInputPath('', rootPosix)).toThrow(/待归档方案路径不能为空/)
    expect(() => resolvePlanInputPath('   ', rootPosix)).toThrow(/待归档方案路径不能为空/)

    // 2. URL 协议拒绝
    expect(() => resolvePlanInputPath('file:///workspace/repo/docs/plans/a.md', rootPosix)).toThrow(/不支持 URL 格式/)
    expect(() => resolvePlanInputPath('https://example.com/a.md', rootPosix)).toThrow(/不支持 URL 格式/)

    // 3. UNC 路径拒绝
    expect(() => resolvePlanInputPath('\\\\server\\share\\a.md', rootPosix)).toThrow(/不支持 UNC 路径/)
    expect(() => resolvePlanInputPath('//server/share/a.md', rootPosix)).toThrow(/不支持 UNC 路径/)

    // 4. Windows 驱动器相对路径拒绝
    expect(() => resolvePlanInputPath('C:relative.md', rootWin, { platform: 'win32', pathImpl: path.win32 })).toThrow(/不支持 Windows 驱动器相对路径/)

    // 5. Windows 隐式当前驱动器根相对路径拒绝
    expect(() => resolvePlanInputPath('/tmp/a.md', rootWin, { platform: 'win32', pathImpl: path.win32 })).toThrow(/不支持隐式当前驱动器的根相对路径/)
    expect(() => resolvePlanInputPath('\\tmp\\a.md', rootWin, { platform: 'win32', pathImpl: path.win32 })).toThrow(/不支持隐式当前驱动器的根相对路径/)

    // 6. Linux 平台拒绝跨系统绝对路径（禁止静默拼入 cwd）
    expect(() => resolvePlanInputPath('C:\\workspace\\repo\\docs\\plans\\a.md', rootPosix, { platform: 'linux', pathImpl: path.posix })).toThrow(/不支持跨操作系统绝对路径/)
    expect(() => resolvePlanInputPath('D:/workspace/repo/docs/plans/a.md', rootPosix, { platform: 'linux', pathImpl: path.posix })).toThrow(/不支持跨操作系统绝对路径/)

    // 7. 越界拒绝
    expect(() => resolvePlanInputPath('docs/plans/../../guides/DOC.md', rootPosix, { platform: 'linux', pathImpl: path.posix })).toThrow(/待归档方案必须位于 docs\/plans\/ 目录下/)
    expect(() => resolvePlanInputPath('../../etc/passwd', rootPosix, { platform: 'linux', pathImpl: path.posix })).toThrow(/待归档方案必须位于 docs\/plans\/ 目录下/)
  })

  describe('归档安全加固与真实路径核验', () => {
    const validPlanContent = [
      '---',
      '方案类型: 重构',
      '状态: active',
      '日期: 2026-09-01',
      '---',
      '# 安全加固方案',
    ].join('\n')

    const baseIndexContent = [
      '# 文档中心',
      '<!-- AUTO_ACTIVE_PLANS_START -->',
      '<!-- AUTO_ACTIVE_PLANS_END -->',
      '<!-- AUTO_ARCHIVE_PLANS_START -->',
      '<!-- AUTO_ARCHIVE_PLANS_END -->',
    ].join('\n')

    it('拒绝源文件本身为符号链接，保持文件与索引未修改', async () => {
      await vfs.writeFile(`${ROOT}/docs/plans/core/real.md`, validPlanContent)
      await vfs.symlink(`${ROOT}/docs/plans/core/real.md`, `${ROOT}/docs/plans/core/symlink.md`)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false })
      await expect(engine.archive('docs/plans/core/symlink.md')).rejects.toThrow(/待归档方案文件不能为符号链接/)

      expect(await vfs.pathExists(`${ROOT}/docs/plans/core/real.md`)).toBe(true)
      expect(await vfs.pathExists(`${ROOT}/docs/plans/core/symlink.md`)).toBe(true)
      expect(await vfs.readFile(`${ROOT}/docs/index.md`)).toBe(baseIndexContent)
    })

    it('拒绝源目录通过符号链接导向仓库范围外', async () => {
      await vfs.writeFile('/outside/plans/secret.md', validPlanContent)
      await vfs.symlink('/outside/plans', `${ROOT}/docs/plans/external`)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false })
      await expect(engine.archive('docs/plans/external/secret.md')).rejects.toThrow(/待归档方案真实路径超出 docs\/plans\/ 范围/)
    })

    it('拒绝归档目标祖先目录通过符号链接导向仓库范围外', async () => {
      await vfs.writeFile(`${ROOT}/docs/plans/core/plan.md`, validPlanContent)
      await vfs.ensureDir('/outside/archive')
      await vfs.symlink('/outside/archive', `${ROOT}/docs/archive`)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false })
      await expect(engine.archive('docs/plans/core/plan.md')).rejects.toThrow(/归档目标目录的祖先目录真实路径超出仓库根目录范围/)
    })

    it('目标多级目录尚不存在时安全创建祖先并完成归档', async () => {
      await vfs.writeFile(`${ROOT}/docs/plans/core/new-plan.md`, validPlanContent)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false })
      const result = await engine.archive('docs/plans/core/new-plan.md')

      expect(result.newPath).toBe('docs/archive/2026/core/new-plan.md')
      expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/new-plan.md`)).toBe(true)
      expect(await vfs.pathExists(`${ROOT}/docs/plans/core/new-plan.md`)).toBe(false)
    })

    it('允许仓库范围内的合法目录符号链接', async () => {
      await vfs.writeFile(`${ROOT}/docs/plans/core/target.md`, validPlanContent)
      await vfs.symlink(`${ROOT}/docs/plans/core`, `${ROOT}/docs/plans/internal-symlink`)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false })
      const result = await engine.archive('docs/plans/internal-symlink/target.md')

      expect(result.newPath).toBe('docs/archive/2026/core/target.md')
      expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/target.md`)).toBe(true)
    })

    it('dry-run 完整执行安全预检与链接重算，但保持文件树绝对不变', async () => {
      await vfs.writeFile(`${ROOT}/docs/plans/core/dry-plan.md`, validPlanContent)
      await vfs.writeFile(`${ROOT}/docs/index.md`, baseIndexContent)

      const engine = new ArchiveEngine({ rootDir: ROOT, fs: vfs, now: mockNow, git: false, dryRun: true })
      const result = await engine.archive('docs/plans/core/dry-plan.md')

      expect(result.dryRun).toBe(true)
      expect(result.newPath).toBe('docs/archive/2026/core/dry-plan.md')
      expect(await vfs.pathExists(`${ROOT}/docs/plans/core/dry-plan.md`)).toBe(true)
      expect(await vfs.pathExists(`${ROOT}/docs/archive/2026/core/dry-plan.md`)).toBe(false)
      expect(await vfs.readFile(`${ROOT}/docs/index.md`)).toBe(baseIndexContent)
    })
  })
})


