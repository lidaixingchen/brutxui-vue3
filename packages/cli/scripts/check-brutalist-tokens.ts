/**
 * CLI brutalist.css 令牌漂移门禁
 *
 * 背景：packages/cli/src/styles/brutalist.css 的令牌与预设区域现已通过
 * scripts/generate-styles-tokens.ts 自动注入；packages/shared/src/design-tokens.ts 是全库
 * 令牌唯一事实来源。
 *
 * 本脚本对齐 ui 生成产物 styles.css（CLI 值语义是"与用户看到的 ui 样式一致"），
 * 做三级门禁校验：
 * ① 块覆盖：ui styles.css 的每个主题令牌块（:root / .dark / .theme-pastel|mono|warm
 *    的 light/dark 两态），CLI 必须存在同名块，缺失即报错。
 * ② 值漂移：两方共有令牌的值必须一致（hex 3 位展开 + 小写归一化后比对）。
 * ③ @theme 区：CLI @theme 条目与 ui 生成基准一致性拦截（颜色映射、边框/圆角、阴影等）。
 *
 * 说明：styles.css 的令牌块嵌套在 `@layer base` 内，末尾还有
 * `@media (prefers-contrast: high)` 高对比度覆盖块（特殊值、非默认主题）。
 * 扫描时对 @layer/@supports 容器递归提取内部子块；@media/@keyframes 整块跳过。
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
    // 先剥离 CSS 注释：styles.css 的 :root 前有 `/* @brutx:root-tokens:start */` 生成标记，
    // 不剥离会导致选择器严格相等判断失效、该块被静默跳过（门禁假绿）
    const s = selector.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\s+/g, ' ').trim()
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

/** 提取块内 `--brutal-*` 令牌值（写入 blocks[blockKey]） */
function extractVars(blockText: string, blocks: Record<string, Record<string, string>>, blockKey: string): void {
    const vars: Record<string, string> = {}
    // 允许块内最后一个声明省略分号（CSS 合法）：值匹配到 `;` 或块文本末尾（blockText 不含闭合 `}`）
    const varRe = /--brutal-([a-z0-9-]+):\s*([^;]+?)\s*(?:;|$)/g
    let varMatch: RegExpExecArray | null
    while ((varMatch = varRe.exec(blockText)) !== null) {
        vars[varMatch[1]] = normalizeColor(varMatch[2])
    }
    blocks[blockKey] = vars
}

/**
 * 递归扫描 CSS 文本的顶层块：
 * - @layer/@supports 容器 → 递归提取内部子块（styles.css 令牌块嵌套在 @layer base 内）
 * - @media/@keyframes → 整块跳过（媒体查询内为主题的特殊覆盖值，如高对比度，不参与对齐比对）
 * - 其余顶层块 → 若为令牌块则提取
 */
function scanBlocks(css: string, blocks: Record<string, Record<string, string>>): void {
    let i = 0
    while (i < css.length) {
        const braceIdx = css.indexOf('{', i)
        if (braceIdx === -1) break
        const selectorRaw = css.slice(i, braceIdx).trim()

        // 括号配对：找到本块闭合的 `}`
        let depth = 0
        let j = braceIdx
        for (; j < css.length; j++) {
            const ch = css[j]
            if (ch === '{') {
                depth++
            } else if (ch === '}') {
                depth--
                if (depth === 0) break
            }
        }
        if (j >= css.length) break // 未闭合，防御性退出
        const blockText = css.slice(braceIdx + 1, j)

        if (/^@(layer|supports)\b/.test(selectorRaw)) {
            scanBlocks(blockText, blocks)
        } else if (/^@/.test(selectorRaw)) {
            // @media/@keyframes 等其他 @ 规则：跳过
        } else if (selectorRaw) {
            const key = normalizeSelector(selectorRaw)
            if (key) extractVars(blockText, blocks, key)
        }
        i = j + 1
    }
}

function parseThemeBlocks(css: string): Record<string, Record<string, string>> {
    const blocks: Record<string, Record<string, string>> = {}
    scanBlocks(css, blocks)
    return blocks
}

/** 值规整：小写 + 去空白 + 剥离 var(..., fallback) 中的 fallback（CLI 多数条目无 fallback，语义等价） */
function normalizeExpression(value: string): string {
    return value
        .toLowerCase()
        .replace(/\s+/g, '')
        // [^;]* 可跨嵌套括号（如 rgba(...) fallback）贪婪到末个 )，值表达式内无分号
        .replace(/var\((--brutal-[a-z0-9-]+)\s*,[^;]*\)/g, 'var($1)')
}

interface ThemeEntry {
    key: string
    innerVar: string
    /** 提取的 fallback（normalizeColor 归一化后）；条目无 fallback 时为 null */
    fallback: string | null
    /** 条目完整值表达式 */
    value: string
}

/** 提取 @theme 块内引用 --brutal-* 变量的条目（值以 var(/calc( 开头均可，如阴影 calc 组合） */
function extractThemeEntries(blockText: string): Map<string, ThemeEntry> {
    const entries = new Map<string, ThemeEntry>()
    // 与 extractVars 同形：捕获完整声明值，随后过滤「不含 var(--brutal-」的非令牌条目（如 --default-font-family）。
    // 先剥离注释再匹配（OCR 审查）：注释内含形如 --xxx: var(--brutal-... 的文本会产生幽灵条目
    const entryRe = /--([a-z0-9-]+):\s*([^;]+?)\s*(?:;|$)/g
    const cleaned = blockText.replace(/\/\*[\s\S]*?\*\//g, ' ')
    let m: RegExpExecArray | null
    while ((m = entryRe.exec(cleaned)) !== null) {
        const expr = m[2].trim()
        if (!/var\(--brutal-/.test(expr)) continue
        const innerMatch = expr.match(/--brutal-([a-z0-9-]+)/)
        const fallbackMatch = expr.match(/--brutal-[a-z0-9-]+\s*,\s*(.+)\)\s*$/)
        entries.set(m[1], {
            key: m[1],
            innerVar: innerMatch ? innerMatch[1] : '',
            fallback: fallbackMatch ? normalizeColor(fallbackMatch[1]) : null,
            value: expr,
        })
    }
    return entries
}

/**
 * 从 ui styles.css 的 :root 生成区提取 --shadow-brutal-* 令牌。
 * 变量名不以 --brutal- 开头，extractVars（@theme 块检查）不覆盖，需单独提取；
 * 返回 key 为完整变量名（shadow-brutal / shadow-brutal-sm / ...）。
 * 先剥离注释再扫描（注释内含 { } / 伪令牌声明会导致块边界错位或幽灵条目），
 * 并收集全部 :root 块合并（OCR 审查：命中首个即返回会在生成区布局变化时静默缺失）。
 */
function extractShadowEntries(css: string): Record<string, string> {
    const shadows: Record<string, string> = {}
    const visit = (text: string): void => {
        let i = 0
        while (i < text.length) {
            const braceIdx = text.indexOf('{', i)
            if (braceIdx === -1) return
            const selectorRaw = text.slice(i, braceIdx).trim()
            let depth = 0
            let j = braceIdx
            for (; j < text.length; j++) {
                const ch = text[j]
                if (ch === '{') {
                    depth++
                } else if (ch === '}') {
                    depth--
                    if (depth === 0) break
                }
            }
            if (j >= text.length) return
            const blockText = text.slice(braceIdx + 1, j)
            if (/^@(layer|supports)\b/.test(selectorRaw)) {
                visit(blockText)
            } else if (selectorRaw === ':root') {
                const shadowRe = /--(shadow-brutal[a-z0-9-]*):\s*([^;]+?)\s*(?:;|$)/g
                let m: RegExpExecArray | null
                while ((m = shadowRe.exec(blockText)) !== null) {
                    shadows[m[1]] = normalizeColor(m[2])
                }
            }
            i = j + 1
        }
    }
    visit(css.replace(/\/\*[\s\S]*?\*\//g, ' '))
    return shadows
}

/** 提取顶层 @theme 块文本（不递归容器：@theme 恒为顶层规则；先剥离注释避免块内注释的 { } 干扰配对） */
function extractThemeBlockText(css: string): string | null {
    css = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
    let i = 0
    while (i < css.length) {
        const braceIdx = css.indexOf('{', i)
        if (braceIdx === -1) return null
        const selectorRaw = css.slice(i, braceIdx).trim()
        let depth = 0
        let j = braceIdx
        for (; j < css.length; j++) {
            const ch = css[j]
            if (ch === '{') {
                depth++
            } else if (ch === '}') {
                depth--
                if (depth === 0) break
            }
        }
        if (j >= css.length) return null
        // selectorRaw 可能带前缀（ui styles.css 的 @import/@source 语句），取最后一个空白分隔 token
        if (selectorRaw.split(/\s+/).pop() === '@theme') return css.slice(braceIdx + 1, j)
        i = j + 1
    }
    return null
}

/** ③ @theme 区比对（ui @theme ∪ ui :root 的 shadow 区 vs CLI @theme） */
function verifyThemeArea(uiCss: string, cliCss: string, failures: string[]): void {
    const uiThemeText = extractThemeBlockText(uiCss)
    const cliThemeText = extractThemeBlockText(cliCss)
    if (uiThemeText === null || cliThemeText === null) {
        failures.push('@theme 块缺失（ui styles.css 或 CLI brutalist.css）')
        return
    }
    const uiEntries = extractThemeEntries(uiThemeText)
    const cliEntries = extractThemeEntries(cliThemeText)

    // 正向：ui @theme 条目（颜色映射/border/radius）→ CLI @theme 必须存在且映射一致
    for (const [key, uiEntry] of uiEntries) {
        // 阴影为复合变量表达式，统一由下方阴影专属校验段（ui @theme/root ↔ CLI @theme）做双向 fallback-stripped 比对，此处豁免
        if (key.startsWith('shadow-brutal')) continue
        const cliEntry = cliEntries.get(key)
        if (!cliEntry) {
            failures.push(`CLI @theme 缺条目 --${key}（ui 有，见 styles.css @theme）`)
            continue
        }
        if (cliEntry.innerVar !== uiEntry.innerVar) {
            failures.push(`CLI @theme --${key} 映射 var(--brutal-${cliEntry.innerVar}) 与 ui var(--brutal-${uiEntry.innerVar}) 不一致`)
        }
        if (cliEntry.fallback !== null && uiEntry.fallback !== null && cliEntry.fallback !== uiEntry.fallback) {
            failures.push(`CLI @theme --${key} fallback=${cliEntry.fallback} 与 ui fallback=${uiEntry.fallback} 不一致`)
        }
    }

    // 阴影：ui :root 生成区（styles.css）↔ CLI @theme（手写区），双向集合与剥离 fallback 的值比对
    const uiShadowVars = extractShadowEntries(uiCss)
    // fail-closed（OCR 审查）：提取为空说明生成区布局变化或解析失效，门禁须显式失败而非静默假绿
    if (Object.keys(uiShadowVars).length === 0) {
        failures.push('ui :root 未提取到任何 --shadow-brutal-* 条目（生成区布局变化？门禁 fail-closed 拦截）')
    }
    const uiShadowKeys = Object.keys(uiShadowVars)
    for (const key of uiShadowKeys) {
        const cliEntry = cliEntries.get(key)
        if (!cliEntry) {
            failures.push(`CLI @theme 缺阴影条目 --${key}（ui 生成于 :root，见 styles.css）`)
            continue
        }
        if (normalizeExpression(uiShadowVars[key]) !== normalizeExpression(cliEntry.value)) {
            failures.push(`CLI @theme --${key} 与 ui :root 值不一致（剥离 fallback 后）：CLI=${cliEntry.value} vs ui=${uiShadowVars[key]}`)
        }
    }
    for (const [key, cliEntry] of cliEntries) {
        if (cliEntry.key.startsWith('shadow-brutal') && !uiShadowKeys.includes(key)) {
            failures.push(`CLI @theme 阴影条目 --${key} 在 ui :root 不存在（疑似手抄残留）`)
        }
    }
}

const uiBlocks = parseThemeBlocks(uiCss)
const cliBlocks = parseThemeBlocks(cliCss)

const failures: string[] = []

// ① 块覆盖 + ② 值漂移：以 ui 为主题块基准，CLI 缺块或缺令牌不逃过检查
for (const [blockKey, uiVars] of Object.entries(uiBlocks)) {
    const cliVars = cliBlocks[blockKey]
    if (!cliVars) {
        failures.push(`CLI 缺主题块 ${blockKey}（ui 有，见 styles.css）`)
        continue
    }
    for (const [tokenName, uiValue] of Object.entries(uiVars)) {
        const cliValue = cliVars[tokenName]
        if (cliValue === undefined) continue // CLI 缺此令牌：覆盖率缺口，块级检查已兜底
        if (cliValue !== uiValue) {
            failures.push(
                `令牌 --brutal-${tokenName} 在块 ${blockKey} 漂移：CLI=${cliValue} vs ui=${uiValue}（改 shared design-tokens 后需同步 CLI）`
            )
        }
    }
}

// ③ @theme 区比对（ui :root 的 shadow 区一并核）
verifyThemeArea(uiCss, cliCss, failures)

if (failures.length > 0) {
    console.error('CLI brutalist.css 令牌与 ui styles.css 未对齐：')
    for (const failure of failures) {
        console.error(`- ${failure}`)
    }
    process.exit(1)
}

const shadowCount = Object.keys(extractShadowEntries(uiCss)).length
console.log(
    '✓ CLI brutalist.css 令牌对齐：' +
    Object.keys(uiBlocks).length + ' 个 ui 主题块 + @theme 区（含 ' + shadowCount + ' 个阴影条目）在 CLI 全部存在且值一致',
)
