/**
 * 文档链接检查与自愈核心引擎 (DocLinkEngine)
 *
 * 核心特性：
 * 1. 依赖倒置：基于 FileSystemAdapter 契约进行文件读写与路径核验，支持磁盘与内存沙箱无缝切换；
 * 2. 跨平台大小写穿透：通过 realpath 原生调用穿透整条路径的全部祖先层级与末级文件；
 * 3. 纯动态拓扑自愈：基于全仓 Basename 倒排索引动态推导相对路径，彻底摒弃静态别名映射表；
 * 4. 启发式安全护栏：内置保留字黑名单与领域边界隔离，杜绝高频文件名歧义误定向；
 * 5. 字符切片原位替换：采用基于物理偏移的从后向前切片重写算法，100% 排版无损；
 * 6. 生命周期分级降噪：符合 DOC_GOVERNANCE.md 四象限原则，历史快照源码失效静默聚合。
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** 忽略扫描的目录集合 */
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', '.turbo', 'coverage'])

/** 启发式自愈排除黑名单（高频通用文件名严禁自动猜测） */
export const HEURISTIC_EXCLUDE_BASENAMES = new Set([
  'readme.md',
  'readme-en.md',
  'index.md',
  'skill.md',
  'package.json',
  'tsconfig.json',
  'license',
  'changelog.md',
  'contributing.md',
  'summary.md',
])

/** 路径转 posix 风格 */
export function toPosix(p) {
  return p.split(path.sep).join('/')
}

/** 安全解码 URL 百分号编码 */
export function safeDecodeURI(uri) {
  try {
    return decodeURI(uri)
  } catch {
    return uri
  }
}

/** 是否为外部网络协议 */
export function isExternal(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target)
}

/** 拆分链接目标与锚点 */
export function splitTarget(rawTarget) {
  const hashIndex = rawTarget.indexOf('#')
  if (hashIndex === -1) {
    return { href: rawTarget, anchor: '' }
  }
  return {
    href: rawTarget.slice(0, hashIndex),
    anchor: rawTarget.slice(hashIndex + 1),
  }
}

/**
 * 将 file:/// URL 还原为标准绝对物理路径（自动剥离 fragment 与 query）
 */
