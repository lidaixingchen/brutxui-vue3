/**
 * 校验 utils.ts 的 BRUTAL_COLOR_NAMES 与 styles.css 的 --color-brutal-* 一致。
 * 二者任一漂移（新增/重命名颜色令牌后漏同步）会导致 cn() 冲突去重静默失效，
 * 但现有审计（check-brutalist-tokens）只覆盖 @theme 区与 CLI 侧，无法捕获此处。
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const stylesCssPath = resolve(currentDir, '../src/styles.css')
const utilsTsPath = resolve(currentDir, '../src/lib/utils.ts')

const stylesCss = readFileSync(stylesCssPath, 'utf8')
const utilsTs = readFileSync(utilsTsPath, 'utf8')

const cssVarNames = new Set(
    [...stylesCss.matchAll(/--color-brutal-[a-z-]+/g)].map((m) => m[0]),
)

const listMatch = utilsTs.match(/const BRUTAL_COLOR_NAMES = \[([\s\S]*?)\]/)
if (!listMatch) {
    console.error('[check-twmerge-colors] BRUTAL_COLOR_NAMES not found in lib/utils.ts')
    process.exit(1)
}

const listNames = new Set(
    [...listMatch[1].matchAll(/'([a-z-]+)'/g)].map((m) => `--color-${m[1]}`),
)

const missingInList = [...cssVarNames].filter((name) => !listNames.has(name))
const staleInList = [...listNames].filter((name) => !cssVarNames.has(name))

if (missingInList.length > 0 || staleInList.length > 0) {
    console.error('[check-twmerge-colors] BRUTAL_COLOR_NAMES 与 styles.css 的 --color-brutal-* 不一致：')
    if (missingInList.length > 0) {
        console.error('  styles.css 有但清单缺失:', missingInList.join(', '))
    }
    if (staleInList.length > 0) {
        console.error('  清单有但 styles.css 已无:', staleInList.join(', '))
    }
    process.exit(1)
}

console.log(`[check-twmerge-colors] 一致（${listNames.size} 项）`)
