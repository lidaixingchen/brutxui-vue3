/**
 * 方案自动归档与知识地图自愈核心引擎 (ArchiveEngine)
 *
 * 核心架构特性：
 * 1. 守卫与变异解耦：独立深模块，与只读 CI 守卫 scan-doc-status 彻底分离；
 * 2. 两阶段事务模型：Phase 1 纯内存预检（0 I/O 变更，支持 --dry-run）；Phase 2 原子落盘与精准暂存；
 * 3. 权威完工年份推导：基于完工交付日期的年份推导目标归档目录，彻底杜绝跨年方案被移入往年封存库；
 * 4. 双向链接拓扑自愈：复用 DocLinkEngine 的 CommonMark 分词与原位切片算法，同时自愈文档自身（正向）与全仓反向引用；
 * 5. 声明式知识地图派生：基于全仓扫描元数据纯函数投影 docs/index.md 标记区块，格式化排版篇数与标点；
 * 6. 精准原子暂存：仅 git add 变更涉及的精准文件列表，严禁全局暂存污染工作区。
 */

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import {
  extractMarkdownLinks,
  applySpanReplacements,
  splitTarget,
  isExternal,
  safeDecodeURI,
} from './doc-link-engine.mjs'
import { toPosixPath, isInsideDir } from '../../shared/path.mjs'
import { DiskFileSystemAdapter } from './doc-link-fs.mjs'

export const DOMAINS = ['cli', 'ui', 'styles', 'core']

export const DEFAULT_MAX_ARCHIVE_TOPICS = 5

export const VALID_STATUSES = ['draft', 'active', 'done', 'archived']
export const VALID_STATUS_SET = new Set(VALID_STATUSES)

export const DOMAIN_META = {
  cli: {
    title: 'CLI 工具链（CLI）',
    archiveTitle: 'CLI 领域',
    order: 1,
  },
  ui: {
    title: 'UI 组件体系（UI）',
    archiveTitle: 'UI 组件领域',
    order: 2,
  },
  styles: {
    title: '样式与设计系统（Styles）',
    archiveTitle: '样式与设计系统',
    order: 3,
  },
  core: {
    title: '全局核心架构（Core）',
    archiveTitle: '核心架构与基建',
    order: 4,
  },
}

export const ACTIVE_START_TAG = '<!-- AUTO_ACTIVE_PLANS_START -->'
export const ACTIVE_END_TAG = '<!-- AUTO_ACTIVE_PLANS_END -->'
export const ARCHIVE_START_TAG = '<!-- AUTO_ARCHIVE_PLANS_START -->'
export const ARCHIVE_END_TAG = '<!-- AUTO_ARCHIVE_PLANS_END -->'

