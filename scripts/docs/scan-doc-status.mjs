#!/usr/bin/env node
/**
 * 方案文档状态扫描与 Frontmatter 契约守卫脚本（零依赖）
 *
 * 定位：
 *   作为 docs/plans 与 docs/archive 下方案生命周期的单一事实来源（SSOT）校验器。
 *   杜绝人工维护静态大表格带来的脑裂与状态漂移，保障 CI 环境下 Frontmatter 完整性。
 *
 * 用法：
 *   node scripts/docs/scan-doc-status.mjs --check      # CI 严格校验：字段缺失/非法状态即 exit 1
 *   node scripts/docs/scan-doc-status.mjs --table      # 终端输出各领域方案活跃/归档全景矩阵看板
 *   node scripts/docs/scan-doc-status.mjs --json       # 输出 JSON 格式方案元数据
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  VALID_STATUS_SET,
  VALID_STATUSES,
  ArchiveEngine,
  parseFrontmatter,
  deriveDomain,
  normalizeStatus,
} from './lib/archive-engine.mjs'

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)))
const PLANS_DIR = join(ROOT, 'docs', 'plans')
const ARCHIVE_DIR = join(ROOT, 'docs', 'archive')

const isCheck = process.argv.includes('--check')
const isCheckIndex = process.argv.includes('--check-index')
const isTable = process.argv.includes('--table')
const isJson = process.argv.includes('--json')

function toPosix(p) {
  return p.split('\\').join('/')
}

function walkMdFiles(dir, acc = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkMdFiles(fullPath, acc)
    } else if (entry.name.endsWith('.md')) {
      acc.push(fullPath)
    }
  }
  return acc
}

async function main() {
  const planFiles = walkMdFiles(PLANS_DIR)
  const archiveFiles = walkMdFiles(ARCHIVE_DIR)
  const allFiles = [...planFiles, ...archiveFiles].sort()

  const items = []
  const errors = []

  for (const file of allFiles) {
    const rel = toPosix(relative(ROOT, file))
    const content = readFileSync(file, 'utf-8')
    const fm = parseFrontmatter(content)
    const domain = deriveDomain(rel)

    if (!fm) {
      errors.push({ file: rel, error: '缺失 Frontmatter 元数据头部' })
      continue
    }

    if (!fm.type) {
      errors.push({ file: rel, error: '缺失 [方案类型] 字段' })
    }
    if (!fm.rawStatus) {
      errors.push({ file: rel, error: '缺失 [状态] 字段' })
    } else if (!VALID_STATUS_SET.has(fm.status)) {
      errors.push({ file: rel, error: `非法状态值 [${fm.rawStatus}]，允许取值: ${VALID_STATUSES.join(', ')}` })
    }
    if (!fm.date) {
      errors.push({ file: rel, error: '缺失 [日期] 字段' })
    }

    if (rel.startsWith('docs/plans/')) {
      if (fm.status === 'archived') {
        errors.push({
          file: rel,
          error: '状态为 [archived] 的方案不可滞留在 docs/plans/，请移入对应年度归档目录。',
        })
      } else if (fm.status === 'done') {
        errors.push({
          file: rel,
          error: '方案状态已为 [done]，但仍滞留在 docs/plans/ 尚未归档。请运行 pnpm doc:archive 一键归档并同步知识地图',
        })
      }
    } else if (rel.startsWith('docs/archive/')) {
      if (fm.status !== 'archived') {
        errors.push({
          file: rel,
          error: `归档库 docs/archive/ 内方案状态必须为 [archived]，当前为 [${fm.rawStatus}]。`,
        })
      }
    }

    items.push({
      file: rel,
      fileName: file.split(/[\\/]/).pop(),
      domain,
      isArchived: rel.startsWith('docs/archive'),
      ...fm,
    })
  }

  if (isCheck || isCheckIndex) {
    const engine = new ArchiveEngine({ rootDir: ROOT, git: false })
    try {
      const indexResult = await engine.refreshIndex({ checkOnly: true })
      if (!indexResult.consistent) {
        errors.push({
          file: 'docs/index.md',
          error: '知识地图索引与方案物理状态不一致。请运行 pnpm doc:archive --refresh 刷新 docs/index.md',
        })
      }
    } catch (err) {
      errors.push({
        file: 'docs/index.md',
        error: `知识地图索引校验异常: ${err.message}`,
      })
    }
  }

  if (isJson) {
    console.log(JSON.stringify({ total: items.length, items, errors }, null, 2))
    if (errors.length > 0 && (isCheck || isCheckIndex)) process.exit(1)
    return
  }

  if (isTable || (!isCheck && !isCheckIndex && !isJson)) {
    console.log('\n=== BrutxUI 方案工程全景状态矩阵 ===\n')
    const domains = ['cli', 'ui', 'styles', 'core', 'root']
    for (const d of domains) {
      const dItems = items.filter((i) => i.domain === d)
      if (dItems.length === 0) continue
      const activeItems = dItems.filter((i) => !i.isArchived)
      const archItems = dItems.filter((i) => i.isArchived)
      console.log(`【领域: ${d.toUpperCase()}】(活跃: ${activeItems.length} | 归档: ${archItems.length})`)
      if (activeItems.length > 0) {
        console.log('  [活跃方案 plans/]:')
        for (const it of activeItems) {
          console.log(`    - [${it.status.toUpperCase()}] ${it.fileName} (${it.date}) — ${it.type}`)
        }
      }
      if (archItems.length > 0) {
        console.log(`  [历史归档 archive/]: 共 ${archItems.length} 篇`)
      }
      console.log('')
    }
    console.log(`总计扫描方案: ${items.length} 篇 | 发现错误: ${errors.length} 处\n`)
  }

  if (errors.length > 0) {
    console.error(`[check:doc-status] 发现 ${errors.length} 处文档契约违规:`)
    for (const e of errors) {
      console.error(`  ✖ ${e.file}: ${e.error}`)
    }
    if (isCheck || isCheckIndex) process.exit(1)
  } else if (isCheck || isCheckIndex) {
    console.log(`[check:doc-status] ✓ 全部 ${items.length} 篇方案文档 Frontmatter 契约与索引验证通过 (0 错误)`)
  }
}

main().catch((err) => {
  console.error('[check:doc-status] 致命异常:', err)
  process.exit(1)
})
