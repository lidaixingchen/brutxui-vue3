import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DiskFileSystemAdapter } from 'brutx-shared-vue/fs';
import {
    TokenStyleCompiler,
    THEME_START,
    THEME_END,
    ROOT_START,
    ROOT_END,
    PRESETS_START,
    PRESETS_END,
    FONT_STACK_START,
    FONT_STACK_END,
} from './compiler/token-style-compiler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_PATH = path.resolve(__dirname, '..', 'src', 'styles.css');
const PREFLIGHT_PATH = path.resolve(__dirname, '..', 'src', 'preflight.css');
const CLI_BRUTALIST_PATH = path.resolve(__dirname, '..', '..', 'cli', 'src', 'styles', 'brutalist.css');

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

async function main(): Promise<void> {
    const fs = new DiskFileSystemAdapter();
    const compiler = new TokenStyleCompiler();

    const isCheckMode = process.argv.slice(2).includes('--check');
    const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v') || process.env.BRUTX_VERBOSE === '1';

    // 1. styles.css
    const stylesOriginal = await fs.readFile(STYLES_PATH, 'utf-8');
    const { content: stylesNext, changed: stylesChanged } = compiler.patchStylesCss(stylesOriginal);

    // 2. preflight.css
    const preflightOriginal = await fs.readFile(PREFLIGHT_PATH, 'utf-8');
    const { content: preflightNext, changed: preflightChanged } = compiler.patchPreflightCss(preflightOriginal);

    // 3. CLI brutalist.css
    let cliChanged = false;
    let cliOriginal = '';
    let cliNext = '';
    if (await fs.pathExists(CLI_BRUTALIST_PATH)) {
        cliOriginal = await fs.readFile(CLI_BRUTALIST_PATH, 'utf-8');
        const res = compiler.patchCliBrutalistCss(cliOriginal);
        cliNext = res.content;
        cliChanged = res.changed;
    } else if (isCheckMode) {
        console.error(`✗ CLI brutalist.css 不存在：${CLI_BRUTALIST_PATH}`);
        process.exit(1);
    }

    const hasAnyChange = stylesChanged || preflightChanged || cliChanged;

    if (!hasAnyChange) {
        if (isVerbose || isCheckMode) {
            console.log('✓ styles.css、preflight.css 与 CLI brutalist.css 令牌块已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ 生成内容与磁盘不一致，需运行 `pnpm prebuild:tokens` 重新生成。');
        if (stylesChanged) {
            printBlockDiff(stylesOriginal, THEME_START, THEME_END, compiler.compileThemeBlock(), 'styles.css @theme 令牌块');
            printBlockDiff(stylesOriginal, ROOT_START, ROOT_END, compiler.compileRootBlock(4), 'styles.css :root/.dark 区块');
            printBlockDiff(stylesOriginal, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(4), 'styles.css 主题预设区块');
        }
        if (preflightChanged) {
            printBlockDiff(preflightOriginal, FONT_STACK_START, FONT_STACK_END, compiler.compileFontStackBlock(), 'preflight.css 字体栈');
        }
        if (cliChanged) {
            printBlockDiff(cliOriginal, THEME_START, THEME_END, compiler.compileThemeBlock(), 'CLI brutalist.css @theme 令牌块');
            printBlockDiff(cliOriginal, ROOT_START, ROOT_END, compiler.compileRootBlock(0), 'CLI brutalist.css :root/.dark 区块');
            printBlockDiff(cliOriginal, PRESETS_START, PRESETS_END, compiler.compileThemePresetsBlock(0), 'CLI brutalist.css 主题预设区块');
        }
        process.exit(1);
    }

    if (stylesChanged) {
        await fs.writeFile(STYLES_PATH, stylesNext, 'utf-8');
    }
    if (preflightChanged) {
        await fs.writeFile(PREFLIGHT_PATH, preflightNext, 'utf-8');
    }
    if (cliChanged) {
        await fs.writeFile(CLI_BRUTALIST_PATH, cliNext, 'utf-8');
    }
    console.log('✓ styles.css、preflight.css 与 CLI brutalist.css 令牌块已从 design-tokens.ts 重新生成');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
