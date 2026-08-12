/**
 * CLI brutalist.css 令牌漂移门禁
 *
 * 背景（审查报告 §10.1/10.2）：packages/cli/src/styles/brutalist.css 是
 * 无生成标记的纯手写副本，由 cli/src/lib/constants.ts 读取注入用户项目。
 * packages/shared/src/design-tokens.ts 是全库令牌唯一事实来源，ui 的 styles.css
 * 由 scripts/generate-styles-tokens.ts 从 shared 生成；CLI 手抄副本不随 shared 变更，
 * 且 audit-brutal-fallback.ts 只扫 packages/ui/src，覆盖不到 CLI。
 *
 * 本脚本对齐 ui 生成产物 styles.css（CLI 值语义是"与用户看到的 ui 样式一致"），
 * 做两级校验：
 * ① 块覆盖：ui styles.css 的每个主题令牌块（:root / .dark / .theme-pastel|mono|warm
 *    的 light/dark 两态），CLI 必须存在同名块，缺失即报错。
 * ② 值漂移：两方共有令牌的值必须一致（hex 3 位展开 + 小写归一化后比对；
 *    允许 CLI 缺令牌——覆盖率缺口由块级检查兜底）。
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
    const varRe = /--brutal-([a-z0-9-]+):\s*([^;]+);/g
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

if (failures.length > 0) {
    console.error('CLI brutalist.css 令牌与 ui styles.css 未对齐：')
    for (const failure of failures) {
        console.error(`- ${failure}`)
    }
    process.exit(1)
}

console.log(`✓ CLI brutalist.css 令牌对齐：${Object.keys(uiBlocks).length} 个 ui 主题块在 CLI 全部存在且值一致`)
