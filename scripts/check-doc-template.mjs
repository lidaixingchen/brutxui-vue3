#!/usr/bin/env node
/**
 * 组件文档必须章节规范守卫
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { getRepoRoot, toPosixPath } from './shared/path.mjs'
import { traverseMarkdownLines } from './shared/markdown-lexer.mjs'

const ROOT = getRepoRoot()
const ZH_COMP_DIR = path.join(ROOT, 'apps', 'docs', 'components')
const EN_COMP_DIR = path.join(ROOT, 'apps', 'docs', 'en', 'components')
const ZH_BLOCK_DIR = path.join(ROOT, 'apps', 'docs', 'blocks')
const EN_BLOCK_DIR = path.join(ROOT, 'apps', 'docs', 'en', 'blocks')

const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

/** 已知未达标文档例外清单（自清空约束：已达标若仍登记则报错） */
const DOC_EXCEPTIONS = new Set([])

const ZH_REQUIRED = ['## 预览', '## 安装', '## 用法', '## Props', '## 可访问性']
const ZH_PREVIEW = ['## 预览']
const EN_PREVIEW_ALT = ['## Demo', '## Preview']
const EN_REQUIRED = ['## Installation', '## Usage', '## Props', '## Accessibility']

/**
 * 归一化标题文本并剥离 VitePress 自定义锚点（如 `## 安装 {#installation}`）
 * @param {string} s
 * @returns {string}
 */
