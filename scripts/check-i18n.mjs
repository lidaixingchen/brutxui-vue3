#!/usr/bin/env node
/**
 * 中英双语文档文件名镜像与大小写冲突校验守卫
 */

import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { getRepoRoot, toPosixPath } from './shared/path.mjs'

const ROOT = getRepoRoot()
const DOCS_ROOT = path.join(ROOT, 'apps', 'docs')
const EN_ROOT = path.join(DOCS_ROOT, 'en')

const SKIP_DIRS = new Set([
  '.vitepress',
  'en',
  'node_modules',
  'dist',
  'public',
  'cache',
  '.temp',
  'changelog',
])

const isJson = process.argv.includes('--json')
const isStrict = !process.argv.includes('--report')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

function walkMd(dir, base = dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const p = path.join(dir, name)
    let s
    try {
      s = statSync(p)
    } catch {
      continue
    }
    if (s.isDirectory()) {
      out.push(...walkMd(p, base))
    } else if (name.endsWith('.md')) {
      const rel = toPosixPath(path.relative(base, p))
      out.push(rel)
    }
  }
  return out
}

const zhFiles = new Set(walkMd(DOCS_ROOT))
const enFiles = new Set(walkMd(EN_ROOT))

// 1. 初步找出单侧缺失
const rawMissingInEn = [...zhFiles].filter((f) => !enFiles.has(f))
const rawMissingInZh = [...enFiles].filter((f) => !zhFiles.has(f))

// 2. 细化检测大小写冲突 (Case Mismatch)
const zhLowerMap = new Map([...zhFiles].map((f) => [f.toLowerCase(), f]))
const enLowerMap = new Map([...enFiles].map((f) => [f.toLowerCase(), f]))

const casingMismatches = []
const missingInEn = []
const missingInZh = []

for (const f of rawMissingInEn) {
  const lower = f.toLowerCase()
  if (enLowerMap.has(lower)) {
    casingMismatches.push({ zh: f, en: enLowerMap.get(lower) })
  } else {
    missingInEn.push(f)
  }
}

for (const f of rawMissingInZh) {
  const lower = f.toLowerCase()
  if (!zhLowerMap.has(lower)) {
    missingInZh.push(f)
  }
}

const diagnostics = []

for (const m of casingMismatches) {
  diagnostics.push({
    file: `apps/docs/${m.zh}`,
    line: 1,
    ruleId: 'i18n/casing-mismatch',
    message: `双语文档大小写错位：中文为 ${m.zh}，英文为 en/${m.en}`,
    severity: 'error',
  })
}

for (const f of missingInEn) {
  diagnostics.push({
    file: `apps/docs/${f}`,
    line: 1,
    ruleId: 'i18n/missing-en-mirror',
    message: `缺少英文镜像文档：应补充 apps/docs/en/${f}`,
    severity: 'error',
  })
}

for (const f of missingInZh) {
  diagnostics.push({
    file: `apps/docs/en/${f}`,
    line: 1,
    ruleId: 'i18n/missing-zh-source',
    message: `缺少中文源文档：应补充 apps/docs/${f}`,
    severity: 'error',
  })
}

const totalIssues = casingMismatches.length + missingInEn.length + missingInZh.length
const isClean = totalIssues === 0

if (isJson) {
  const envelope = {
    status: isClean ? 'success' : 'error',
    summary: isClean
      ? `i18n: 中英双语文件名完全镜像 (${zhFiles.size} 个文档)`
      : `i18n: 发现 ${totalIssues} 处双语文档镜像异常`,
    diagnostics,
  }
  console.log(JSON.stringify(envelope, null, 2))
  process.exit(isClean || !isStrict ? 0 : 1)
}

if (isClean && !isVerbose) {
  console.log(`✓ i18n: 中英双语文件名完全镜像 (${zhFiles.size} 个文档)`)
  process.exit(0)
}

console.log('=== i18n 文件镜像校验 ===\n')
console.log(`中文目录 (apps/docs/): ${zhFiles.size} 个 .md 文件`)
console.log(`英文目录 (apps/docs/en/): ${enFiles.size} 个 .md 文件\n`)

if (casingMismatches.length > 0) {
  console.log(`✗ 大小写冲突 ${casingMismatches.length} 个文件：`)
  for (const m of casingMismatches) {
    console.log(`  - 中文: apps/docs/${m.zh}  <-->  英文: apps/docs/en/${m.en}`)
  }
  console.log()
}

if (missingInEn.length > 0) {
  console.log(`⚠ 英文缺失 ${missingInEn.length} 个文件（中文有但英文没有）：`)
  for (const f of missingInEn) {
    console.log(`  - apps/docs/${f}  →  应补 apps/docs/en/${f}`)
  }
  console.log()
}

if (missingInZh.length > 0) {
  console.log(`⚠ 中文缺失 ${missingInZh.length} 个文件（英文有但中文没有）：`)
  for (const f of missingInZh) {
    console.log(`  - apps/docs/en/${f}  →  应补 apps/docs/${f}`)
  }
  console.log()
}

console.log(`合计问题：${totalIssues} 处`)

if (isStrict && !isClean) {
  console.log('\n严格模式：存在缺失，exit 1。如需仅打印报告，使用 --report 标志。')
  process.exit(1)
}
process.exit(0)
