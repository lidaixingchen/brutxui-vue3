#!/usr/bin/env node
/**
 * guide/skill 引用校验脚本（零依赖，仿 check-i18n.mjs）
 *
 * 检查 1（严格，exit 1）：已删除符号引用拦截
 *   REMOVED_SYMBOLS 记录「已删除/已合并的旧符号」，递归扫描 docs/guides 与 skills 下的
 *   .md 文件，按 \b(sym)\b 匹配到即报违规。apps/docs 与 docs/reports 被排除——
 *   组件文档与审查报告中提及历史符号属合法语境（changelog / 历史记录）。
 *
 *   符号黑名单为手工维护：组件合并/改名时在 v0.9.0+ 的 CHANGELOG 中确认后，追加到
 *   REMOVED_SYMBOLS，保证「guide/skill 不再引用已删除符号」。
 *
 * 检查 2（默认 --report 只报不 fail）：登记组件文档存在性
 *   以 packages/shared/src/components.ts 的 COMPONENTS 键为单一事实源，断言每个登记
 *   组件在 apps/docs/components/ 或 apps/docs/blocks/ 下存在 {kebab}.md，且 en/ 镜像存在。
 *   检查 2 为启发式，默认只报不 fail；文档补齐后才可切严格（--strict-check2）。
 *
 * 用法：
 *   node scripts/check-guide-refs.mjs               # 检查 1 严格 + 检查 2 只报
 *   node scripts/check-guide-refs.mjs --report      # 检查 1 也只报不 fail
 *   node scripts/check-guide-refs.mjs --strict-check2  # 检查 2 缺失即 exit 1
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const REPORT = process.argv.includes('--report')
const STRICT_CHECK2 = process.argv.includes('--strict-check2')

/** 已删除/已合并符号黑名单（依据 v0.9.0 changelog 维护，勿删） */
const REMOVED_SYMBOLS = [
    'SaaSPricing',
    'SubmitButton',
    'TabsNav',
    'ComboboxMulti',
    'brutal-danger',
    'brutal-pressed-offset',
]

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '__snapshots__'])
const SCAN_ROOTS = [join(ROOT, 'docs', 'guides'), join(ROOT, 'skills')]
/** 合法历史语境目录（changelog / 审查报告） */
const EXCLUDE_DIRS = [join(ROOT, 'apps', 'docs'), join(ROOT, 'docs', 'reports')]

/** 目录不可读时返回 null（区别于空目录，避免检查 1 静默空转通过） */
function walkMd(dir, base = dir) {
    const out = []
    let entries
    try {
        entries = readdirSync(dir)
    } catch {
        return null
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
            const sub = walkMd(p, base)
            if (sub) out.push(...sub)
        } else if (name.endsWith('.md')) {
            out.push(p)
        }
    }
    return out
}

const isExcluded = (abs) =>
    EXCLUDE_DIRS.some((dir) => abs.toLowerCase().startsWith(dir.toLowerCase() + sep) || abs === dir)

/** 转义正则元字符，防止符号黑名单中的 `.`/`[`/`+` 等破坏 \b 边界匹配 */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 检查 1：已删除符号引用。返回 { violations, missingRoots }。 */
function checkRemovedSymbols() {
    const violations = []
    const missingRoots = []
    for (const root of SCAN_ROOTS) {
        const files = walkMd(root)
        if (files === null) {
            missingRoots.push(relative(ROOT, root).split(sep).join('/'))
            continue
        }
        for (const abs of files) {
            if (isExcluded(abs)) continue
            const content = readFileSync(abs, 'utf-8')
            for (const sym of REMOVED_SYMBOLS) {
                const re = new RegExp(`\\b${escapeRegExp(sym)}\\b`, 'g')
                let m
                while ((m = re.exec(content)) !== null) {
                    const lineStart = content.lastIndexOf('\n', m.index) + 1
                    const line = content.slice(0, m.index).split('\n').length
                    const rel = relative(ROOT, abs).split(sep).join('/')
                    violations.push({ sym, rel, line, text: content.slice(lineStart, m.index).split('\n')[0] })
                }
            }
        }
    }
    return { violations, missingRoots }
}

