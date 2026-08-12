#!/usr/bin/env node
/**
 * docs/guides 约定守卫脚本（零依赖，仿 check-doc-links.mjs）
 *
 * 只扫描 docs/guides 下 .md 的代码围栏内类名，命中已废弃写法即 exit 1 报 R3/R6/R7 违规：
 *   - ring 系（R7 已废弃）：focus-visible:ring-2 / ring-brutal-ring / ring-offset-2 / ring-offset-background
 *   - outline-none（R7 元素级机制抑制焦点 outline）：focus-visible:outline-none / focus:outline-none / focus-within:outline-none
 *   - 硬编码前景（R6）：text-white / text-black
 *
 * 说明性反例（如 CVA.md「已废弃的旧蓝图」清单）必须写在代码围栏外（行内代码/普通文本），
 * 守卫只扫围栏内，避免将说明性反例误判为违规。
 *
 * 用法：
 *   node scripts/docs/check-guide-conventions.mjs    # 命中即 exit 1
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const GUIDES_DIR = join(ROOT, 'docs', 'guides')

const BANNED_PATTERNS = [
    /focus-visible:ring-2/,
    /ring-brutal-ring/,
    /ring-offset-2/,
    /ring-offset-background/,
    /focus-visible:outline-none/,
    /focus:outline-none/,
    /focus-within:outline-none/,
    /\btext-white\b/,
    /\btext-black\b/,
]

function scanFile(file) {
    const content = readFileSync(file, 'utf-8')
    const violations = []
    let inFence = false
    let fenceLang = ''
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim().startsWith('```')) {
            if (!inFence) {
                inFence = true
                fenceLang = line.trim().slice(3).trim()
            } else {
                inFence = false
            }
            continue
        }
        if (!inFence) continue
        for (const re of BANNED_PATTERNS) {
            if (re.test(line)) {
                violations.push({ line: i + 1, text: line.trim(), pattern: re.source })
            }
        }
    }
    return violations
}

function main() {
    let files
    try {
        files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.md')).sort()
    } catch {
        console.error(`无法读取 guides 目录：${GUIDES_DIR}`)
        process.exit(2)
    }
    const all = []
    for (const f of files) {
        const abs = join(GUIDES_DIR, f)
        const rel = relative(ROOT, abs).split('\\').join('/')
        const vs = scanFile(abs)
        for (const v of vs) all.push({ file: rel, ...v })
    }
    console.log(`=== docs/guides 约定守卫（扫描 ${files.length} 个文件，仅代码围栏内）===`)
    if (all.length === 0) {
        console.log('✓ 无 R3/R6/R7 违规')
        process.exit(0)
    }
    for (const v of all) {
        console.log(`  ✗ ${v.file}:${v.line} → 命中 ${v.pattern}`)
        console.log(`    ${v.text}`)
    }
    console.log(`\n结论：${all.length} 处 R3/R6/R7 违规，exit 1`)
    process.exit(1)
}

main()
