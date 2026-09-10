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
  toPosix,
  splitTarget,
  isExternal,
  safeDecodeURI,
} from './doc-link-engine.mjs'
import { DiskFileSystemAdapter } from './doc-link-fs.mjs'

export const DOMAINS = ['cli', 'ui', 'styles', 'core']

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

export function parseFrontmatter(content) {
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!yamlMatch) return null

  const yaml = yamlMatch[1]
  const getField = (name) => {
    const m = yaml.match(new RegExp(`^${name}[：:]\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : null
  }

  const rawStatus = getField('状态')
  const status = rawStatus ? rawStatus.replace(/[*_`]/g, '').trim().toLowerCase() : null

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

export function updateFrontmatter(content, newStatus, completionDate) {
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

  return content.replace(/^---\r?\n([\s\S]*?)\r?\n---/, `---${eol}${yaml.trim()}${eol}---`)
}

export function deriveDomain(relPath) {
  const parts = toPosix(relPath).split('/')
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

export class ArchiveEngine {
  constructor(options = {}) {
    this.rootDir = path.resolve(options.rootDir || process.cwd())
    this.fs = options.fs || new DiskFileSystemAdapter()
    this.dryRun = Boolean(options.dryRun)
    this.now = options.now instanceof Date ? options.now : new Date()
    this.git = options.git !== undefined ? options.git : true
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
          const rel = toPosix(path.relative(this.rootDir, subAbs))
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
    const normalizedRel = toPosix(planRelPath)
    if (!normalizedRel.startsWith('docs/plans/')) {
      throw new Error(`待归档方案必须位于 docs/plans/ 目录下: ${planRelPath}`)
    }

    const absPath = path.resolve(this.rootDir, normalizedRel)
    if (!(await this.fs.pathExists(absPath))) {
      throw new Error(`方案文件不存在: ${normalizedRel}`)
    }

    const content = await this.fs.readFile(absPath)
    const fm = parseFrontmatter(content)
    if (!fm) {
      throw new Error(`方案缺失标准 YAML Frontmatter 头部: ${normalizedRel}`)
    }
    if (!fm.type || !fm.rawStatus || !fm.date) {
      throw new Error(`方案 Frontmatter 必填字段缺失: ${normalizedRel}`)
    }

    const domain = deriveDomain(normalizedRel)
    const fileName = path.basename(normalizedRel)
    const deliveryYear = deriveDeliveryYear(fm, this.now)
    const targetRelPath = `docs/archive/${deliveryYear}/${domain}/${fileName}`
    const targetAbsPath = path.resolve(this.rootDir, targetRelPath)

    if (await this.fs.pathExists(targetAbsPath)) {
      throw new Error(`目标归档路径已存在同名文件，无法覆盖: ${targetRelPath}`)
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
      const targetAbs = path.resolve(oldDir, decodedHref)
      const newRelativeHref = toPosix(path.relative(newDir, targetAbs))
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
        const targetAbs = path.resolve(docDir, decodedHref)

        if (targetAbs.toLowerCase() === oldAbs.toLowerCase()) {
          const newRelativeHref = toPosix(path.relative(docDir, newAbs))
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
    const renderedActive = activeLines.join('\n').trim()

    // 4. 构建归档区文本
    const archiveLines = []
    const sortedYears = Array.from(archiveTree.keys()).sort((a, b) => Number(b) - Number(a))

    for (const year of sortedYears) {
      archiveLines.push(`### ${year} 年度落地方案（[\`docs/archive/${year}/\`](archive/${year}/)）\n`)
      const dMap = archiveTree.get(year)

      for (const d of DOMAINS) {
        const meta = DOMAIN_META[d]
        const files = dMap.get(d) || []
        const count = files.length

        // 提取归档目录下真实文件的主题名，剥离“方案”或“设计”后缀
        const topicNames = files.map((f) => {
          const base = path.basename(f, '.md')
          return base.replace(/(方案|设计)$/, '').trim()
        })

        const topicStr = topicNames.length > 0 ? `${topicNames.join('、')}等。` : '暂无归档。'

        if (count > 0) {
          archiveLines.push(`- **[${meta.archiveTitle}（${count} 篇）](archive/${year}/${d}/)**：${topicStr}`)
        } else {
          archiveLines.push(`- **${meta.archiveTitle}（0 篇）**：暂无归档。`)
        }
      }
      archiveLines.push('')
    }
    const renderedArchive = archiveLines.join('\n').trim()

    // 5. 替换或插入到 indexContent
    const activeReg = new RegExp(`${ACTIVE_START_TAG}[\\s\\S]*?${ACTIVE_END_TAG}`)
    let updatedIndex = indexContent.replace(activeReg, `${ACTIVE_START_TAG}\n${renderedActive}\n${ACTIVE_END_TAG}`)

    const archiveReg = new RegExp(`${ARCHIVE_START_TAG}[\\s\\S]*?${ARCHIVE_END_TAG}`)
    updatedIndex = updatedIndex.replace(archiveReg, `${ARCHIVE_START_TAG}\n${renderedArchive}\n${ARCHIVE_END_TAG}`)

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
    const updatedFrontmatterContent = updateFrontmatter(pre.content, 'archived', todayStr)

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
        ...Array.from(reverseChanges.keys()),
      ],
      dryRun: this.dryRun,
    }

    if (this.dryRun) {
      return result
    }

    // Phase 2: 落盘
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
    this.gitStage(result.changedFiles)

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
}
