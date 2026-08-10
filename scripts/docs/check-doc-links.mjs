#!/usr/bin/env node
/**
 * docs/ 文档链接检查与修复工具
 *
 * 用途：docs/ 目录改造（DOCS_RESTRUCTURE_PLAN）的链接修复与验证：
 *   - 迁移 29 个文档后，按内置映射表重写文档间相对链接
 *   - 将历史遗留的 `file:///` 绝对链接转为相对路径（按新位置重算深度）
 *   - 修复 README-en.md 因身处 docs/ 而失效的链接
 *   - check 模式校验 0 死链、0 处 file:/// 残留（可进 CI）
 *
 * 三种模式：
 *   node scripts/docs/check-doc-links.mjs check        # 报告死链与绝对链接
 *   node scripts/docs/check-doc-links.mjs fix --dry    # 预览改写（不落盘）
 *   node scripts/docs/check-doc-links.mjs fix          # 执行改写
 *
 * 链接判定原则：
 *   - https:// / mailto: 外链不动、不检查
 *   - file:/// 绝对链接计入「残留」，迁移后必须清零
 *   - 相对链接解析到仓库内文件，目标不存在计死链
 *   - 指向 .md 的 `#锚点` 做标题匹配（GitHub 风格 slug），不匹配仅告警
 *   - 指向源码的 `#L行号` 锚点不校验
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mode = process.argv[2] ?? 'check'
const dryRun = mode === 'fix' && process.argv.includes('--dry')

/** 归一化为 posix 风格相对路径（映射表 key 与输出用） */
const toPosix = (p) => p.split(path.sep).join('/')

/** 仓库相对路径（posix） */
const relOf = (abs) => toPosix(path.relative(ROOT, abs))

/** 是否位于仓库内（Windows 盘符大小写不敏感，统一小写比较） */
const inRepo = (abs) => {
  const a = abs.toLowerCase()
  const r = ROOT.toLowerCase()
  return a === r || a.startsWith(r + path.sep)
}

// ---------------------------------------------------------------------------
// 迁移映射表：旧路径 → 新路径（仓库相对、posix 风格）
// ---------------------------------------------------------------------------
const MIGRATE = {
  // guides/（8）
  'docs/COMMIT_CONVENTION.md': 'docs/guides/COMMIT_CONVENTION.md',
  'docs/COMPONENT_GUIDE.md': 'docs/guides/COMPONENT_GUIDE.md',
  'docs/COMPONENT_DOC_TEMPLATE.md': 'docs/guides/COMPONENT_DOC_TEMPLATE.md',
  'docs/CVA.md': 'docs/guides/CVA.md',
  'docs/VISUAL_SYSTEM.md': 'docs/guides/VISUAL_SYSTEM.md',
  'docs/RELEASE.md': 'docs/guides/RELEASE.md',
  'docs/RELEASE_ARCHITECTURE.md': 'docs/guides/RELEASE_ARCHITECTURE.md',
  'docs/superpowers/demo-translation-guide.md': 'docs/guides/demo-translation-guide.md',
  // plans/（8）
  'docs/ARCHITECTURE_OPTIMIZATION_PLAN_V3.md': 'docs/plans/架构优化方案-v3.md',
  'docs/AUXILIARY_PACKAGES_IMPROVEMENT_PLAN_V2.md': 'docs/plans/辅助包改进方案-v2.md',
  'docs/COMPOSABLES_STATE_READONLY_PLAN.md': 'docs/plans/composables状态只读化方案.md',
  'docs/INFRASTRUCTURE_CLOSURE_PLAN.md': 'docs/plans/CLI基础设施闭环方案.md',
  'docs/REGISTRY_ARTIFACTS_PUBLISH_TIME_PLAN.md': 'docs/plans/registry产物发布时构建方案.md',
  'docs/deepening.md': 'docs/plans/组件深化与拓展方案.md',
  'docs/superpowers/2026-06-25-changelog-automation-design.md': 'docs/plans/changelog自动化设计.md',
  'docs/DOCS_RESTRUCTURE_PLAN.md': 'docs/plans/文档目录改造方案.md',
  // reports/（9）
  'docs/review/TECH_DEBT_REPORT.md': 'docs/reports/技术债审查报告.md',
  'docs/audit/perf-audit.md': 'docs/reports/性能审计报告.md',
  'docs/audit/hoist-failures.md': 'docs/reports/shamefullyHoist审计报告.md',
  'docs/review/ui-bug-scan-2026-07-11.md': 'docs/reports/2026-07-11-ui界面bug扫描报告.md',
  'docs/review/ui-bug-scan-2026-07-18.md': 'docs/reports/2026-07-18-ui界面bug扫描报告.md',
  'docs/review/root-scan-2026-07-12.md': 'docs/reports/2026-07-12-根仓库扫描报告.md',
  'docs/review/root-scan-2026-07-18.md': 'docs/reports/2026-07-18-根仓库扫描报告.md',
  'docs/review/auxiliary-packages-bug-scan-2026-07-12.md': 'docs/reports/2026-07-12-辅助包bug扫描报告.md',
  'docs/review/auxiliary-packages-bug-scan-2026-07-18.md': 'docs/reports/2026-07-18-辅助包bug扫描报告.md',
  // archive/2026/（4）
  'docs/ARCHITECTURE_OPTIMIZATION_PLAN.md': 'docs/archive/2026/架构优化方案-v1.md',
  'docs/ARCHITECTURE_OPTIMIZATION_PLAN_V2.md': 'docs/archive/2026/架构优化方案-v2.md',
  'docs/AUXILIARY_PACKAGES_IMPROVEMENT_PLAN.md': 'docs/archive/2026/辅助包改进方案-v1.md',
  'docs/superpowers/component/component-extension-plan.md': 'docs/archive/2026/组件拓展方案.md',
}

