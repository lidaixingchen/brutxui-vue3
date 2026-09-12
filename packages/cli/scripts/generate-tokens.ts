import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import {
    TokenStyleCompiler,
    PATTERN_UTILITIES,
    replaceBetweenMarkers,
    THEME_START,
    THEME_END,
    ROOT_START,
    ROOT_END,
    PRESETS_START,
    PRESETS_END,
    CLI_UTIL_RULES_START,
    CLI_UTIL_RULES_END,
    CLI_UTILS_START,
    CLI_UTILS_END,
} from 'brutx-shared-vue/tokens';
import {
    BRUTAL_COLOR_NAMES,
    BRUTAL_Z_INDEX_NAMES,
} from 'brutx-shared-vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BRUTALIST_CSS_PATH = path.resolve(__dirname, '..', 'src', 'styles', 'brutalist.css');
const CONSTANTS_PATH = path.resolve(__dirname, '..', 'src', 'lib', 'constants.ts');

const INDENT_SPACES_ROOT = 0;
const INDENT_SPACES_PRESETS = 0;

function printBlockDiff(
    content: string,
    startMarker: string,
    endMarker: string,
    generated: string,
    label: string,
): void {
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx === -1 || endIdx === -1) return;
    const oldBlock = content.slice(startIdx + startMarker.length, endIdx);
    console.error(`--- 现有（磁盘）${label}`);
    console.error(oldBlock);
    console.error(`+++ 期望（生成）${label}`);
    console.error(`\n${generated}`);
}

export function compileCliUtilsTemplate(): string {
    const colorLines = BRUTAL_COLOR_NAMES.map(name => `    '${name}',`).join('\n');
    const zIndexLines = BRUTAL_Z_INDEX_NAMES.map(name => `    '${name}',`).join('\n');
    const patternClasses = PATTERN_UTILITIES.filter(pattern => pattern.name.startsWith('bg-pattern-'))
        .map(pattern => `'${pattern.name}'`).join(', ');
    const utilsTemplateStr = [
        'import { type ClassValue, clsx } from "clsx";',
        'import { extendTailwindMerge } from "tailwind-merge";',
        '',
        'const BRUTAL_COLOR_NAMES = [',
        colorLines,
        '] as const;',
        '',
        'const BRUTAL_Z_INDEX_NAMES = [',
        zIndexLines,
        '] as const;',
        '',
        'const customTwMerge = extendTailwindMerge({',
        '    extend: {',
        '        theme: {',
        '            color: [...BRUTAL_COLOR_NAMES],',
        '        },',
        '        classGroups: {',
        '            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],',
        `            'bg-image': [${patternClasses}],`,
        '        },',
        '    },',
        '});',
        '',
        'export const FOCUS_RING_CLASSES =',
        '    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";',
        '',
        'export function cn(...inputs: ClassValue[]) {',
        '    return customTwMerge(clsx(inputs));',
        '}',
        '',
    ].join('\n');

    const bodyTemplateStr = [
        'const BRUTAL_COLOR_NAMES = [',
        colorLines,
        '] as const;',
        '',
        'const BRUTAL_Z_INDEX_NAMES = [',
        zIndexLines,
        '] as const;',
        '',
        'const customTwMerge = extendTailwindMerge({',
        '    extend: {',
        '        theme: {',
        '            color: [...BRUTAL_COLOR_NAMES],',
        '        },',
        '        classGroups: {',
        '            z: [{ z: [...BRUTAL_Z_INDEX_NAMES] }],',
        `            'bg-image': [${patternClasses}],`,
        '        },',
        '    },',
        '});',
        '',
        'export const FOCUS_RING_CLASSES =',
        '    "focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:ring-offset-brutal-bg focus-visible:outline-hidden";',
        '',
        'export function cn(...inputs: ClassValue[]) {',
        '    return customTwMerge(clsx(inputs));',
        '}',
        '',
    ].join('\n');

    return [
        `export const UTILS_TEMPLATE = \`${utilsTemplateStr}\`;`,
        '',
        '// 与 UTILS_TEMPLATE 逐字节一致，复用其定义保持单一数据源（须置于 UTILS_TEMPLATE 之后避免 TDZ）。',
        '// doctor 的 AddCnFunction 用它追加到全新的 utils 文件（自带 import，保证自包含）。',
        'export const CN_FUNCTION_TEMPLATE = UTILS_TEMPLATE;',
        '',
        '// 仅函数体（无 import）：doctor 追加到已导入 clsx/tailwind-merge 的文件时使用，',
        '// 避免同名 import 重复绑定导致 SyntaxError',
        `export const CN_FUNCTION_BODY_TEMPLATE = \`${bodyTemplateStr}\`;`,
    ].join('\n');
}

