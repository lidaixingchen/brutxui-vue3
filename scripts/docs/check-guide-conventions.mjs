#!/usr/bin/env node
/**
 * docs/guides 约定守卫脚本（零依赖，仿 check-doc-links.mjs）
 *
 * 递归扫描 docs/guides 下 .md 的代码围栏内类名，命中已禁止写法即 exit 1 报 R3/R6/R7 违规：
 *   - ring 系（R7 禁止）：focus-visible:ring-2 / ring-brutal-ring / ring-offset-2 / ring-offset-background
 *   - outline-none（R7 元素级机制抑制焦点 outline）：focus-visible:outline-none / focus:outline-none / focus-within:outline-none
 *   - 硬编码前景（R6）：text-white / text-black
 *
 * 说明性反例（含违规类名的示例文本）必须写在代码围栏外（行内代码/普通文本），
 * 守卫只扫围栏内，避免将说明性反例误判为违规。
 *
 * 用法：
 *   node scripts/docs/check-guide-conventions.mjs    # 命中即 exit 1
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const GUIDES_DIR = join(ROOT, 'docs', 'guides')

// 类名边界锚定：尾部 (?![\w-]) 防误命中 ring-offset-2xl / ring-2 等相似类名；
// text-* 额外加前向 (?<![\w-])，防命中 color-text-white 这类复合标识
const BANNED_PATTERNS = [
    /focus-visible:ring-2(?![\w-])/,
    /ring-brutal-ring(?![\w-])/,
    /ring-offset-2(?![\w-])/,
    /ring-offset-background(?![\w-])/,
    /focus-visible:outline-none(?![\w-])/,
    /focus:outline-none(?![\w-])/,
    /focus-within:outline-none(?![\w-])/,
    /(?<![\w-])text-white(?![\w-])/,
    /(?<![\w-])text-black(?![\w-])/,
]

/** 递归收集 .md 文件（与 check-guide-refs 口径一致） */
function walkMd(dir, base = dir, out = []) {
    let entries
    try {
        entries = readdirSync(dir)
    } catch {
        return null
    }
    for (const name of entries) {
        const p = join(dir, name)
        let s
        try {
            s = statSync(p)
        } catch {
            continue
        }
        if (s.isDirectory()) {
            const sub = walkMd(p, base, out)
            if (sub === null) return null
        } else if (name.endsWith('.md')) {
            out.push(p)
        }
    }
    return out
}

function scanFile(file) {
    const content = readFileSync(file, 'utf-8')
    const violations = []
    let inFence = false
    let fenceMarker = '' // 开围栏标记（``` 或 ~~~），用于嵌套围栏正确配对
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const fenceMatch = line.trim().match(/^(`{3,}|~{3,})/)
        if (fenceMatch) {
            if (!inFence) {
                inFence = true
                fenceMarker = fenceMatch[1]
            } else if (fenceMatch[1][0] === fenceMarker[0] && fenceMatch[1].length >= fenceMarker.length) {
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
    const files = walkMd(GUIDES_DIR)
    if (files === null) {
        console.error(`无法读取 guides 目录：${GUIDES_DIR}`)
        process.exit(2)
    }
    const all = []
    for (const abs of files) {
        const rel = relative(ROOT, abs).split('\\').join('/')
        const vs = scanFile(abs)
        for (const v of vs) all.push({ file: rel, ...v })
    }
    console.log(`=== docs/guides 约定守卫（递归扫描 ${files.length} 个 .md，仅代码围栏内）===`)
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