/** 本次删除的文件（check 时其被引用视作死链；fix 不生成） */
const DELETED = ['docs/audit/hoist-deps-list.txt', 'docs/audit/hoist-scan-output.txt']

/** 保留原位但需特例修复链接的文件 */
const SPECIAL = {
  'docs/README-en.md': {
    'README.md': '../README.md',
    'LICENSE': '../LICENSE',
  },
}

// 新路径 → 旧路径（fix 时解析旧基准）
const NEW2OLD = Object.fromEntries(Object.entries(MIGRATE).map(([o, n]) => [n, o]))

// ---------------------------------------------------------------------------
// 文件收集
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.turbo', 'coverage'])

function collectMd(root, base, acc = []) {
  let entries
  try {
    entries = readdirSync(base, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) collectMd(root, path.join(base, e.name), acc)
    } else if (e.name.endsWith('.md')) {
      acc.push(path.join(base, e.name))
    }
  }
  return acc
}

/** check 与 fix 共用的文件集：docs/** 下全部 md + 根 AGENTS.md + 根 README.md */
function targetFiles() {
  const files = collectMd(ROOT, path.join(ROOT, 'docs'))
  for (const name of ['AGENTS.md', 'README.md']) {
    const p = path.join(ROOT, name)
    if (existsSync(p)) files.push(p)
  }
  return files.sort()
}

// ---------------------------------------------------------------------------
// 链接提取（跳过围栏代码块与行内代码）
// ---------------------------------------------------------------------------
const LINK_RE = /(!?)\[([^\]]*)\]\(([^)]+)\)/g