export function fileUrlToAbsPath(fileUrl) {
  if (typeof fileUrl === 'string' && fileUrl.startsWith('file:')) {
    const cleanUrl = fileUrl.split(/[?#]/)[0]
    return path.resolve(fileURLToPath(cleanUrl))
  }
  return path.resolve(fileUrl)
}

/**
 * 遮蔽行内代码片段，保留原有长度与物理偏移量，防止行内代码被误判为 Markdown 链接
 * 依循 CommonMark 规范：匹配由 N 个反引号起始并由精确 N 个反引号闭合的代码区间
 */
export function maskInlineCodeSpans(line) {
  return line.replace(/(`+)([\s\S]*?)\1/g, (match) => ' '.repeat(match.length))
}

/**
 * GitHub 与 VitePress 兼容的标题 Slugify
 */
export function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '') // 剥离内联 HTML 标签
    .replace(/[`*_~]/g, '') // 剥离内联样式符
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 保留 Unicode 字符、数字、横线与空格
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 严格 CommonMark 分词器：提取带绝对物理字符偏移的 Markdown 链接
 */
export function extractMarkdownLinks(content) {
  const links = []
  const lines = content.split('\n')
  let currentOffset = 0
  let activeFence = null
  let inHtmlComment = false

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const trimmed = line.trim()

    // 1. 处理 HTML 注释区间
    if (!activeFence) {
      if (inHtmlComment) {
        if (trimmed.includes('-->')) {
          inHtmlComment = false
        }
        currentOffset += line.length + 1
        continue
      }
      if (trimmed.startsWith('<!--')) {
        if (!trimmed.includes('-->')) {
          inHtmlComment = true
        }
        currentOffset += line.length + 1
        continue
      }
    }

    // 2. 代码围栏识别（3+ 个 ` 或 ~）
    if (activeFence) {
      const closeMatch = trimmed.match(/^(`{3,}|~{3,})\s*$/)
      if (closeMatch && closeMatch[1][0] === activeFence.markerChar && closeMatch[1].length >= activeFence.markerLen) {
        activeFence = null
        currentOffset += line.length + 1
        continue
      }
      currentOffset += line.length + 1
      continue
    }

    // 起始围栏判定
    const openMatch = trimmed.match(/^(`{3,}|~{3,})/)
    if (openMatch) {
      const markerChar = openMatch[1][0]
      const markerLen = openMatch[1].length
      const remainder = trimmed.slice(markerLen)
      const sameLineClose = remainder.includes(openMatch[1])

      if (!sameLineClose) {
        if (markerChar !== '`' || !remainder.includes('`')) {
          activeFence = { markerChar, markerLen }
          currentOffset += line.length + 1
          continue
        }
      }
    }

    // 3. 遮蔽行内代码块干扰，保证字符偏移量完全一致
    const maskedLine = maskInlineCodeSpans(line)

    // 3. 扫描 Markdown 链接: [text](target) 或 ![alt](target)
    const linkRegex = /(!?)\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g
    let match

    while ((match = linkRegex.exec(maskedLine)) !== null) {
      const isImage = match[1] === '!'
      const text = match[2]
      const rawTargetWithAngle = match[3]
      let cleanTarget = rawTargetWithAngle

      if (cleanTarget.startsWith('<') && cleanTarget.endsWith('>')) {
        cleanTarget = cleanTarget.slice(1, -1)
      }

      // 基于正则捕获组结构计算确定性绝对物理偏移，杜绝 indexOf 前向同名文本误匹配
      const prefixLen = (isImage ? 1 : 0) + 1 + text.length + 2 // !? + '[' + text + ']('
      const targetOffsetStart = currentOffset + match.index + prefixLen
      const targetOffsetEnd = targetOffsetStart + rawTargetWithAngle.length

      links.push({
        line: lineIndex + 1,
        isImage,
        text,
        target: cleanTarget,
        rawTargetWithAngle,
        targetOffsetStart,
        targetOffsetEnd,
      })
    }

    currentOffset += line.length + 1
  }

  return links
}

/**
 * 提取 Markdown 标题锚点集合（支持 VitePress {#custom-id} 与内联 HTML 清洗）
 */
export function extractHeadingAnchors(content) {
  const anchors = new Set()
  const counts = new Map()
  let activeFence = null

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/)
    if (fenceMatch) {
      const markerChar = fenceMatch[1][0]
      const markerLen = fenceMatch[1].length
      if (!activeFence) {
        activeFence = { markerChar, markerLen }
        continue
      } else if (activeFence.markerChar === markerChar && markerLen >= activeFence.markerLen) {
        activeFence = null
        continue
      }
    }
    if (activeFence) continue

    const headingMatch = line.match(/^#{1,6}\s+(.+)$/)
    if (!headingMatch) continue

    let rawTitle = headingMatch[1].trim()

    // 匹配并剥离 VitePress 自定义 id: ## 标题 {#custom-id}
    const customIdMatch = rawTitle.match(/\{#([\w-]+)\}$/)
    if (customIdMatch) {
      anchors.add(customIdMatch[1])
      rawTitle = rawTitle.replace(/\{#[\w-]+\}$/, '').trim()
    }

    const slug = slugify(rawTitle)
    if (!slug) continue

    const count = counts.get(slug) ?? 0
    counts.set(slug, count + 1)
    anchors.add(count === 0 ? slug : `${slug}-${count}`)
  }

  return anchors
}

/**
 * 从后向前切片替换：100% 排版无损且避免偏移漂移，并带重叠防御断言
 */
export function applySpanReplacements(content, replacements) {
  if (replacements.length === 0) return content

  // 按起点降序排序
  const sorted = [...replacements].sort((a, b) => b.startOffset - a.startOffset)

  // 严格重叠防御断言
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1].endOffset > sorted[i].startOffset) {
      throw new Error(
        `[applySpanReplacements] 检测到切片区间重叠: [${sorted[i + 1].startOffset}, ${sorted[i + 1].endOffset}) 与 [${sorted[i].startOffset}, ${sorted[i].endOffset})`
      )
    }
  }

  let result = content
  for (const item of sorted) {
    result = result.slice(0, item.startOffset) + item.replacement + result.slice(item.endOffset)
  }

  return result
}

/**
 * 文档链接检查与自愈引擎
 */
export class DocLinkEngine {
  /**
   * @param {import('./doc-link-fs.mjs').DiskFileSystemAdapter | import('./doc-link-fs.mjs').MemoryFileSystemAdapter} fsAdapter
   * @param {object} options
   * @param {string} options.rootDir
   * @param {boolean} [options.verbose]
   * @param {string[]} [options.targetFiles]
   */
  constructor(fsAdapter, options) {
    this.fs = fsAdapter
    this.rootDir = path.resolve(options.rootDir)
    this.verbose = Boolean(options.verbose)
    this.explicitTargetFiles = options.targetFiles ?? null

    /** Basename 倒排索引：Map<lowerBasename, string[] (posix rel paths)> */
    this.invertIndex = new Map()
    /** 锚点缓存：Map<absPath, Set<string>> */
    this.anchorCache = new Map()
  }

  /**
   * 仓库相对路径（posix）
   */
  relOf(absPath) {
    return toPosix(path.relative(this.rootDir, absPath))
  }

  /**
   * 是否位于仓库内
   */
  inRepo(absPath) {
    const a = path.normalize(absPath).toLowerCase()
    const r = path.normalize(this.rootDir).toLowerCase()
    return a === r || a.startsWith(r + path.sep) || a.startsWith(r + '/')
  }

  /**
   * 递归收集目录下全部 Markdown 文件
   */
  async collectMarkdownFiles(dirPath, list = []) {
    let entries = []
    try {
      entries = await this.fs.readdir(dirPath, { withFileTypes: true })
    } catch {
      return list
    }

    for (const e of entries) {
      const full = path.join(dirPath, e.name)
      if (e.isDirectory()) {
        if (!IGNORED_DIRS.has(e.name)) {
          await this.collectMarkdownFiles(full, list)
        }
      } else if (e.isFile() && e.name.endsWith('.md')) {
        list.push(full)
      }
    }
    return list
  }

  /**
   * 收集待检查的目标文件全集
   */
  async getTargetFiles() {
    if (this.explicitTargetFiles) {
      return this.explicitTargetFiles.map((p) => path.resolve(this.rootDir, p)).sort()
    }

    const files = await this.collectMarkdownFiles(path.join(this.rootDir, 'docs'))

    // 纳入根常青规范与技能说明
    const roots = ['AGENTS.md', 'README.md', 'skills/brutxui/SKILL.md']
    for (const name of roots) {
      const p = path.join(this.rootDir, name)
      if (await this.fs.pathExists(p)) {
        files.push(p)
      }
    }

    return files.sort()
  }

  /**
   * 构建全仓 Basename 倒排拓扑索引
   */
  async buildInvertIndex() {
    this.invertIndex.clear()
    const allMdFiles = await this.getTargetFiles()

    for (const abs of allMdFiles) {
      const base = path.basename(abs).toLowerCase()
      const rel = this.relOf(abs)
      const list = this.invertIndex.get(base) ?? []
      list.push(rel)
      this.invertIndex.set(base, list)
    }
  }

  /**
   * 获取并缓存目标 Markdown 文件的锚点集合
   */
  async getAnchors(absPath) {
    if (this.anchorCache.has(absPath)) {
      return this.anchorCache.get(absPath)
    }
    try {
      const content = await this.fs.readFile(absPath)
      const anchors = extractHeadingAnchors(content)
      this.anchorCache.set(absPath, anchors)
      return anchors
    } catch {
      const empty = new Set()
      this.anchorCache.set(absPath, empty)
      return empty
    }
  }

  /**
   * 跨平台大小写全路径穿透核验（抹平 Windows 11 NTFS 假阳性与软链基准对齐）
   */
  async verifyCase(absPath) {
    const exists = await this.fs.pathExists(absPath)
    if (!exists) {
      return { exists: false, exactCase: false, realPath: null }
    }

    try {
      const realPath = await this.fs.realpath(absPath)
      const cleanPath = (p) => path.normalize(p).replace(/^\\\\\?\\UNC\\/i, '//').replace(/^\\\\\?\\/, '').replace(/\\/g, '/')
      const normInput = cleanPath(absPath)
      const normReal = cleanPath(realPath)

      // 统一 Windows 驱动器盘符为大写后比对全等
      const formatDrive = (p) => p.replace(/^[a-zA-Z]:/, (m) => m.toUpperCase())
      const driveNormInput = formatDrive(normInput)
      const driveNormReal = formatDrive(normReal)

      // 若提供了 rootDir，同时对 rootDir 取 realpath 进行物理基准对齐
      if (this.options?.rootDir) {
        let physicalRootDir = this.options.rootDir
        try {
          physicalRootDir = await this.fs.realpath(this.options.rootDir)
        } catch {}
        const normRoot = formatDrive(cleanPath(physicalRootDir))

        if (driveNormInput.startsWith(normRoot + '/') && driveNormReal.startsWith(normRoot + '/')) {
          const relInput = driveNormInput.slice(normRoot.length + 1)
          const relReal = driveNormReal.slice(normRoot.length + 1)
          return { exists: true, exactCase: relInput === relReal, realPath: normReal }
        }
      }

      const exactCase = driveNormInput === driveNormReal
      return {
        exists: true,
        exactCase,
        realPath: normReal,
      }
    } catch {
      return { exists: false, exactCase: false, realPath: null }
    }
  }

  /**
   * 判断文件生命周期级别：Tier 1 (常青核心区) vs Tier 2 (历史快照区)
   */
  getLifeCycleTier(relPath) {
    const p = relPath.toLowerCase()
    if (p.startsWith('docs/archive/') || p.startsWith('docs/reports/')) {
      return 'tier2'
    }
    return 'tier1'
  }

  /**
   * 从相对路径中安全解析所属领域（如 cli / ui / styles / core）
   */
  extractDomain(relPath) {
    const normalized = toPosix(relPath).toLowerCase()
    const match = normalized.match(/^docs\/(?:plans|archive\/\d{4})\/([^/]+)/)
    return match ? match[1] : null
  }

  /**
   * 启发式自愈推导：当链接 404 时，动态查找唯一匹配并重算相对路径
   */
  heuristicResolve(fromAbs, rawHref) {
    const decodedHref = safeDecodeURI(rawHref)
    const baseName = path.basename(decodedHref).toLowerCase()
    if (HEURISTIC_EXCLUDE_BASENAMES.has(baseName)) {
      return null
    }

    const matches = this.invertIndex.get(baseName)
    if (!matches || matches.length === 0) {
      return null
    }

    const fromRel = this.relOf(fromAbs)
    const fromTier = this.getLifeCycleTier(fromRel)

    let targetRel = null
    if (matches.length === 1) {
      const candidateRel = matches[0]
      const candidateTier = this.getLifeCycleTier(candidateRel)
      // 跨生命周期安全防线：
      // 如果来源是 Tier 1 常青文档，且候选是 Tier 2 历史归档：
      // 仅当原链接原本指向方案路径（含 plans/ 或 archive/）或文件名属于方案/设计时，才允许自愈移入归档区；
      // 普通规范链接若误写，严禁盲目连接至历史归档，防止过时依赖穿透。
      if (fromTier === 'tier1' && candidateTier === 'tier2') {
        const isPlanLike =
          rawHref.includes('plans/') ||
          rawHref.includes('archive/') ||
          baseName.endsWith('方案.md') ||
          baseName.endsWith('设计.md')
        if (!isPlanLike) {
          return null
        }
      }
      targetRel = candidateRel
    } else {
      // 多重同名项：按领域目录优先匹配（如 cli vs ui）
      const fromDomain = this.extractDomain(fromRel)
      if (fromDomain) {
        const domainMatches = matches.filter((m) => {
          const candidateDomain = this.extractDomain(m)
          return candidateDomain === fromDomain
        })
        if (domainMatches.length === 1) {
          targetRel = domainMatches[0]
        }
      }
    }

    if (!targetRel) {
      return null
    }

    const targetAbs = path.resolve(this.rootDir, targetRel)
    return toPosix(path.relative(path.dirname(fromAbs), targetAbs))
  }

  /**
   * 执行扫描检查
   */
  async scan() {
    await this.buildInvertIndex()
    const files = await this.getTargetFiles()

    const dead = []
    const absLinks = []
    const caseErrors = []
    const anchorWarn = []
    const staleSnapshots = []

    for (const abs of files) {
      const rel = this.relOf(abs)
      const tier = this.getLifeCycleTier(rel)
      let content = ''
      try {
        content = await this.fs.readFile(abs)
      } catch {
        continue
      }

      const extracted = extractMarkdownLinks(content)

      for (const item of extracted) {
        const { line, target } = item

        // 1. file:/// 绝对路径残留检测
        if (target.toLowerCase().startsWith('file:///')) {
          const { href } = splitTarget(target)
          const targetAbs = fileUrlToAbsPath(href)
          absLinks.push({ rel, line, target: href })
          if (!this.inRepo(targetAbs) || !(await this.fs.pathExists(targetAbs))) {
            staleSnapshots.push({
              rel,
              line,
              target: href,
              reason: 'file:// 目标不存在（历史快照引用已失效源码）',
            })
          }
          continue
        }

        // 2. 外链跳过
        if (isExternal(target)) continue

        // 3. 纯页内锚点
        if (target.startsWith('#')) {
          const anchor = target.slice(1)
          if (anchor && !anchor.startsWith('L')) {
            const anchors = await this.getAnchors(abs)
            if (!anchors.has(anchor) && !anchors.has(slugify(anchor))) {
              anchorWarn.push({ rel, line, target: rel, anchor })
            }
          }
          continue
        }

        const { href, anchor } = splitTarget(target)
        if (!href) continue

        const decodedHref = safeDecodeURI(href)
        const targetAbs = path.resolve(path.dirname(abs), decodedHref)
        const caseCheck = await this.verifyCase(targetAbs)

        // 4. 大小写假阳性检测
        if (caseCheck.exists && !caseCheck.exactCase) {
          caseErrors.push({
            rel,
            line,
            target: href,
            realTarget: toPosix(path.relative(path.dirname(abs), caseCheck.realPath)),
          })
        }

        // 5. 存在性与生命周期判定
        if (!caseCheck.exists) {
          const isDocTarget = href.toLowerCase().endsWith('.md')
          if (isDocTarget) {
            // 文档互链失效
            const heuristicFix = this.heuristicResolve(abs, href)
            dead.push({
              rel,
              line,
              target: href,
              reason: '目标文档不存在',
              heuristicFix,
            })
          } else {
            // 源码 / 配置引用失效：依据生命周期分级
            if (tier === 'tier1') {
              staleSnapshots.push({
                rel,
                line,
                target: href,
                reason: '源码引用目标不存在',
              })
            } else {
              // Tier 2: 历史快照静默聚合
              staleSnapshots.push({
                rel,
                line,
                target: href,
                reason: '历史快照引用已失效源码（静默）',
                isSnapshot: true,
              })
            }
          }
          continue
        }

        // 6. 跨文档锚点匹配核验
        if (anchor && !anchor.startsWith('L') && targetAbs.toLowerCase().endsWith('.md')) {
          const anchors = await this.getAnchors(targetAbs)
          if (!anchors.has(anchor) && !anchors.has(slugify(anchor))) {
            anchorWarn.push({ rel, line, target: this.relOf(targetAbs), anchor })
          }
        }
      }
    }

    const failed = dead.length > 0 || absLinks.length > 0 || caseErrors.length > 0
    return {
      scannedCount: files.length,
      dead,
      absLinks,
      caseErrors,
      anchorWarn,
      staleSnapshots,
      failed,
    }
  }

  /**
   * 执行自愈修复（fix 模式，支持 dryRun）
   */
  async fix(dryRun = false) {
    await this.buildInvertIndex()
    const files = await this.getTargetFiles()

    let changedFiles = 0
    let changedLinks = 0
    const changeLog = []

    for (const abs of files) {
      const rel = this.relOf(abs)
      let content = ''
      try {
        content = await this.fs.readFile(abs)
      } catch {
        continue
      }

      const extracted = extractMarkdownLinks(content)
      const replacements = []

      for (const item of extracted) {
        const { target, rawTargetWithAngle, targetOffsetStart, targetOffsetEnd } = item
        const { href, anchor } = splitTarget(target)

        // 场景 A: 修复 file:/// 绝对链接
        if (target.toLowerCase().startsWith('file:///')) {
          const targetAbs = fileUrlToAbsPath(href)
          if (this.inRepo(targetAbs)) {
            let newHref = toPosix(path.relative(path.dirname(abs), targetAbs))
            let newTarget = newHref + (anchor ? `#${anchor}` : '')
            if (rawTargetWithAngle.startsWith('<') && rawTargetWithAngle.endsWith('>')) {
              newTarget = `<${newTarget}>`
            }
            if (newTarget !== rawTargetWithAngle) {
              replacements.push({
                startOffset: targetOffsetStart,
                endOffset: targetOffsetEnd,
                replacement: newTarget,
              })
            }
          }
          continue
        }

        if (isExternal(target) || target.startsWith('#') || !href) {
          continue
        }

        const decodedHref = safeDecodeURI(href)
        const targetAbs = path.resolve(path.dirname(abs), decodedHref)
        const caseCheck = await this.verifyCase(targetAbs)

        // 场景 B: 修复大小写不匹配
        if (caseCheck.exists && !caseCheck.exactCase) {
          let newHref = toPosix(path.relative(path.dirname(abs), caseCheck.realPath))
          let newTarget = newHref + (anchor ? `#${anchor}` : '')
          if (rawTargetWithAngle.startsWith('<') && rawTargetWithAngle.endsWith('>')) {
            newTarget = `<${newTarget}>`
          }
          if (newTarget !== rawTargetWithAngle) {
            replacements.push({
              startOffset: targetOffsetStart,
              endOffset: targetOffsetEnd,
              replacement: newTarget,
            })
          }
          continue
        }

        // 场景 C: 404 死链通过 Basename 倒排索引智能自愈
        if (!caseCheck.exists) {
          const newRelTarget = this.heuristicResolve(abs, href)
          if (newRelTarget) {
            let newTarget = newRelTarget + (anchor ? `#${anchor}` : '')
            if (rawTargetWithAngle.startsWith('<') && rawTargetWithAngle.endsWith('>')) {
              newTarget = `<${newTarget}>`
            }
            if (newTarget !== rawTargetWithAngle) {
              replacements.push({
                startOffset: targetOffsetStart,
                endOffset: targetOffsetEnd,
                replacement: newTarget,
              })
            }
          }
        }
      }

      if (replacements.length === 0) continue

      const updatedContent = applySpanReplacements(content, replacements)
      if (updatedContent === content) continue

      changedFiles++
      changedLinks += replacements.length

      changeLog.push({
        rel,
        count: replacements.length,
      })

      if (!dryRun) {
        await this.fs.writeFile(abs, updatedContent)
      }
    }

    return {
      changedFiles,
      changedLinks,
      changeLog,
      dryRun,
    }
  }
}
