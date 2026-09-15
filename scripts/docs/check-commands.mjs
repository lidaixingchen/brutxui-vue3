#!/usr/bin/env node
/**
 * 文档内仓库命令与脚本路径有效性检查脚本
 * 
 * 遵循 Unix 沉默原则与 Agent Result Envelope 协议。
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { getRepoRoot } from '../shared/path.mjs'

const ROOT = getRepoRoot()

const isJson = process.argv.includes('--json')
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v')

// 基础包与其 package.json 映射
const PKG_MAP = new Map()

function initPackageScripts() {
  const rootPkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))
  PKG_MAP.set('root', new Set(Object.keys(rootPkg.scripts || {})))

  const searchDirs = [path.join(ROOT, 'packages'), path.join(ROOT, 'apps')]
  for (const dir of searchDirs) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const pkgJsonPath = path.join(dir, name, 'package.json')
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
          const scriptSet = new Set(Object.keys(pkg.scripts || {}))
          if (pkg.name) {
            PKG_MAP.set(pkg.name, scriptSet)
          }
          PKG_MAP.set(name, scriptSet)
        } catch {
          // ignore malformed package.json
        }
      }
    }
  }
}

initPackageScripts()

// 覆盖文件清单（第一批 + 第二批已校准文档）
export const COVERED_DOC_FILES = [
  'AGENTS.md',
  'docs/index.md',
  'docs/guides/COMMANDS.md',
  'docs/guides/RELEASE.md',
  'docs/guides/RELEASE_ARCHITECTURE.md',
  'docs/guides/COMPONENT_GUIDE.md',
  'docs/guides/CVA.md',
  'docs/guides/DOC_GOVERNANCE.md',
  'docs/guides/TAILWIND_V4_MECHANISMS.md',
  'docs/architecture/项目架构总览.md',
  'docs/architecture/分发与公开API契约.md',
  'docs/architecture/生成与构建机制.md',
  'apps/docs/guide/contributing.md',
  'apps/docs/en/guide/contributing.md',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/copilot-instructions.md',
]

// 内置/通用无需在 scripts 校验的 pnpm 子命令
const BUILTIN_PNPM_COMMANDS = new Set([
  'install', 'i', 'add', 'remove', 'rm', 'update', 'up',
  'create', 'dlx', 'exec', 'env', 'publish', 'link', 'unlink',
  'patch', 'patch-commit', 'why', 'list', 'ls', 'outdated',
  'changeset', 'version-packages', // changesets
])

/**
 * 校验一条单行命令
 * @param {string} cmdStr 
 * @param {string} filePath 
 * @param {number} lineNo 
 * @returns {{ ruleId: string, message: string } | null}
 */