export function patchBrutalistCss(content: string, compiler: TokenStyleCompiler): string {
    let current = content;
    current = replaceBetweenMarkers(current, THEME_START, THEME_END, compiler.compileThemeBlock(), 'brutalist.css');
    current = replaceBetweenMarkers(current, ROOT_START, ROOT_END, compiler.compileRootBlock(INDENT_SPACES_ROOT), 'brutalist.css');
    current = replaceBetweenMarkers(current, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(INDENT_SPACES_PRESETS), 'brutalist.css');
    current = replaceBetweenMarkers(
        current,
        CLI_UTIL_RULES_START,
        CLI_UTIL_RULES_END,
        compiler.compileCliUtilityRules(),
        'brutalist.css',
    );
    return current;
}

export function patchConstantsTs(content: string): string {
    return replaceBetweenMarkers(
        content,
        CLI_UTILS_START,
        CLI_UTILS_END,
        compileCliUtilsTemplate(),
        'constants.ts',
    );
}

async function main(): Promise<void> {
    const compiler = new TokenStyleCompiler();

    const isCheckMode = process.argv.slice(2).includes('--check');
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';

    const brutalistOriginal = await fs.readFile(BRUTALIST_CSS_PATH, 'utf-8');
    const brutalistNext = patchBrutalistCss(brutalistOriginal, compiler);
    const brutalistChanged = brutalistNext !== brutalistOriginal;

    const constantsOriginal = await fs.readFile(CONSTANTS_PATH, 'utf-8');
    const constantsNext = patchConstantsTs(constantsOriginal);
    const constantsChanged = constantsNext !== constantsOriginal;

    const hasAnyChange = brutalistChanged || constantsChanged;

    if (!hasAnyChange) {
        if (isVerbose || isCheckMode) {
            console.log('✓ CLI brutalist.css 与 constants.ts 令牌与模板块已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ CLI 生成内容与磁盘不一致，需运行 `pnpm --filter brutx-vue prebuild:tokens` 重新生成。');
        if (brutalistChanged) {
            printBlockDiff(brutalistOriginal, THEME_START, THEME_END, compiler.compileThemeBlock(), 'CLI brutalist.css @theme 令牌块');
            printBlockDiff(brutalistOriginal, ROOT_START, ROOT_END, compiler.compileRootBlock(INDENT_SPACES_ROOT), 'CLI brutalist.css :root/.dark 区块');
            printBlockDiff(brutalistOriginal, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(INDENT_SPACES_PRESETS), 'CLI brutalist.css 主题预设区块');
            printBlockDiff(brutalistOriginal, CLI_UTIL_RULES_START, CLI_UTIL_RULES_END, compiler.compileCliUtilityRules(), 'CLI brutalist.css 工具类直挂区块');
        }
        if (constantsChanged) {
            printBlockDiff(constantsOriginal, CLI_UTILS_START, CLI_UTILS_END, compileCliUtilsTemplate(), 'CLI constants.ts utils 模板块');
        }
        process.exit(1);
    }

    if (brutalistChanged) {
        await fs.writeFile(BRUTALIST_CSS_PATH, brutalistNext, 'utf-8');
    }
    if (constantsChanged) {
        await fs.writeFile(CONSTANTS_PATH, constantsNext, 'utf-8');
    }
    console.log('✓ CLI brutalist.css 与 constants.ts 已从 shared 单一信源重新生成');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
