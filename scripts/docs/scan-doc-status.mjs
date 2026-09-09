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

const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)))
const PLANS_DIR = join(ROOT, 'docs', 'plans')
const ARCHIVE_DIR = join(ROOT, 'docs', 'archive')

const isCheck = process.argv.includes('--check')
const isTable = process.argv.includes('--table')
const isJson = process.argv.includes('--json')

const VALID_STATUSES = new Set(['draft', 'active', 'done', 'archived', 'implemented'])

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

function parseFrontmatter(content) {
  // 1. 尝试匹配标准 YAML Frontmatter: --- \n ... \n ---
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (yamlMatch) {
    const yaml = yamlMatch[1]
    const getField = (name) => {
      const m = yaml.match(new RegExp(`^${name}[：:]\\s*(.+)$`, 'm'))
      return m ? m[1].trim() : null
    }
    return {
      format: 'yaml',
      type: getField('方案类型'),
      status: normalizeStatus(getField('状态')),
      rawStatus: getField('状态'),
      date: getField('日期'),
    }
  }

  // 2. 尝试匹配 Markdown 引用块风格: > 方案类型：...
  const getBlockField = (name) => {
    const m = content.match(new RegExp(`^>\\s*${name}[：:]\\s*(.+)$`, 'm'))
    return m ? m[1].trim() : null
  }
  const bType = getBlockField('方案类型')
  const bStatus = getBlockField('状态')
  const bDate = getBlockField('日期')

  if (bType || bStatus || bDate) {
    return {
      format: 'blockquote',
      type: bType,
      status: normalizeStatus(bStatus),
      rawStatus: bStatus,
      date: bDate,
    }
  }

  return null
}

function normalizeStatus(raw) {
  if (!raw) return null
  const cleaned = raw.replace(/[*_`]/g, '').trim().toLowerCase()
  for (const s of VALID_STATUSES) {
    if (cleaned.startsWith(s)) return s
  }
  return cleaned
}

function deriveDomain(relPath) {
  const parts = toPosix(relPath).split('/')
  // docs/plans/<domain>/xxx.md 或 docs/archive/2026/<domain>/xxx.md
  if (parts[1] === 'plans' && parts.length >= 4) {
    return parts[2]
  }
  if (parts[1] === 'archive' && parts.length >= 5) {
    return parts[3]
  }
  return 'root'
}

function main() {
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
    } else if (!VALID_STATUSES.has(fm.status)) {
      errors.push({ file: rel, error: `非法状态值 [${fm.rawStatus}]，允许取值: ${Array.from(VALID_STATUSES).join(', ')}` })
    }
    if (!fm.date) {
      errors.push({ file: rel, error: '缺失 [日期] 字段' })
    }

    items.push({
      file: rel,
      fileName: file.split(/[\\/]/).pop(),
      domain,
      isArchived: rel.startsWith('docs/archive'),
      ...fm,
    })
  }

  if (isJson) {
    console.log(JSON.stringify({ total: items.length, items, errors }, null, 2))
    if (errors.length > 0 && isCheck) process.exit(1)
    return
  }

  if (isTable || (!isCheck && !isJson)) {
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
    if (isCheck) process.exit(1)
  } else if (isCheck) {
    console.log(`[check:doc-status] ✓ 全部 ${items.length} 篇方案文档 Frontmatter 契约验证通过 (0 错误)`)
  }
}

main()