export function validateCommandLine(cmdStr, filePath, lineNo) {
  const trimmed = cmdStr.trim().replace(/^[$#]\s*/, '').replace(/\\$/, '').trim()
  if (!trimmed) return null

  // 1. 检查 node / tsx 直接执行的本地脚本路径
  const nodeScriptMatch = trimmed.match(/^(?:node|tsx|pnpm\s+exec\s+tsx)\s+([^\s]+\.(?:m?js|ts|json))/i)
  if (nodeScriptMatch) {
    const scriptPath = nodeScriptMatch[1]
    // 跳过带有占位符的路径如 <main-bench.json>
    if (scriptPath.includes('<') || scriptPath.includes('>')) {
      return null
    }
    const resolvedPath = path.resolve(ROOT, scriptPath)
    if (!existsSync(resolvedPath)) {
      return {
        ruleId: 'commands/missing-script-path',
        message: `引用的脚本文件不存在: "${scriptPath}"`,
      }
    }
    return null
  }

  // 2. 检查 pnpm 指令
  if (/^pnpm\b/.test(trimmed)) {
    const tokens = trimmed.split(/\s+/).filter(Boolean)
    // 检查是否有 --filter
    let filterPkg = null
    let idx = 1
    while (idx < tokens.length) {
      const token = tokens[idx]
      if (token === '--filter' && idx + 1 < tokens.length) {
        filterPkg = tokens[idx + 1]
        idx += 2
      } else if (token.startsWith('--filter=')) {
        filterPkg = token.slice('--filter='.length)
        idx += 1
      } else {
        break
      }
    }

    if (idx >= tokens.length) return null
    let subCommand = tokens[idx]

    // 占位符跳过，如 <pkg>, <script>
    if (subCommand.includes('<') || subCommand.includes('>')) return null
    if (filterPkg && (filterPkg.includes('<') || filterPkg.includes('>'))) return null

    // 若有 pnpm run <script>
    if (subCommand === 'run' && idx + 1 < tokens.length) {
      idx += 1
      subCommand = tokens[idx]
    }

    if (BUILTIN_PNPM_COMMANDS.has(subCommand)) {
      return null
    }

    if (filterPkg) {
      const pkgScripts = PKG_MAP.get(filterPkg)
      if (!pkgScripts) {
        return {
          ruleId: 'commands/unknown-filter-target',
          message: `--filter 指定的子包不存在: "${filterPkg}"`,
        }
      }
      if (!pkgScripts.has(subCommand)) {
        return {
          ruleId: 'commands/missing-package-script',
          message: `子包 "${filterPkg}" 未声明脚本 "${subCommand}"`,
        }
      }
      return null
    }

    // 根命令检查
    const rootScripts = PKG_MAP.get('root')
    if (rootScripts && !rootScripts.has(subCommand)) {
      // 容错：有些是 global bin 比如 git push 等，这里仅在纯字母/冒号且非参数时报警
      if (/^[a-z0-9_:-]+$/i.test(subCommand) && !subCommand.startsWith('-')) {
        return {
          ruleId: 'commands/missing-root-script',
          message: `根 package.json 未声明脚本 "${subCommand}"`,
        }
      }
    }
  }

  return null
}

/**
 * 扫描单个 Markdown 文件中的命令
 * @param {string} relPath 
 * @returns {Array<{ file: string, line: number, message: string, ruleId: string }>}
 */
export function checkFileCommands(relPath) {
  const fullPath = path.resolve(ROOT, relPath)
  if (!existsSync(fullPath)) return []

  const content = readFileSync(fullPath, 'utf-8')
  const lines = content.split('\n')
  const violations = []

  let inCodeBlock = false
  let codeLang = ''

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})(.*)$/)
    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeLang = fenceMatch[2].trim()
      } else {
        inCodeBlock = false
        codeLang = ''
      }
      continue
    }

    // 1. 在 bash / sh / text 围栏中提取命令
    if (inCodeBlock && ['bash', 'sh', 'shell', 'text', ''].includes(codeLang)) {
      if (trimmed.startsWith('pnpm ') || trimmed.startsWith('node ') || trimmed.startsWith('tsx ')) {
        const err = validateCommandLine(trimmed, relPath, i + 1)
        if (err) {
          violations.push({ file: relPath, line: i + 1, command: trimmed, ...err })
        }
      }
      continue
    }

    // 2. 正文或表格行中的行内命令提取：`pnpm ...` / `node ...` / `tsx ...`
    if (!inCodeBlock && trimmed.includes('`')) {
      const inlineCodes = rawLine.matchAll(/`([^`]+)`/g)
      for (const m of inlineCodes) {
        const span = m[1].trim()
        if (span.startsWith('pnpm ') || span.startsWith('node ') || span.startsWith('tsx ')) {
          const err = validateCommandLine(span, relPath, i + 1)
          if (err) {
            violations.push({ file: relPath, line: i + 1, command: span, ...err })
          }
        }
      }
    }
  }

  return violations
}

export function runCheck(targetFiles = COVERED_DOC_FILES) {
  const allViolations = []
  for (const f of targetFiles) {
    const fileViolations = checkFileCommands(f)
    allViolations.push(...fileViolations)
  }
  return allViolations
}

// CLI 执行入口
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || '')) {
  const violations = runCheck()

  if (isJson) {
    const result = {
      status: violations.length === 0 ? 'success' : 'error',
      violations,
    }
    console.log(JSON.stringify(result, null, 2))
  } else if (violations.length > 0) {
    console.error(`❌ 发现 ${violations.length} 处文档命令违规:`)
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} [${v.ruleId}] ${v.message}`)
    }
    process.exit(1)
  } else {
    if (isVerbose) {
      console.log('✓ 首批文档命令有效性检查通过')
    }
  }
}