export function normalizeStatus(raw) {
  if (!raw) return null
  const cleaned = raw.replace(/[*_`]/g, '').trim().toLowerCase()
  for (const s of VALID_STATUSES) {
    if (cleaned.startsWith(s)) return s
  }
  return cleaned
}

/**
 * 归档方案时间戳排序器（纯函数 Seam）
 * 排序优先级：
 * 1. 完工日期（或日期）倒序（最新优先）
 * 2. 完工日期相同时，按主题名显式使用 zh-CN 中文拼音倒序，保证跨操作系统与 CI 环境绝对一致
 * 3. 若主题名仍相同，使用相对文件路径倒序兜底，构成严格全序关系
 */
export function compareArchivePlanMetas(a, b) {
  if (a.date !== b.date) {
    return b.date.localeCompare(a.date)
  }
  const topicDiff = b.topic.localeCompare(a.topic, 'zh-CN')
  if (topicDiff !== 0) {
    return topicDiff
  }
  return (b.file || '').localeCompare(a.file || '')
}

export function parseFrontmatter(content) {
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!yamlMatch) return null

  const yaml = yamlMatch[1]
  const getField = (name) => {
    const m = yaml.match(new RegExp(`^${name}[：:]\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : null
  }

  const rawStatus = getField('状态')
  const status = normalizeStatus(rawStatus)

  return {
    format: 'yaml',
    type: getField('方案类型'),
    status,
    rawStatus,
    date: getField('日期'),
    completionDate: getField('完工日期'),
    yamlBlock: yamlMatch[0],
    yamlInner: yaml,
  }
}

export function updateFrontmatter(
  content,
  newStatus,
  completionDate,
  rootDir = process.cwd(),
  oldRelPath = null,
  newRelPath = null
) {
  const eolMatch = content.match(/\r\n|\n/)
  const eol = eolMatch ? eolMatch[0] : '\n'

  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!yamlMatch) return content

  let yaml = yamlMatch[1]

  if (/^状态[：:]/m.test(yaml)) {
    yaml = yaml.replace(/^状态[：:].*$/m, `状态: ${newStatus}`)
  } else {
    yaml += `${eol}状态: ${newStatus}`
  }

  if (/^完工日期[：:]/m.test(yaml)) {
    yaml = yaml.replace(/^完工日期[：:].*$/m, `完工日期: ${completionDate}`)
  } else if (/^日期[：:].*$/m.test(yaml)) {
    yaml = yaml.replace(/^(日期[：:].*)$/m, `$1${eol}完工日期: ${completionDate}`)
  } else {
    yaml += `${eol}完工日期: ${completionDate}`
  }

  if (oldRelPath && newRelPath) {
    const oldDirAbs = path.resolve(rootDir, path.dirname(oldRelPath))
    const newDirAbs = path.resolve(rootDir, path.dirname(newRelPath))
    const docSectionMatch = yaml.match(/(关联文档[：:][\s\S]*?)(?=(?:\r?\n[^\s#-]+[：:]|$))/)
    if (docSectionMatch) {
      const origSection = docSectionMatch[1]
      const updatedSection = origSection.replace(/^(\s*-\s+)(.+)$/gm, (match, prefix, linkTarget) => {
        const trimmed = linkTarget.trim()
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return match
        const portableTarget = toPosixPath(trimmed)
        const targetAbs = path.resolve(oldDirAbs, portableTarget)
        const newRel = toPosixPath(path.relative(newDirAbs, targetAbs))
        return `${prefix}${newRel}`
      })
      yaml = yaml.replace(origSection, updatedSection)
    }
  }

  return content.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---${eol}${yaml.trim()}${eol}---`)
}

export function deriveDomain(relPath) {
  const parts = toPosixPath(relPath).split('/')
  if (parts.includes('plans')) {
    const idx = parts.indexOf('plans')
    return parts[idx + 1] || 'core'
  }
  if (parts.includes('archive')) {
    const idx = parts.indexOf('archive')
    return parts[idx + 2] || 'core'
  }
  return 'core'
}

export function deriveDeliveryYear(fm, now = new Date()) {
  if (fm?.completionDate) {
    const y = fm.completionDate.split('-')[0]
    if (y && y.length === 4) return y
  }
  return String(now.getFullYear())
}

export function formatDate(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function resolvePlanInputPath(
  input,
  rootDir,
  { platform = process.platform, pathImpl = path } = {}
) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('待归档方案路径不能为空')
  }

  const rawPath = input.trim()

  // 1. 拦截 URL 协议（file://, http://, https:// 等）
  if (/^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/|file:)/i.test(rawPath)) {
    throw new Error(`不支持 URL 格式的方案路径: ${rawPath}`)
  }

  // 2. 拦截 UNC 路径与设备路径（如 \\server\share 或 //server/share）
  if (/^[/\\]{2}/.test(rawPath)) {
    throw new Error(`不支持 UNC 路径或设备路径: ${rawPath}`)
  }

  // 3. 拦截 Windows 驱动器相对路径（如 C:relative.md）或识别 Windows 驱动器绝对路径
  const driveMatch = rawPath.match(/^([a-zA-Z]):(.*)$/)
  if (driveMatch) {
    const rest = driveMatch[2]
    if (!rest.startsWith('/') && !rest.startsWith('\\')) {
      throw new Error(`不支持 Windows 驱动器相对路径: ${rawPath}`)
    }
    // 异系统绝对路径：非 Windows 平台禁止将 Windows 驱动器绝对路径静默拼入 cwd
    if (platform !== 'win32') {
      throw new Error(`不支持跨操作系统绝对路径: ${rawPath}`)
    }
    const absPath = pathImpl.resolve(rawPath)
    return validatePlanBoundary(absPath, rootDir, rawPath, pathImpl)
  }

  // 4. Windows 平台拦截无盘符的隐式当前驱动器根相对路径（如 /tmp/a 或 \tmp\a）
  if (platform === 'win32' && /^[/\\]/.test(rawPath)) {
    throw new Error(`不支持隐式当前驱动器的根相对路径: ${rawPath}`)
  }

  // 5. POSIX 平台原生绝对路径
  if (platform !== 'win32' && rawPath.startsWith('/')) {
    const absPath = pathImpl.resolve(rawPath)
    return validatePlanBoundary(absPath, rootDir, rawPath, pathImpl)
  }

  // 6. 可移植相对路径：先归一化分隔符为正斜杠并去除冗余前导 ./，再按基准目录解析
  const normalizedInput = toPosixPath(rawPath).replace(/^\.\//, '')
  const absPath = pathImpl.resolve(rootDir, normalizedInput)
  return validatePlanBoundary(absPath, rootDir, rawPath, pathImpl)
}

function validatePlanBoundary(absPath, rootDir, rawPath, pathImpl = path) {
  const relative = pathImpl.relative(rootDir, absPath)
  const normalizedRel = toPosixPath(relative)
  if (
    !normalizedRel.startsWith('docs/plans/') ||
    normalizedRel === 'docs/plans' ||
    normalizedRel === 'docs/plans/' ||
    normalizedRel.startsWith('../') ||
    normalizedRel === '..' ||
    pathImpl.isAbsolute(relative)
  ) {
    throw new Error(`待归档方案必须位于 docs/plans/ 目录下: ${rawPath}`)
  }
  return { absPath, normalizedRel }
}

export class ArchiveEngine {
  constructor(options = {}) {
    this.rootDir = path.resolve(options.rootDir || process.cwd())
    this.fs = options.fs || new DiskFileSystemAdapter()
    this.dryRun = Boolean(options.dryRun)
    this.now = options.now instanceof Date ? options.now : new Date()
    this.git = options.git !== undefined ? options.git : true
    this.maxArchiveTopics =
      typeof options.maxArchiveTopics === 'number' && options.maxArchiveTopics > 0
        ? Math.floor(options.maxArchiveTopics)
        : DEFAULT_MAX_ARCHIVE_TOPICS
  }

  async getRealpath(targetPath) {
    if (typeof this.fs.realpath === 'function') {
      const p = await this.fs.realpath(targetPath)
      return toPosixPath(p)
    }
    const raw = fs.realpathSync.native ? fs.realpathSync.native(targetPath) : fs.realpathSync(targetPath)
    return toPosixPath(raw)
  }

  async walkMdFiles(dirRel) {
    const dirAbs = path.resolve(this.rootDir, dirRel)
    const results = []

    const walk = async (curAbs) => {
      let entries
      try {
        entries = await this.fs.readdir(curAbs, { withFileTypes: true })
      } catch {
        return
      }

      for (const entry of entries) {
        const isDir = typeof entry.isDirectory === 'function' ? entry.isDirectory() : false
        const name = entry.name || entry
        const subAbs = path.join(curAbs, name)

        if (isDir) {
          if (name === 'node_modules' || name === '.git' || name === 'dist') continue
          await walk(subAbs)
        } else if (name.endsWith('.md')) {
          const rel = toPosixPath(path.relative(this.rootDir, subAbs))
          results.push(rel)
        }
      }
    }

    await walk(dirAbs)
    return results.sort()
  }

  async extractSummary(fileRel) {
    try {
      const content = await this.fs.readFile(path.resolve(this.rootDir, fileRel))
      // 匹配首个非空 blockquote
      const match = content.match(/^>\s*(.+)$/m)
      if (match) {
        return match[1].trim()
      }
    } catch {
      // ignore
    }
    return ''
  }

  async preflightPlan(planRelPath) {
    const { absPath, normalizedRel } = resolvePlanInputPath(planRelPath, this.rootDir)

    if (!(await this.fs.pathExists(absPath))) {
      throw new Error(`方案文件不存在: ${normalizedRel}`)
    }

    if (typeof this.fs.lstat === 'function') {
      const fileStat = await this.fs.lstat(absPath)
      if (fileStat.isSymbolicLink && fileStat.isSymbolicLink()) {
        throw new Error(`待归档方案文件不能为符号链接: ${normalizedRel}`)
      }
    }

    const plansDirAbs = path.resolve(this.rootDir, 'docs/plans')
    let plansRealRoot
    try {
      plansRealRoot = await this.getRealpath(plansDirAbs)
    } catch {
      plansRealRoot = toPosixPath(plansDirAbs)
    }
    const sourceReal = await this.getRealpath(absPath)
    if (!isInsideDir(plansRealRoot, sourceReal)) {
      throw new Error(`待归档方案真实路径超出 docs/plans/ 范围: ${normalizedRel}`)
    }

    const content = await this.fs.readFile(absPath)
    const fm = parseFrontmatter(content)
    if (!fm) {
      throw new Error(`方案缺失标准 YAML Frontmatter 头部: ${normalizedRel}`)
    }
    if (!fm.type || !fm.rawStatus || !fm.date) {
      throw new Error(`方案 Frontmatter 必填字段缺失: ${normalizedRel}`)
    }

    const realRelToRepo = toPosixPath(path.relative(this.rootDir, sourceReal))
    const domain = deriveDomain(realRelToRepo)
    const fileName = path.basename(normalizedRel)
    const deliveryYear = deriveDeliveryYear(fm, this.now)
    const targetRelPath = `docs/archive/${deliveryYear}/${domain}/${fileName}`
    const targetAbsPath = path.resolve(this.rootDir, targetRelPath)

    const archiveDirAbs = path.resolve(this.rootDir, 'docs/archive')
    if (!isInsideDir(archiveDirAbs, targetAbsPath)) {
      throw new Error(`归档目标路径超出 docs/archive/ 范围: ${targetRelPath}`)
    }

    if (await this.fs.pathExists(targetAbsPath)) {
      throw new Error(`目标归档路径已存在同名文件，无法覆盖: ${targetRelPath}`)
    }

    if (typeof this.fs.lstat === 'function') {
      try {
        const targetStat = await this.fs.lstat(targetAbsPath)
        if (targetStat) {
          throw new Error(`目标归档路径已存在同名文件或符号链接，无法覆盖: ${targetRelPath}`)
        }
      } catch (e) {
        if (e.message.includes('无法覆盖')) throw e
      }
    }

    const repoRealRoot = await this.getRealpath(this.rootDir)
    let existingAncestor = path.dirname(targetAbsPath)
    while (existingAncestor && !(await this.fs.pathExists(existingAncestor))) {
      const parent = path.dirname(existingAncestor)
      if (parent === existingAncestor) break
      existingAncestor = parent
    }

    if (existingAncestor && (await this.fs.pathExists(existingAncestor))) {
      const ancestorReal = await this.getRealpath(existingAncestor)
      if (!isInsideDir(repoRealRoot, ancestorReal)) {
        throw new Error(`归档目标目录的祖先目录真实路径超出仓库根目录范围: ${targetRelPath}`)
      }
    }

    return {
      planRelPath: normalizedRel,
      planAbsPath: absPath,
      content,
      fm,
      domain,
      fileName,
      deliveryYear,
      targetRelPath,
      targetAbsPath,
    }
  }

  recomputeInternalLinks(content, oldRelPath, newRelPath) {
    const oldDir = path.dirname(path.resolve(this.rootDir, oldRelPath))
    const newDir = path.dirname(path.resolve(this.rootDir, newRelPath))

    const links = extractMarkdownLinks(content)
    const replacements = []

    for (const link of links) {
      const { href, anchor } = splitTarget(link.target)
      if (!href || isExternal(href)) continue

      const decodedHref = safeDecodeURI(href)
      const targetAbs = path.resolve(oldDir, toPosixPath(decodedHref))
      const newRelativeHref = toPosixPath(path.relative(newDir, targetAbs))
      const replacementTarget = anchor ? `${newRelativeHref}#${anchor}` : newRelativeHref

      replacements.push({
        startOffset: link.targetOffsetStart,
        endOffset: link.targetOffsetEnd,
        replacement: replacementTarget,
      })
    }

    return applySpanReplacements(content, replacements)
  }

  async recomputeReverseLinks(allMdFiles, oldRelPath, newRelPath) {
    const oldAbs = path.resolve(this.rootDir, oldRelPath)
    const newAbs = path.resolve(this.rootDir, newRelPath)
    const fileChanges = new Map()

    for (const fileRel of allMdFiles) {
      const lowerRel = fileRel.toLowerCase()
      if (lowerRel === oldRelPath.toLowerCase() || lowerRel === 'docs/index.md') continue

      const fileAbs = path.resolve(this.rootDir, fileRel)
      const docDir = path.dirname(fileAbs)
      let content
      try {
        content = await this.fs.readFile(fileAbs)
      } catch {
        continue
      }

      const links = extractMarkdownLinks(content)
      const replacements = []

      for (const link of links) {
        const { href, anchor } = splitTarget(link.target)
        if (!href || isExternal(href)) continue

        const decodedHref = safeDecodeURI(href)
        const targetAbs = path.resolve(docDir, toPosixPath(decodedHref))

        if (targetAbs.toLowerCase() === oldAbs.toLowerCase()) {
          const newRelativeHref = toPosixPath(path.relative(docDir, newAbs))
          const replacementTarget = anchor ? `${newRelativeHref}#${anchor}` : newRelativeHref

          replacements.push({
            startOffset: link.targetOffsetStart,
            endOffset: link.targetOffsetEnd,
            replacement: replacementTarget,
          })
        }
      }

      if (replacements.length > 0) {
        const updated = applySpanReplacements(content, replacements)
        fileChanges.set(fileRel, updated)
      }
    }

    return fileChanges
  }

  async projectIndex(allPlanFiles, allArchiveFiles, currentMigratingPlan = null) {
    const indexAbs = path.resolve(this.rootDir, 'docs/index.md')
    let indexContent = ''
    try {
      indexContent = await this.fs.readFile(indexAbs)
    } catch {
      return indexContent
    }

    if (!indexContent.includes(ACTIVE_START_TAG) || !indexContent.includes(ACTIVE_END_TAG)) {
      throw new Error(`docs/index.md 缺失活跃方案区域标记: ${ACTIVE_START_TAG} ... ${ACTIVE_END_TAG}`)
    }
    if (!indexContent.includes(ARCHIVE_START_TAG) || !indexContent.includes(ARCHIVE_END_TAG)) {
      throw new Error(`docs/index.md 缺失归档方案区域标记: ${ARCHIVE_START_TAG} ... ${ARCHIVE_END_TAG}`)
    }

    // 1. 活跃方案元数据收集
    const activePlansByDomain = { cli: [], ui: [], styles: [], core: [] }
    for (const rel of allPlanFiles) {
      if (currentMigratingPlan && rel === currentMigratingPlan.oldRel) continue
      const content = await this.fs.readFile(path.resolve(this.rootDir, rel))
      const fm = parseFrontmatter(content)
      if (!fm) continue
      const domain = deriveDomain(rel)
      if (!activePlansByDomain[domain]) activePlansByDomain[domain] = []

      const baseNameWithoutExt = path.basename(rel, '.md')
      let summary = ''
      const existingDescMatch = indexContent.match(
        new RegExp(`\\[${escapeRegExp(baseNameWithoutExt)}\\].*?\\r?\\n\\s*\\*([^*]+)\\*`)
      )
      if (existingDescMatch) {
        summary = existingDescMatch[1].trim()
      } else {
        summary = await this.extractSummary(rel)
      }

      activePlansByDomain[domain].push({
        rel,
        title: baseNameWithoutExt,
        status: fm.status,
        summary,
      })
    }

    // 2. 归档方案分组统计与清单生成
    const archiveTree = new Map() // Map<year, Map<domain, string[]>>

    for (const rel of allArchiveFiles) {
      const parts = rel.split('/')
      if (parts.length >= 5) {
        const year = parts[2]
        const domain = parts[3]
        if (!archiveTree.has(year)) archiveTree.set(year, new Map())
        const dMap = archiveTree.get(year)
        if (!dMap.has(domain)) dMap.set(domain, [])
        dMap.get(domain).push(rel)
      }
    }

    if (currentMigratingPlan) {
      const { year, domain, newRel } = currentMigratingPlan
      if (!archiveTree.has(year)) archiveTree.set(year, new Map())
      const dMap = archiveTree.get(year)
      if (!dMap.has(domain)) dMap.set(domain, [])
      if (!dMap.get(domain).includes(newRel)) {
        dMap.get(domain).push(newRel)
      }
    }

    // 3. 构建活跃区文本
    const activeLines = []
    for (const d of DOMAINS) {
      const meta = DOMAIN_META[d]
      activeLines.push(`### ${meta.title}`)
      const items = activePlansByDomain[d] || []
      if (items.length === 0) {
        activeLines.push('*（暂无进行中的活跃方案）*\n')
        continue
      }
      for (const item of items) {
        activeLines.push(`- [${item.title}](${item.rel.replace(/^docs\//, '')})（状态：\`${item.status}\`）  `)
        if (item.summary) {
          activeLines.push(`  *${item.summary}*`)
        }
      }
      activeLines.push('')
    }
    const eolMatch = indexContent.match(/\r\n|\n/)
    const eol = eolMatch ? eolMatch[0] : '\n'

    const renderedActive = activeLines.join(eol).trim()

    // 4. 构建归档区文本
    const archiveLines = []
    const sortedYears = Array.from(archiveTree.keys()).sort((a, b) => Number(b) - Number(a))

    for (const year of sortedYears) {
      archiveLines.push(`### ${year} 年度落地方案（[\`docs/archive/${year}/\`](archive/${year}/)）${eol}`)
      const dMap = archiveTree.get(year)

      for (const d of DOMAINS) {
        const meta = DOMAIN_META[d]
        const rawFiles = dMap.get(d) || []
        const count = rawFiles.length

        if (count === 0) {
          archiveLines.push(`- **${meta.archiveTitle}（0 篇）**：暂无归档。`)
          continue
        }

        // 提取归档目录下方案元数据，按完工日期（或日期）倒序排序
        const planMetas = await Promise.all(
          rawFiles.map(async (f) => {
            let date = ''
            if (currentMigratingPlan && f === currentMigratingPlan.newRel) {
              date = currentMigratingPlan.completionDate || currentMigratingPlan.date || ''
            } else {
              try {
                const fileContent = await this.fs.readFile(path.resolve(this.rootDir, f))
                const fm = parseFrontmatter(fileContent)
                date = fm?.completionDate || fm?.date || ''
              } catch {
                // 异常降级为空日期
              }
            }
            const base = path.basename(f, '.md')
            const topic = base.replace(/(方案|设计)$/, '').trim() || base
            return {
              file: f,
              date,
              topic,
            }
          })
        )

        // 使用归档方案时间戳排序器（纯函数 Seam）排序
        planMetas.sort(compareArchivePlanMetas)

        const displayMetas = planMetas.slice(0, this.maxArchiveTopics)
        const topicNames = displayMetas.map((m) => m.topic)

        let topicStr = '暂无归档。'
        if (count > this.maxArchiveTopics) {
          topicStr = `${topicNames.join('、')}等。`
        } else {
          topicStr = `${topicNames.join('、')}。`
        }

        archiveLines.push(`- **[${meta.archiveTitle}（${count} 篇）](archive/${year}/${d}/)**：${topicStr}`)
      }
      archiveLines.push('')
    }
    const renderedArchive = archiveLines.join(eol).trim()

    // 5. 替换或插入到 indexContent
    const activeReg = new RegExp(`${ACTIVE_START_TAG}[\\s\\S]*?${ACTIVE_END_TAG}`)
    let updatedIndex = indexContent.replace(activeReg, `${ACTIVE_START_TAG}${eol}${renderedActive}${eol}${ACTIVE_END_TAG}`)

    const archiveReg = new RegExp(`${ARCHIVE_START_TAG}[\\s\\S]*?${ARCHIVE_END_TAG}`)
    updatedIndex = updatedIndex.replace(archiveReg, `${ARCHIVE_START_TAG}${eol}${renderedArchive}${eol}${ARCHIVE_END_TAG}`)

    return updatedIndex
  }

  isGitTracked(filePath) {
    if (!this.git) return false
    try {
      execFileSync('git', ['ls-files', '--error-unmatch', filePath], {
        cwd: this.rootDir,
        stdio: 'pipe',
      })
      return true
    } catch {
      return false
    }
  }

  gitMove(oldPath, newPath) {
    if (!this.git) return false
    try {
      execFileSync('git', ['mv', oldPath, newPath], {
        cwd: this.rootDir,
        stdio: 'pipe',
      })
      return true
    } catch {
      return false
    }
  }

  gitStage(files) {
    if (!this.git || files.length === 0) return
    try {
      execFileSync('git', ['add', '--', ...files], {
        cwd: this.rootDir,
        stdio: 'pipe',
      })
    } catch {
      // ignore
    }
  }

  async archive(planRelPath) {
    // 1. Preflight
    const pre = await this.preflightPlan(planRelPath)
    const todayStr = formatDate(this.now)

    // 2. Frontmatter 更新
    const updatedFrontmatterContent = updateFrontmatter(
      pre.content,
      'archived',
      todayStr,
      this.rootDir,
      pre.planRelPath,
      pre.targetRelPath
    )

    // 3. 文档内部正向链接重算
    const linkFixedContent = this.recomputeInternalLinks(
      updatedFrontmatterContent,
      pre.planRelPath,
      pre.targetRelPath
    )

    // 4. 全仓反向引用自愈模拟
    const allMdFiles = await this.walkMdFiles('docs')
    const reverseChanges = await this.recomputeReverseLinks(allMdFiles, pre.planRelPath, pre.targetRelPath)

    // 5. docs/index.md 声明式派生
    const allPlanFiles = await this.walkMdFiles('docs/plans')
    const allArchiveFiles = await this.walkMdFiles('docs/archive')

    const newIndexContent = await this.projectIndex(allPlanFiles, allArchiveFiles, {
      oldRel: pre.planRelPath,
      newRel: pre.targetRelPath,
      year: pre.deliveryYear,
      domain: pre.domain,
      completionDate: todayStr,
      date: pre.fm?.date || todayStr,
    })

    const result = {
      planName: pre.fileName,
      oldPath: pre.planRelPath,
      newPath: pre.targetRelPath,
      deliveryYear: pre.deliveryYear,
      domain: pre.domain,
      changedFiles: [
        pre.targetRelPath,
        'docs/index.md',
        ...Array.from(reverseChanges.keys()).filter((f) => !this.git || this.isGitTracked(f)),
      ],
      dryRun: this.dryRun,
    }

    if (this.dryRun) {
      return result
    }

    // Phase 2: 落盘
    // 目录创建后、迁移前重新核验真实目标父目录及重名状态
    const targetDir = path.dirname(pre.targetAbsPath)
    if (typeof this.fs.ensureDir === 'function') {
      await this.fs.ensureDir(targetDir)
    } else if (typeof this.fs.mkdir === 'function') {
      await this.fs.mkdir(targetDir, { recursive: true })
    }

    const repoRealRoot = await this.getRealpath(this.rootDir)
    const targetDirReal = await this.getRealpath(targetDir)
    if (!isInsideDir(repoRealRoot, targetDirReal)) {
      throw new Error(`归档目标真实父目录超出仓库根目录范围: ${pre.targetRelPath}`)
    }
    if (await this.fs.pathExists(pre.targetAbsPath)) {
      throw new Error(`目标归档路径已存在同名文件，无法覆盖: ${pre.targetRelPath}`)
    }
    if (typeof this.fs.lstat === 'function') {
      try {
        const targetStat = await this.fs.lstat(pre.targetAbsPath)
        if (targetStat) {
          throw new Error(`目标归档路径已存在同名文件或符号链接，无法覆盖: ${pre.targetRelPath}`)
        }
      } catch (e) {
        if (e.message.includes('无法覆盖')) throw e
      }
    }

    // 物理移动与内容重写
    const isTracked = this.isGitTracked(pre.planRelPath)
    let movedByGit = false
    if (isTracked) {
      movedByGit = this.gitMove(pre.planRelPath, pre.targetRelPath)
    }

    await this.fs.writeFile(pre.targetAbsPath, linkFixedContent)

    if (!movedByGit && typeof this.fs.unlink === 'function') {
      try {
        await this.fs.unlink(pre.planAbsPath)
      } catch {
        // ignore if already moved or not exists
      }
    }

    // 写回反向引用的文档
    for (const [fileRel, content] of reverseChanges.entries()) {
      await this.fs.writeFile(path.resolve(this.rootDir, fileRel), content)
    }

    // 写回 docs/index.md
    if (newIndexContent) {
      await this.fs.writeFile(path.resolve(this.rootDir, 'docs/index.md'), newIndexContent)
    }

    // 精准 Git 暂存
    const filesToStage = [...result.changedFiles]
    if (!movedByGit && isTracked) {
      filesToStage.push(pre.planRelPath)
    }
    this.gitStage(filesToStage)

    return result
  }

  async archiveAllDone() {
    const planFiles = await this.walkMdFiles('docs/plans')
    const donePlans = []

    for (const rel of planFiles) {
      const content = await this.fs.readFile(path.resolve(this.rootDir, rel))
      const fm = parseFrontmatter(content)
      if (fm && fm.status === 'done') {
        donePlans.push(rel)
      }
    }

    const results = []
    for (const plan of donePlans) {
      const res = await this.archive(plan)
      results.push(res)
    }

    return results
  }

  async refreshIndex({ checkOnly = false } = {}) {
    const allPlanFiles = await this.walkMdFiles('docs/plans')
    const allArchiveFiles = await this.walkMdFiles('docs/archive')

    const indexPath = path.resolve(this.rootDir, 'docs/index.md')
    let currentIndexContent = ''
    try {
      currentIndexContent = await this.fs.readFile(indexPath)
    } catch {
      throw new Error('docs/index.md 文件不存在')
    }

    const newIndexContent = await this.projectIndex(allPlanFiles, allArchiveFiles, null)
    const normalizeEol = (str) => str.replace(/\r\n/g, '\n')
    const isDifferent = normalizeEol(currentIndexContent) !== normalizeEol(newIndexContent)

    if (checkOnly) {
      return {
        consistent: !isDifferent,
        changed: isDifferent,
      }
    }

    if (isDifferent && !this.dryRun) {
      await this.fs.writeFile(indexPath, newIndexContent)
      if (this.git && this.isGitTracked('docs/index.md')) {
        this.gitStage(['docs/index.md'])
      }
    }

    return {
      consistent: !isDifferent,
      changed: isDifferent,
      dryRun: this.dryRun,
    }
  }
}
