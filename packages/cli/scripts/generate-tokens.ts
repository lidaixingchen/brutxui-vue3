import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
    compareGeneratedOutputs,
    type GeneratedOutput,
    withGenerateLock,
    writeGeneratedOutputs,
} from 'brutx-shared-vue/generation';
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
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const INDENT_SPACES_ROOT = 0;
const INDENT_SPACES_PRESETS = 0;

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

export function collectTokenOutputs(packageRoot: string = PACKAGE_ROOT): GeneratedOutput[] {
    const compiler = new TokenStyleCompiler();
    const brutalistPath = path.resolve(packageRoot, 'src', 'styles', 'brutalist.css');
    const constantsPath = path.resolve(packageRoot, 'src', 'lib', 'constants.ts');
    const brutalistOriginal = fs.readFileSync(brutalistPath, 'utf-8');
    const brutalistNext = patchBrutalistCss(brutalistOriginal, compiler);
    const constantsOriginal = fs.readFileSync(constantsPath, 'utf-8');
    const constantsNext = patchConstantsTs(constantsOriginal);
    return [
        {
            relativePath: 'src/styles/brutalist.css',
            content: brutalistNext,
        },
        {
            relativePath: 'src/lib/constants.ts',
            content: constantsNext,
        },
    ];
}

function runStandalone(): void {
    const isCheckMode = process.argv.slice(2).includes('--check');
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';
    const outputs = collectTokenOutputs();
    const differences = compareGeneratedOutputs(PACKAGE_ROOT, outputs);

    if (differences.length === 0) {
        if (isVerbose || isCheckMode) {
            console.log('✓ CLI brutalist.css 与 constants.ts 令牌与模板块已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ CLI 生成内容与磁盘不一致，需运行 `pnpm --filter brutx-vue prebuild:tokens` 重新生成。');
        for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`);
        throw new Error('CLI tokens 生成检查失败');
    }

    writeGeneratedOutputs(PACKAGE_ROOT, outputs);
    console.log('✓ CLI brutalist.css 与 constants.ts 已从 shared 单一信源重新生成');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const runPromise = process.argv.includes('--check')
        ? Promise.resolve().then(runStandalone)
        : withGenerateLock(
            { packageName: 'brutx-vue', cacheDir: path.resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            runStandalone,
        )
    runPromise.catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
