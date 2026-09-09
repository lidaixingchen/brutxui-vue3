#!/usr/bin/env node
/**
 * docs/guides 约定守卫脚本
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { getRepoRoot, toPosixPath } from '../shared/path.mjs'
import { traverseMarkdownLines } from '../shared/markdown-lexer.mjs'

const ROOT = getRepoRoot()
const GUIDES_DIR = path.join(ROOT, 'docs', 'guides')

const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

const BANNED_PATTERNS = [
  { pattern: /ring-offset-background(?![\w-])/, ruleId: 'guide-conventions/r7-banned-v3-class', desc: 'v3 遗留类 (ring-offset-background)' },
  { pattern: /focus-visible:outline-none(?![\w-])/, ruleId: 'guide-conventions/r7-banned-outline-none', desc: '抑制焦点 outline (focus-visible:outline-none)' },
  { pattern: /focus:outline-none(?![\w-])/, ruleId: 'guide-conventions/r7-banned-outline-none', desc: '抑制焦点 outline (focus:outline-none)' },
  { pattern: /focus-within:outline-none(?![\w-])/, ruleId: 'guide-conventions/r7-banned-outline-none', desc: '抑制焦点 outline (focus-within:outline-none)' },
  { pattern: /(?<![\w-])text-white(?![\w-])/, ruleId: 'guide-conventions/r6-banned-hardcoded-color', desc: '硬编码前景 (text-white)' },
  { pattern: /(?<![\w-])text-black(?![\w-])/, ruleId: 'guide-conventions/r6-banned-hardcoded-color', desc: '硬编码前景 (text-black)' },
]

function walkMd(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return null
  }
  for (const name of entries) {
    const p = path.join(dir, name)
    let s
    try {
      s = statSync(p)
    } catch {
      continue
    }
    if (s.isDirectory()) {
      const sub = walkMd(p, out)
      if (sub === null) return null
    } else if (name.endsWith('.md')) {
      out.push(p)
    }
  }
  return out
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const violations = []

  traverseMarkdownLines(content, (ctx) => {
    if (!ctx.inFence) return
    for (const item of BANNED_PATTERNS) {
      if (item.pattern.test(ctx.raw)) {
        violations.push({
          line: ctx.line,
          text: ctx.raw.trim(),
          pattern: item.pattern.source,
          ruleId: item.ruleId,
          desc: item.desc,
        })
      }
    }
  })

  return violations
}

const files = walkMd(GUIDES_DIR)
if (files === null) {
  console.error(`无法读取 guides 目录：${GUIDES_DIR}`)
  process.exit(2)
}

const allViolations = []
const diagnostics = []

for (const abs of files) {
  const rel = toPosixPath(path.relative(ROOT, abs))
  const vs = scanFile(abs)
  for (const v of vs) {
    allViolations.push({ file: rel, ...v })
    diagnostics.push({
      file: rel,
      line: v.line,
      ruleId: v.ruleId,
      message: `命中了禁用的指南约定写法: ${v.desc}`,
      severity: 'error',
    })
  }
}

const isClean = diagnostics.length === 0

if (isJson) {
  const envelope = {
    status: isClean ? 'success' : 'error',
    summary: isClean
      ? `Guide conventions: 0 violations in ${files.length} guide docs`
      : `Guide conventions: ${allViolations.length} violations in ${files.length} guide docs`,
    diagnostics,
  }
  console.log(JSON.stringify(envelope, null, 2))
  process.exit(isClean ? 0 : 1)
}

if (isClean && !isVerbose) {
  console.log(`✓ Guide conventions: 0 violations in ${files.length} guide docs`)
  process.exit(0)
}

console.log(`=== docs/guides 约定守卫（递归扫描 ${files.length} 个 .md，仅代码围栏内）===`)
if (isClean) {
  console.log('✓ 无 R3/R6/R7 违规')
  process.exit(0)
}

for (const v of allViolations) {
  console.log(`  ✗ ${v.file}:${v.line} → 命中 ${v.pattern}`)
  console.log(`    ${v.text}`)
}
console.log(`\n结论：${allViolations.length} 处 R3/R6/R7 违规，exit 1`)
process.exit(1)