function extractLinks(content) {
  const links = []
  let inFence = false
  content.split('\n').forEach((line, i) => {
    if (line.trim().startsWith('```')) {
      inFence = !inFence
      return
    }
    if (inFence) return
    const stripped = line.replace(/`[^`\n]*`/g, '')
    let m
    LINK_RE.lastIndex = 0
    while ((m = LINK_RE.exec(stripped)) !== null) {
      links.push({ line: i + 1, text: m[2], target: m[3].split(/\s+/)[0] })
    }
  })
  return links
}

/** 拆分为 href 与锚点 */
function splitTarget(target) {
  const idx = target.indexOf('#')
  if (idx === -1) return { href: target, anchor: '' }
  return { href: target.slice(0, idx), anchor: target.slice(idx + 1) }
}

/**
 * file:/// URL → 仓库内绝对路径
 * 兼容两种形态：file:///e:/project/...（Windows）与 file:///home/user/...（Unix）
 */
function urlToAbs(href) {
  let p = href.replace(/^file:\/\//i, '')
  p = p.replace(/^localhost\//i, '')
  if (/^\/[a-zA-Z]:/.test(p)) p = p.slice(1) // Windows：file:///e:/... → e:/...
  return path.resolve(p)
}

/** 目标是否外链（http/mailto 等 scheme；file:// 另行处理） */
const isExternal = (t) => /^[a-z][a-z0-9+.-]*:/i.test(t)

// ---------------------------------------------------------------------------
// 锚点校验（GitHub 风格 slug，仅对 .md 目标、非 #L 锚点；不匹配仅告警）
// ---------------------------------------------------------------------------
function slugify(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function headingAnchors(abs) {
  const anchors = new Set()
  const counts = new Map()
  let inFence = false
  for (const line of readFileSync(abs, 'utf8').split('\n')) {
    if (line.trim().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = /^#{1,6}\s+(.+)$/.exec(line)
    if (!m) continue
    const base = slugify(m[1])
    const n = counts.get(base) ?? 0
    counts.set(base, n + 1)
    anchors.add(n === 0 ? base : `${base}-${n}`)
  }
  return anchors
}

// ---------------------------------------------------------------------------
// check 模式
// ---------------------------------------------------------------------------
function runCheck() {
  const files = targetFiles()
  const dead = []
  const stale = []
  const absLinks = []
  const anchorWarn = []

  for (const abs of files) {
    const rel = relOf(abs)
    for (const { line, target } of extractLinks(readFileSync(abs, 'utf8'))) {
      if (target.toLowerCase().startsWith('file:///')) {
        const { href, anchor } = splitTarget(target)
        const t = urlToAbs(href)
        absLinks.push({ rel, line, target: href })
        if (!inRepo(t) || !existsSync(t)) {
          stale.push({ rel, line, target: href, reason: 'file:// 目标不存在（历史快照引用已失效源码）' })
        }
        if (anchor && !anchor.startsWith('L') && existsSync(t) && t.toLowerCase().endsWith('.md')) {
          checkMdAnchor(anchorWarn, rel, line, t, anchor)
        }
        continue
      }
      if (isExternal(target)) continue
      if (target.startsWith('#')) {
        checkMdAnchor(anchorWarn, rel, line, abs, target.slice(1))
        continue
      }
      const { href, anchor } = splitTarget(target)
      const t = path.resolve(path.dirname(abs), href)
      if (DELETED.includes(relOf(t))) {
        dead.push({ rel, line, target: href, reason: '目标文件已删除' })
        continue
      }
      if (!existsSync(t)) {
        // 文档间 .md 互链失效计硬死链；源码/配置文件失效计历史快照告警
        if (href.toLowerCase().endsWith('.md')) dead.push({ rel, line, target: href, reason: '目标文档不存在' })
        else stale.push({ rel, line, target: href, reason: '目标不存在（历史快照引用已失效源码）' })
        continue
      }
      if (anchor && !anchor.startsWith('L') && t.toLowerCase().endsWith('.md')) {
        checkMdAnchor(anchorWarn, rel, line, t, anchor)
      }
    }
  }

  const fmt = (item) => `  ${item.rel}:${item.line} → ${item.target}（${item.reason}）`
  console.log(`[check] 扫描 ${files.length} 个 md 文件`)
  console.log(`[check] 死链 ${dead.length} 处：`)
  dead.forEach((d) => console.log(fmt(d)))
  console.log(`[check] 源码引用失效（历史快照，告警） ${stale.length} 处：`)
  stale.forEach((s) => console.log(fmt(s)))
  console.log(`[check] file:/// 绝对链接 ${absLinks.length} 处：`)
  absLinks.forEach((a) => console.log(`  ${a.rel}:${a.line} → ${a.target}`))
  console.log(`[check] 锚点未匹配告警 ${anchorWarn.length} 处：`)
  anchorWarn.forEach((w) => console.log(`  ${w.rel}:${w.line} → ${w.target}（标题「${w.heading}」找不到锚点 ${w.anchor}）`))

  const failed = dead.length > 0 || absLinks.length > 0
  console.log(`[check] 结论：${failed ? `未通过（死链 ${dead.length}、绝对链接 ${absLinks.length}）` : '通过（0 死链、0 绝对链接）'}`)
  process.exitCode = failed ? 1 : 0
}

function checkMdAnchor(report, rel, line, targetAbs, anchor) {
  const anchors = headingAnchors(targetAbs)
  const decoded = safeDecode(anchor)
  if (!anchors.has(anchor) && !anchors.has(decoded) && !anchors.has(slugify(decoded))) {
    report.push({ rel, line, target: relOf(targetAbs), anchor, heading: findHeading(targetAbs, anchor) })
  }
}

function safeDecode(s) {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function findHeading(targetAbs, anchor) {
  const want = safeDecode(anchor)
  for (const line of readFileSync(targetAbs, 'utf8').split('\n')) {
    const m = /^#{1,6}\s+(.+)$/.exec(line)
    if (m && slugify(m[1]) === want) return m[1]
  }
  return want
}

// ---------------------------------------------------------------------------
// fix 模式
// ---------------------------------------------------------------------------
/** 单个链接目标重写（abs = 当前文件新绝对路径） */
function rewriteTarget(abs, target) {
  if (target.toLowerCase().startsWith('file:///')) {
    const { href, anchor } = splitTarget(target)
    const t = urlToAbs(href)
    if (!inRepo(t)) return target
    return toPosix(path.relative(path.dirname(abs), t)) + (anchor ? `#${anchor}` : '')
  }
  if (isExternal(target) || target.startsWith('#')) return target

  const { href, anchor } = splitTarget(target)
  const rel = relOf(abs)
  if (SPECIAL[rel] && SPECIAL[rel][href] !== undefined) {
    return SPECIAL[rel][href] + (anchor ? `#${anchor}` : '')
  }

  // 幂等保护：链接按当前新位置已能解析到真实文件 → 已是新基准（如首轮 fix 生成的），
  // 不得再按旧基准二次重算（否则 `../guides/x.md` 会被改成 `../../guides/x.md` 双重偏移）
  const currentAbs = path.resolve(path.dirname(abs), href)
  if (existsSync(currentAbs)) {
    return target
  }

  // 以「旧位置」为基准解析旧链接，再映射到新位置
  const oldFile = NEW2OLD[rel] ?? rel
  const oldAbs = path.resolve(path.dirname(path.join(ROOT, oldFile)), href)
  let newTarget = oldAbs
  const mapped = MIGRATE[relOf(oldAbs)]
  if (mapped) {
    newTarget = path.resolve(ROOT, mapped)
  } else if (!existsSync(oldAbs)) {
    // 根基准 fallback：作者常按仓库根书写 `packages/...`、`turbo.json` 等相对路径，
    // 文档身处 docs/ 下按旧位置解析必然失败，此时尝试以仓库根为基准。
    const rootAbs = path.resolve(ROOT, href)
    if (existsSync(rootAbs)) {
      newTarget = MIGRATE[relOf(rootAbs)] ? path.resolve(ROOT, MIGRATE[relOf(rootAbs)]) : rootAbs
    }
  }
  return toPosix(path.relative(path.dirname(abs), newTarget)) + (anchor ? `#${anchor}` : '')
}

function rewriteFileContent(abs, content) {
  let inFence = false
  return content
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('```')) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      return line.replace(LINK_RE, (whole, bang, text, target) => {
        const t = target.split(/\s+/)[0]
        return `${bang}[${text}](${rewriteTarget(abs, t)})`
      })
    })
    .join('\n')
}

function runFix() {
  const files = targetFiles()
  let changedFiles = 0
  let changedLinks = 0

  for (const abs of files) {
    const before = readFileSync(abs, 'utf8')
    const after = rewriteFileContent(abs, before)
    if (after === before) continue
    changedFiles++
    const n = (before.split('\n').filter((l, i) => l !== after.split('\n')[i])).length
    changedLinks += n
    if (dryRun) {
      console.log(`[fix:dry] ${relOf(abs)}：${n} 行将被改写`)
    } else {
      writeFileSync(abs, after)
      console.log(`[fix] ${relOf(abs)}：${n} 行已改写`)
    }
  }

  console.log(`[fix${dryRun ? ':dry' : ''}] ${changedFiles} 个文件、约 ${changedLinks} 处链接`)
}

// ---------------------------------------------------------------------------
// 入口
// ---------------------------------------------------------------------------
if (mode === 'check') runCheck()
else if (mode === 'fix') runFix()
else {
  console.error(`用法：node scripts/docs/check-doc-links.mjs <check|fix [--dry]>（实际传入：${mode}）`)
  process.exitCode = 2
}
