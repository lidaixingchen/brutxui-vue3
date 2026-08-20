/**
 * 校验粗野主义颜色与工具函数四端一致性门禁：
 * 1. Shared: brutx-shared-vue 的 BRUTAL_COLOR_NAMES
 * 2. Styles: packages/ui/src/styles.css 的 --color-brutal-*
 * 3. UI Utils: packages/ui/src/lib/utils.ts 中的 BRUTAL_COLOR_NAMES 与 FOCUS_RING_CLASSES
 * 4. CLI Constants: packages/cli/src/lib/constants.ts 的 UTILS_TEMPLATE & CN_FUNCTION_BODY_TEMPLATE
 *
 * 任何一端发生漂移均会破坏样式覆盖或导致组件编译错误，门禁精准报错并拦截 CI。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BRUTAL_COLOR_NAMES } from 'brutx-shared-vue';

const currentDir = dirname(fileURLToPath(import.meta.url));
const stylesCssPath = resolve(currentDir, '../src/styles.css');
const utilsTsPath = resolve(currentDir, '../src/lib/utils.ts');
const cliConstantsPath = resolve(currentDir, '../../cli/src/lib/constants.ts');

const stylesCss = readFileSync(stylesCssPath, 'utf8');
const utilsTs = readFileSync(utilsTsPath, 'utf8');
const cliConstants = readFileSync(cliConstantsPath, 'utf8');

let hasError = false;

// 1. Shared 端基准颜色集合（去掉前缀的纯名称）
const sharedColorSet = new Set(BRUTAL_COLOR_NAMES);

// 2. styles.css 中的 --color-brutal-* 提取
const cssVarNames = new Set(
    [...stylesCss.matchAll(/--color-(brutal-[a-z-]+)/g)].map(m => m[1]),
);

// 3. UI utils.ts 中的 BRUTAL_COLOR_NAMES 提取
const uiListMatch = utilsTs.match(/const BRUTAL_COLOR_NAMES = \[([\s\S]*?)\]/);

// 4. CLI constants.ts 中的 UTILS_TEMPLATE 与 CN_FUNCTION_BODY_TEMPLATE
const utilsTemplateMatch = cliConstants.match(/export const UTILS_TEMPLATE = `([\s\S]*?)`;/);
const bodyTemplateMatch = cliConstants.match(/export const CN_FUNCTION_BODY_TEMPLATE = `([\s\S]*?)`;/);

// 颜色对齐比对辅助函数
function compareColorSets(targetName: string, targetSet: Set<string>): void {
    const missing = [...sharedColorSet].filter(name => !targetSet.has(name));
    const extra = [...targetSet].filter(name => !sharedColorSet.has(name));

    if (missing.length > 0 || extra.length > 0) {
        hasError = true;
        console.error(`[check-twmerge-colors] ✗ ${targetName} 与 shared BRUTAL_COLOR_NAMES 不一致:`);
        if (missing.length > 0) {
            console.error(`  shared 有但 ${targetName} 缺失:`, missing.join(', '));
        }
        if (extra.length > 0) {
            console.error(`  ${targetName} 有但 shared 无:`, extra.join(', '));
        }
    }
}

compareColorSets('styles.css (--color-brutal-*)', cssVarNames);

if (!uiListMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 packages/ui/src/lib/utils.ts 中找到 BRUTAL_COLOR_NAMES 声明');
} else {
    const uiColorSet = new Set([...uiListMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]));
    compareColorSets('UI lib/utils.ts', uiColorSet);
}

if (!utilsTemplateMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 packages/cli/src/lib/constants.ts 中找到 UTILS_TEMPLATE 声明');
} else {
    const cliUtilsColors = new Set([...utilsTemplateMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]));
    compareColorSets('CLI UTILS_TEMPLATE', cliUtilsColors);
}

if (!bodyTemplateMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 packages/cli/src/lib/constants.ts 中找到 CN_FUNCTION_BODY_TEMPLATE 声明');
} else {
    const cliBodyColors = new Set([...bodyTemplateMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]));
    compareColorSets('CLI CN_FUNCTION_BODY_TEMPLATE', cliBodyColors);
}

// 5. FOCUS_RING_CLASSES 一致性校验
const uiFocusRingMatch = utilsTs.match(/export\s+const\s+FOCUS_RING_CLASSES\s*=\s*['"]([^'"]+)['"]/);
const cliUtilsRingMatch = utilsTemplateMatch?.[1]?.match(/export\s+const\s+FOCUS_RING_CLASSES\s*=\s*["']([^"']+)["']/);
const cliBodyRingMatch = bodyTemplateMatch?.[1]?.match(/export\s+const\s+FOCUS_RING_CLASSES\s*=\s*["']([^"']+)["']/);

if (!uiFocusRingMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 packages/ui/src/lib/utils.ts 中找到 FOCUS_RING_CLASSES 导出');
}

if (!cliUtilsRingMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 CLI UTILS_TEMPLATE 中找到 FOCUS_RING_CLASSES 导出');
}

if (!cliBodyRingMatch) {
    hasError = true;
    console.error('[check-twmerge-colors] ✗ 未在 CLI CN_FUNCTION_BODY_TEMPLATE 中找到 FOCUS_RING_CLASSES 导出');
}

if (uiFocusRingMatch && cliUtilsRingMatch) {
    const uiRing = uiFocusRingMatch[1].trim();
    const cliRing = cliUtilsRingMatch[1].trim();
    if (uiRing !== cliRing) {
        hasError = true;
        console.error('[check-twmerge-colors] ✗ UI 与 CLI UTILS_TEMPLATE 的 FOCUS_RING_CLASSES 声明不一致:');
        console.error('  UI :', uiRing);
        console.error('  CLI:', cliRing);
    }
}

if (hasError) {
    console.error('\n✗ 四端粗野主义颜色与工具函数校验失败，请运行 `pnpm --filter brutx-ui-vue prebuild:tokens` 重新生成同步。');
    process.exitCode = 1;
} else {
    console.log(`✓ 四端粗野主义颜色与 FOCUS_RING_CLASSES 严格对齐（${sharedColorSet.size} 项颜色）`);
}
