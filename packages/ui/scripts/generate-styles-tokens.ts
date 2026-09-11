import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    TokenStyleCompiler,
    replaceBetweenMarkers,
    THEME_START,
    THEME_END,
    ROOT_START,
    ROOT_END,
    PRESETS_START,
    PRESETS_END,
    FONT_STACK_START,
    FONT_STACK_END,
    COLOR_NAMES_START,
    COLOR_NAMES_END,
    Z_INDEX_NAMES_START,
    Z_INDEX_NAMES_END,
    PATTERN_UTILS_START,
    PATTERN_UTILS_END,
} from 'brutx-shared-vue/tokens';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_PATH = path.resolve(__dirname, '..', 'src', 'styles.css');
const PREFLIGHT_PATH = path.resolve(__dirname, '..', 'src', 'preflight.css');
const UTILS_PATH = path.resolve(__dirname, '..', 'src', 'lib', 'utils.ts');

const INDENT_SPACES_ROOT = 4;
const INDENT_SPACES_PRESETS = 4;
const INDENT_SPACES_PATTERNS = 0;

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

function patchStylesCss(content: string, compiler: TokenStyleCompiler): string {
    let current = content;
    current = replaceBetweenMarkers(current, THEME_START, THEME_END, compiler.compileThemeBlock(), 'styles.css');
    current = replaceBetweenMarkers(current, ROOT_START, ROOT_END, compiler.compileRootBlock(INDENT_SPACES_ROOT), 'styles.css');
    current = replaceBetweenMarkers(current, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(INDENT_SPACES_PRESETS), 'styles.css');
    current = replaceBetweenMarkers(
        current,
        PATTERN_UTILS_START,
        PATTERN_UTILS_END,
        compiler.compilePatternUtilityBlock(INDENT_SPACES_PATTERNS),
        'styles.css',
    );
    return current;
}

function patchPreflightCss(content: string, compiler: TokenStyleCompiler): string {
    return replaceBetweenMarkers(content, FONT_STACK_START, FONT_STACK_END, compiler.compileFontStackBlock(), 'preflight.css');
}

function patchUtilsTs(content: string, compiler: TokenStyleCompiler): string {
    let current = content;
    current = replaceBetweenMarkers(
        current,
        COLOR_NAMES_START,
        COLOR_NAMES_END,
        compiler.compileColorNamesBlock(),
        'utils.ts',
    );
    current = replaceBetweenMarkers(
        current,
        Z_INDEX_NAMES_START,
        Z_INDEX_NAMES_END,
        compiler.compileZIndexNamesBlock(),
        'utils.ts',
    );
    return current;
}

async function main(): Promise<void> {
    const fs = new DiskFileSystemAdapter();
    const compiler = new TokenStyleCompiler();

    const isCheckMode = process.argv.slice(2).includes('--check');
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';

    // 1. styles.css
    const stylesOriginal = await fs.readFile(STYLES_PATH, 'utf-8');
    const stylesNext = patchStylesCss(stylesOriginal, compiler);
    const stylesChanged = stylesNext !== stylesOriginal;

    // 2. preflight.css
    const preflightOriginal = await fs.readFile(PREFLIGHT_PATH, 'utf-8');
    const preflightNext = patchPreflightCss(preflightOriginal, compiler);
    const preflightChanged = preflightNext !== preflightOriginal;

    // 3. UI lib/utils.ts
    const utilsOriginal = await fs.readFile(UTILS_PATH, 'utf-8');
    const utilsNext = patchUtilsTs(utilsOriginal, compiler);
    const utilsChanged = utilsNext !== utilsOriginal;

    const hasAnyChange = stylesChanged || preflightChanged || utilsChanged;

    if (!hasAnyChange) {
        if (isVerbose || isCheckMode) {
            console.log('✓ styles.css、preflight.css 与 utils.ts 令牌块已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ 生成内容与磁盘不一致，需运行 `pnpm --filter brutx-ui-vue prebuild:tokens` 重新生成。');
        if (stylesChanged) {
            printBlockDiff(stylesOriginal, THEME_START, THEME_END, compiler.compileThemeBlock(), 'styles.css @theme 令牌块');
            printBlockDiff(stylesOriginal, ROOT_START, ROOT_END, compiler.compileRootBlock(INDENT_SPACES_ROOT), 'styles.css :root/.dark 区块');
            printBlockDiff(stylesOriginal, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(INDENT_SPACES_PRESETS), 'styles.css 主题预设区块');
            printBlockDiff(stylesOriginal, PATTERN_UTILS_START, PATTERN_UTILS_END, compiler.compilePatternUtilityBlock(INDENT_SPACES_PATTERNS), 'styles.css 纹理工具类区块');
        }
        if (preflightChanged) {
            printBlockDiff(preflightOriginal, FONT_STACK_START, FONT_STACK_END, compiler.compileFontStackBlock(), 'preflight.css 字体栈');
        }
        if (utilsChanged) {
            printBlockDiff(utilsOriginal, COLOR_NAMES_START, COLOR_NAMES_END, compiler.compileColorNamesBlock(), 'utils.ts 颜色名称块');
            printBlockDiff(utilsOriginal, Z_INDEX_NAMES_START, Z_INDEX_NAMES_END, compiler.compileZIndexNamesBlock(), 'utils.ts z-index 名称块');
        }
        process.exit(1);
    }

    if (stylesChanged) {
        await fs.writeFile(STYLES_PATH, stylesNext, 'utf-8');
    }
    if (preflightChanged) {
        await fs.writeFile(PREFLIGHT_PATH, preflightNext, 'utf-8');
    }
    if (utilsChanged) {
        await fs.writeFile(UTILS_PATH, utilsNext, 'utf-8');
    }
    console.log('✓ styles.css、preflight.css 与 utils.ts 令牌块已从 shared 单一信源重新生成');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
