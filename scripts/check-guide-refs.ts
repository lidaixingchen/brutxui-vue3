#!/usr/bin/env node
/**
 * guide/skill 引用与组件使用文档 100% 覆盖率校验守卫
 */

import path from 'node:path'
import { COMPONENTS } from '../packages/shared/src/components.ts'
import { getRepoRoot, toPosixPath } from './shared/path.mjs'
import { existsExactCaseSync } from './shared/fs-native.mjs'

interface Diagnostic {
  file: string
  line: number
  ruleId: string
  message: string
  severity: 'error' | 'warning'
}

const ROOT = getRepoRoot()
const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

function checkComponentDocs() {
  const missing: Array<{ key: string; zh: boolean; en: boolean }> = []
  const diagnostics: Diagnostic[] = []
  const entries = Object.entries(COMPONENTS)
  const keys = Object.keys(COMPONENTS)

  for (const [key, meta] of entries) {
    // 豁免标记为 docsHidden 的内部组件
    if (meta.docsHidden === true) {
      continue
    }

    const docSlug = meta.docsSlug ?? key
    const isBlock = meta.kind === 'block'
    const subDir = isBlock ? 'blocks' : 'components'

    const zhDoc = path.join(ROOT, 'apps', 'docs', subDir, `${docSlug}.md`)
    const enDoc = path.join(ROOT, 'apps', 'docs', 'en', subDir, `${docSlug}.md`)

    const zhExists = existsExactCaseSync(zhDoc, ROOT)
    const enExists = existsExactCaseSync(enDoc, ROOT)

    if (!zhExists || !enExists) {
      missing.push({ key, zh: zhExists, en: enExists })
      if (!zhExists) {
        diagnostics.push({
          file: toPosixPath(path.relative(ROOT, zhDoc)),
          line: 1,
          ruleId: 'guide-refs/missing-zh-doc',
          message: `组件 ${key} 缺失中文使用文档或物理大小写不吻合（预期目录: apps/docs/${subDir}/）`,
          severity: 'error',
        })
      }
      if (!enExists) {
        diagnostics.push({
          file: toPosixPath(path.relative(ROOT, enDoc)),
          line: 1,
          ruleId: 'guide-refs/missing-en-doc',
          message: `组件 ${key} 缺失英文镜像文档或物理大小写不吻合（预期目录: apps/docs/en/${subDir}/）`,
          severity: 'error',
        })
      }
    }
  }

  return { keys, missing, diagnostics }
}

const { keys, missing, diagnostics } = checkComponentDocs()
const isClean = diagnostics.length === 0

if (isJson) {
  const envelope = {
    status: isClean ? 'success' : 'error',
    summary: isClean
      ? `Guide & skill references: passed (${keys.length} components documented)`
      : `Guide & skill references: ${missing.length} components missing documentation`,
    diagnostics,
  }
  console.log(JSON.stringify(envelope, null, 2))
  process.exit(isClean ? 0 : 1)
}

if (isClean && !isVerbose) {
  console.log(`✓ Guide & skill references: passed (${keys.length} components documented)`)
  process.exit(0)
}

console.log('=== guide/skill 引用与组件文档校验 ===\n')
console.log(`登记组件文档存在性（COMPONENTS ${keys.length} 键）`)

if (isClean) {
  console.log('  ✓ 全部登记组件均有中英文使用文档且大小写严格吻合')
  process.exit(0)
} else {
  for (const m of missing) {
    const issues: string[] = []
    if (!m.zh) issues.push('中文文档缺失或大小写错误')
    if (!m.en) issues.push('英文镜像缺失或大小写错误')
    console.log(`  ✗ ${m.key}: ${issues.join('、')}`)
  }
  console.log(`\n结论：${missing.length} 个组件存在使用文档缺失，exit 1`)
  process.exit(1)
}
