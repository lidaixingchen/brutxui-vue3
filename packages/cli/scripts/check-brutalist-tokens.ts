/**
 * CLI brutalist.css 令牌漂移门禁
 *
 * 背景（审查报告 §10.1/10.2）：packages/cli/src/styles/brutalist.css 是
 * 无生成标记的纯手写副本，由 cli/src/lib/constants.ts 读取注入用户项目。
 * packages/shared/src/design-tokens.ts 是全库令牌唯一事实来源，ui 的 styles.css
 * 由 scripts/generate-styles-tokens.ts 从 shared 生成；CLI 手抄副本不随 shared 变更，
 * 且 audit-brutal-fallback.ts 只扫 packages/ui/src，覆盖不到 CLI。
 *
 * 本脚本做两级校验（对齐 ui 生成产物 styles.css 而非直接读 shared，因为 CLI 值
 * 的语义是"与用户看到的 ui 样式一致"）：
 * ① 值漂移：CLI 每个主题令牌块中出现的每个 `--brutal-*` 令牌，若 ui styles.css
 *    对应块有同名令牌，则值必须一致（允许 CLI 缺令牌——覆盖率缺口另行告警）。
 * ② 块覆盖：预设主题块（pastel/mono/warm 的 light/dark）必须存在。
 *
 * 说明：styles.css 末尾含 `@media (prefers-contrast: high)` 嵌套块（高对比度特殊值，
 * 非默认主题），解析时按花括号深度跳过嵌套块，避免把其中 `.dark` 误当顶层块。
 *
 * 使用：pnpm --filter brutx-vue exec tsx scripts/check-brutalist-tokens.ts
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const cliCssPath = path.join(packageRoot, 'src', 'styles', 'brutalist.css')
const uiCssPath = path.join(packageRoot, '..', 'ui', 'src', 'styles.css')

const cliCss = readFileSync(cliCssPath, 'utf-8')
const uiCss = readFileSync(uiCssPath, 'utf-8')

/** 选择器 → 规范化块键：`:root`→root、`.dark`→dark、`.theme-x`→light:x、组合 dark→dark:x；其余块忽略 */
function normalizeSelector(selector: string): string | null {
    const s = selector.replace(/\s+/g, ' ').trim()
    if (s === ':root') return 'root'
    if (s === '.dark') return 'dark'
    const m = s.match(/\.theme-([a-z0-9-]+)/)
    if (m) return s.includes('.dark') ? `dark:${m[1]}` : `light:${m[1]}`
    return null
}

/** 颜色值规整：3 位 hex 展开为 6 位、小写化，避免 #000 与 #000000 误报漂移 */
function normalizeColor(value: string): string {
    const v = value.trim().toLowerCase()
    const hex3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/
    const m = v.match(hex3)
    if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`
    return v
}

/**
 * 按花括号深度扫描顶层非嵌套块（令牌块无嵌套；@media 等嵌套块整体跳过），
 * 提取每个块内 `--brutal-*` 令牌值。
 */
function parseThemeBlocks(css: string): Record<string, Record<string, string>> {
    const blocks: Record<string, Record<string, string>> = {}
    let i = 0
    while (i < css.length) {
        const braceIdx = css.indexOf('{', i)
        if (braceIdx === -1) break
        const selectorRaw = css.slice(i, braceIdx).trim()

        // 括号配对：找到本块闭合的 `}`
        let depth = 0
        let j = braceIdx
        let nested = false
        for (; j < css.length; j++) {
            const ch = css[j]
            if (ch === '{') {
                depth++
                if (depth > 1) nested = true
            } else if (ch === '}') {
                depth--
                if (depth === 0) break
            }
        }
        if (j >= css.length) break // 未闭合，防御性退出
        const blockText = css.slice(braceIdx + 1, j)

        if (!nested && selectorRaw) {
            const key = normalizeSelector(selectorRaw)
            if (key) {
                const vars: Record<string, string> = {}
                const varRe = /--brutal-([a-z0-9-]+):\s*([^;]+);/g
                let varMatch: RegExpExecArray | null
                while ((varMatch = varRe.exec(blockText)) !== null) {
                    vars[varMatch[1]] = normalizeColor(varMatch[2])
                }
                blocks[key] = vars
            }
        }
        i = j + 1
    }
    return blocks
}

/** 预设主题块必须齐全（light/dark 两态） */
const REQUIRED_THEMES = ['pastel', 'mono', 'warm'] as const

const uiBlocks = parseThemeBlocks(uiCss)
const cliBlocks = parseThemeBlocks(cliCss)

const failures: string[] = []

for (const theme of REQUIRED_THEMES) {
    if (!cliBlocks[`light:${theme}`]) {
        failures.push(`CLI 缺主题块 .theme-${theme}（ui 有，见 styles.css）`)
    }
    if (!cliBlocks[`dark:${theme}`]) {
        failures.push(`CLI 缺主题块 .dark .theme-${theme} / .theme-${theme}.dark（ui 有，见 styles.css）`)
    }
}

// 值漂移：CLI 出现的令牌必须与 ui 同块同名令牌一致
for (const [blockKey, cliVars] of Object.entries(cliBlocks)) {
    const uiVars = uiBlocks[blockKey]
    if (!uiVars) continue
    for (const [tokenName, cliValue] of Object.entries(cliVars)) {
        const uiValue = uiVars[tokenName]
        if (uiValue === undefined) continue // CLI 独有/ui 无此令牌，跳过（覆盖率缺口走块级检查）
        if (cliValue !== uiValue) {
            failures.push(
                `令牌 --brutal-${tokenName} 在块 ${blockKey} 漂移：CLI=${cliValue} vs ui=${uiValue}（改 shared design-tokens 后需同步 CLI）`
            )
        }
    }
}

if (failures.length > 0) {
    console.error('CLI brutalist.css 令牌与 ui styles.css 未对齐：')
    for (const failure of failures) {
        console.error(`- ${failure}`)
    }
    process.exit(1)
}

console.log(`✓ CLI brutalist.css 令牌对齐：${Object.keys(cliBlocks).length} 个块全部一致，主题块齐全`)
