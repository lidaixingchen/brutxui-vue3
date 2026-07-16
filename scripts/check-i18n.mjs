/**
 * 中英双语文档文件名镜像校验。
 *
 * 比对中文目录（apps/docs/ 根，不含 en/）与英文目录（apps/docs/en/）下的
 * 所有 .md 文件相对路径，输出「一侧缺失」的清单。
 *
 * 设计目标（见 docs/ARCHITECTURE_OPTIMIZATION_PLAN_V2.md §6.1）：
 * - 轻量、零依赖（仅用 node:fs / node:path）
 * - 适合纯 markdown 双语站点的「翻译滞后」发现
 * - 接入 CI：`pnpm check:i18n`，存在缺失时 exit 1
 *
 * 用法：
 *   node scripts/check-i18n.mjs             # 严格模式：缺失即 exit 1
 *   node scripts/check-i18n.mjs --report    # 仅打印报告，不 exit 1（用于 PR 评论采集）
 */

import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const DOCS_ROOT = join(ROOT, 'apps', 'docs')
const EN_ROOT = join(DOCS_ROOT, 'en')

const SKIP_DIRS = new Set([
    '.vitepress',
    'en',
    'node_modules',
    'dist',
    'public',
    'cache',
    '.temp',
])

const STRICT = !process.argv.includes('--report')

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
        const p = join(dir, name)
        let s
        try {
            s = statSync(p)
        } catch {
            continue
        }
        if (s.isDirectory()) {
            out.push(...walkMd(p, base))
        } else if (name.endsWith('.md')) {
            // Normalize to forward-slash for cross-platform stability.
            const rel = relative(base, p).split(sep).join('/')
            out.push(rel)
        }
    }
    return out
}

const zhFiles = new Set(walkMd(DOCS_ROOT))
const enFiles = new Set(walkMd(EN_ROOT))

const missingInEn = [...zhFiles].filter(f => !enFiles.has(f)).sort()
const missingInZh = [...enFiles].filter(f => !zhFiles.has(f)).sort()

console.log('=== i18n 文件镜像校验 ===\n')
console.log(`中文目录 (apps/docs/): ${zhFiles.size} 个 .md 文件`)
console.log(`英文目录 (apps/docs/en/): ${enFiles.size} 个 .md 文件\n`)

if (missingInEn.length === 0 && missingInZh.length === 0) {
    console.log('✓ 中英双语文件名完全镜像，无缺失')
    process.exit(0)
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

console.log(`合计缺失：${missingInEn.length + missingInZh.length} 个文件`)

if (STRICT) {
    console.log('\n严格模式：存在缺失，exit 1。如需仅打印报告，使用 --report 标志。')
    process.exit(1)
}