const cleanHeading = (s) => {
  return s
    .trim()
    .replace(/\s*\{#[\w-]+\}\s*$/, '')
    .replace(/\s+/g, ' ')
}

/**
 * 提取 Markdown 正文结构标题（严格隔离代码围栏与注释）
 */
function headings(content) {
  const set = new Set()
  traverseMarkdownLines(content, (ctx) => {
    if (ctx.inFence || ctx.inComment) return
    const m = /^##\s+(.+)$/.exec(ctx.raw.trim())
    if (m) {
      set.add(cleanHeading('## ' + m[1]))
    }
  })
  return set
}

/**
 * 提取特定章节区间正文（围栏内的 ## 不作为截断依据）
 */
function extractSection(content, heading) {
  const target = cleanHeading(heading)
  const lines = []
  let capturing = false

  traverseMarkdownLines(content, (ctx) => {
    const isHeading = !ctx.inFence && !ctx.inComment && /^#{1,2}\s+/.test(ctx.raw.trim())
    if (isHeading) {
      const curTitle = cleanHeading(ctx.raw)
      if (capturing) {
        // 遇到下一章节标题，停止收集
        capturing = false
        return
      }
      if (curTitle === target) {
        capturing = true
        lines.push(ctx.raw)
        return
      }
    }

    if (capturing) {
      lines.push(ctx.raw)
    }
  })

  return lines.length > 0 ? lines.join('\n') : null
}

function checkFile(filePath, requiredList, previewAlts) {
  const content = readFileSync(filePath, 'utf-8')
  const hs = headings(content)
  const isZh = !toPosixPath(filePath).includes('/en/')
  const missing = requiredList.filter((h) => {
    const cleaned = cleanHeading(h)
    if (cleaned === '## Props') {
      const apiAlts = isZh
        ? ['## Props', '## API 参考', '## API']
        : ['## Props', '## API Reference', '## API']
      return !apiAlts.some((alt) => hs.has(cleanHeading(alt)))
    }
    return !hs.has(cleaned)
  })
  const hasPreview = previewAlts ? previewAlts.some((h) => hs.has(cleanHeading(h))) : true
  const previewName = previewAlts ? previewAlts.find((h) => hs.has(cleanHeading(h))) : null
  const problems = []

  if (missing.length > 0) {
    problems.push({
      ruleId: 'doc-template/missing-section',
      message: `缺必须章节：${missing.join('、')}`,
    })
  }

  if (previewAlts && !hasPreview) {
    problems.push({
      ruleId: 'doc-template/missing-preview',
      message: `缺预览章节（${previewAlts.join(' 或 ')}）`,
    })
  }

  if (hasPreview && previewName) {
    const previewContent = extractSection(content, previewName)
    if (previewContent !== null && !previewContent.includes('<ComponentPreview')) {
      problems.push({
        ruleId: 'doc-template/missing-component-preview',
        message: '预览节缺少 <ComponentPreview>',
      })
    }
  }

  const installSection = extractSection(content, '## 安装')
  if (hs.has('## 安装') && (installSection === null || !installSection.includes('<InstallationTabs'))) {
    problems.push({
      ruleId: 'doc-template/missing-installation-tabs',
      message: '安装节缺少 <InstallationTabs>',
    })
  }

  const enInstall = extractSection(content, '## Installation')
  if (hs.has('## Installation') && (enInstall === null || !enInstall.includes('<InstallationTabs'))) {
    problems.push({
      ruleId: 'doc-template/missing-installation-tabs',
      message: '安装节缺少 <InstallationTabs>',
    })
  }

  return problems
}

function walkMd(dir) {
  if (!existsSync(dir)) return []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  return entries.filter((f) => f.endsWith('.md') && f !== 'index.md').sort()
}

const zhFiles = walkMd(ZH_COMP_DIR)
const enFiles = walkMd(EN_COMP_DIR)
if (zhFiles.length === 0 || enFiles.length === 0) {
  console.error('✗ 组件文档目录缺失或不可读，无法执行 lint（检查 apps/docs/components 与 en/ 路径）')
  process.exit(1)
}

const violations = []
const diagnostics = []

function processFiles(files, dir, required, preview) {
  for (const f of files) {
    const absPath = path.join(dir, f)
    const rel = toPosixPath(path.relative(ROOT, absPath))
    const problems = checkFile(absPath, required, preview)

    if (problems.length > 0 && !DOC_EXCEPTIONS.has(rel)) {
      violations.push({ rel, problems: problems.map((p) => p.message) })
      for (const p of problems) {
        diagnostics.push({
          file: rel,
          line: 1,
          ruleId: p.ruleId,
          message: p.message,
          severity: 'error',
        })
      }
    } else if (problems.length === 0 && DOC_EXCEPTIONS.has(rel)) {
      const msg = '已达标但仍登记在 DOC_EXCEPTIONS（自清空约束）'
      violations.push({ rel, problems: [msg] })
      diagnostics.push({
        file: rel,
        line: 1,
        ruleId: 'doc-template/stale-exception',
        message: msg,
        severity: 'error',
      })
    }
  }
}

processFiles(zhFiles, ZH_COMP_DIR, ZH_REQUIRED, ZH_PREVIEW)
processFiles(enFiles, EN_COMP_DIR, EN_REQUIRED, EN_PREVIEW_ALT)

// 若存在 blocks 目录，同样对其进行结构校验
const zhBlockFiles = walkMd(ZH_BLOCK_DIR)
const enBlockFiles = walkMd(EN_BLOCK_DIR)
processFiles(zhBlockFiles, ZH_BLOCK_DIR, ZH_REQUIRED, ZH_PREVIEW)
processFiles(enBlockFiles, EN_BLOCK_DIR, EN_REQUIRED, EN_PREVIEW_ALT)

const isClean = diagnostics.length === 0
const totalDocs = zhFiles.length + enFiles.length + zhBlockFiles.length + enBlockFiles.length

if (isJson) {
  const envelope = {
    status: isClean ? 'success' : 'error',
    summary: isClean
      ? `Doc template lint: all ${totalDocs} docs satisfy required sections`
      : `Doc template lint: ${violations.length} files failed section requirements`,
    diagnostics,
  }
  console.log(JSON.stringify(envelope, null, 2))
  process.exit(isClean ? 0 : 1)
}

if (isClean && !isVerbose) {
  console.log(`✓ Doc template lint: all ${totalDocs} docs satisfy required sections`)
  process.exit(0)
}

console.log('=== 组件文档必须章节 lint ===')
console.log(`已扫描组件与区块文档 ${totalDocs} 个`)

if (isClean) {
  console.log('✓ 全部文档满足模板必须章节')
  process.exit(0)
}

for (const v of violations) {
  console.log(`  ✗ ${v.rel}`)
  for (const p of v.problems) console.log(`      ${p}`)
}

console.log(`\n结论：${violations.length} 个文件违规，exit 1`)
process.exit(1)