/** 解析 components.ts 的 COMPONENTS 键 */
function loadComponentKeys() {
    const file = join(ROOT, 'packages', 'shared', 'src', 'components.ts')
    const content = readFileSync(file, 'utf-8')
    const keys = []
    // 匹配 COMPONENTS 对象内的 `    'kebab-name': {` 键行
    const re = /^\s{4}(['"])([^'"]+)\1:\s*\{/gm
    let m
    while ((m = re.exec(content)) !== null) {
        keys.push(m[2])
    }
    return keys
}

/** 检查 2：登记组件文档存在性 */
function checkComponentDocs() {
    const missing = []
    const keys = loadComponentKeys()
    for (const key of keys) {
        const docDir = join(ROOT, 'apps', 'docs', 'components')
        const blockDir = join(ROOT, 'apps', 'docs', 'blocks')
        const enDocDir = join(ROOT, 'apps', 'docs', 'en', 'components')
        const enBlockDir = join(ROOT, 'apps', 'docs', 'en', 'blocks')
        const zhExists =
            existsSync(join(docDir, `${key}.md`)) || existsSync(join(blockDir, `${key}.md`))
        const enExists =
            existsSync(join(enDocDir, `${key}.md`)) || existsSync(join(enBlockDir, `${key}.md`))
        if (!zhExists || !enExists) {
            missing.push({ key, zh: zhExists, en: enExists })
        }
    }
    return missing
}

// ---------------------------------------------------------------------------
// 报告输出
// ---------------------------------------------------------------------------
const componentKeys = loadComponentKeys()
const removed = checkRemovedSymbols()
const docMissing = checkComponentDocs()

console.log('=== guide/skill 引用校验 ===\n')

console.log(`检查 1 — 已删除符号引用（扫描 ${SCAN_ROOTS.map((r) => relative(ROOT, r)).join('、')}，排除 apps/docs 与 docs/reports）`)
if (removed.missingRoots.length > 0) {
    console.log(`  ✗ 扫描目录缺失：${removed.missingRoots.join('、')}——检查 1 无法校验，视为失败`)
}
if (removed.violations.length === 0) {
    console.log('  ✓ 无已删除符号引用')
} else {
    for (const v of removed.violations) {
        console.log(`  ✗ ${v.rel}:${v.line} → 命中已删除符号 ${v.sym}`)
    }
}
console.log()

console.log(`检查 2 — 登记组件文档存在性（COMPONENTS ${componentKeys.length} 键）`)
if (docMissing.length === 0) {
    console.log('  ✓ 全部登记组件均有中英文文档')
} else {
    for (const v of docMissing) {
        const which = []
        if (!v.zh) which.push('中文缺失')
        if (!v.en) which.push('英文缺失')
        console.log(`  ⚠ ${v.key}: ${which.join('、')}`)
    }
    console.log()
    if (STRICT_CHECK2) {
        console.log('  严格模式（--strict-check2）：存在缺失，exit 1')
    } else {
        console.log('  默认只报不 fail；文档补齐后可用 --strict-check2 切严格。')
    }
}

if (removed.missingRoots.length > 0) {
    console.log('\n结论：检查 1 扫描目录缺失，无法校验，exit 1')
    process.exit(1)
}
if (removed.violations.length > 0 && !REPORT) {
    console.log('\n结论：检查 1 命中已删除符号，exit 1')
    process.exit(1)
}
if (docMissing.length > 0 && STRICT_CHECK2) {
    console.log('\n结论：检查 2 存在缺失文档（--strict-check2），exit 1')
    process.exit(1)
}
if (removed.violations.length > 0) {
    console.log('\n结论：存在风险（--report 只报不阻塞）')
} else {
    console.log('\n结论：通过')
}
process.exit(0)
