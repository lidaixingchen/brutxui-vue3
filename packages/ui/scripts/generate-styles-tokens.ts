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
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const INDENT_SPACES_ROOT = 4;
const INDENT_SPACES_PRESETS = 4;
const INDENT_SPACES_PATTERNS = 0;

export function patchStylesCss(content: string, compiler: TokenStyleCompiler): string {
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

export function patchPreflightCss(content: string, compiler: TokenStyleCompiler): string {
    return replaceBetweenMarkers(content, FONT_STACK_START, FONT_STACK_END, compiler.compileFontStackBlock(), 'preflight.css');
}

export function patchUtilsTs(content: string, compiler: TokenStyleCompiler): string {
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

export function collectTokenOutputs(packageRoot: string = PACKAGE_ROOT): GeneratedOutput[] {
    const compiler = new TokenStyleCompiler();
    const stylesPath = path.resolve(packageRoot, 'src', 'styles.css');
    const preflightPath = path.resolve(packageRoot, 'src', 'preflight.css');
    const utilsPath = path.resolve(packageRoot, 'src', 'lib', 'utils.ts');

    const stylesOriginal = fs.readFileSync(stylesPath, 'utf-8');
    const preflightOriginal = fs.readFileSync(preflightPath, 'utf-8');
    const utilsOriginal = fs.readFileSync(utilsPath, 'utf-8');

    return [
        {
            relativePath: 'src/styles.css',
            content: patchStylesCss(stylesOriginal, compiler),
        },
        {
            relativePath: 'src/preflight.css',
            content: patchPreflightCss(preflightOriginal, compiler),
        },
        {
            relativePath: 'src/lib/utils.ts',
            content: patchUtilsTs(utilsOriginal, compiler),
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
            console.log('✓ styles.css、preflight.css 与 utils.ts 令牌块已是最新');
        }
        return;
    }

    if (isCheckMode) {
        console.error('✗ 生成内容与磁盘不一致，需运行 `pnpm --filter brutx-ui-vue prebuild:tokens` 重新生成。');
        for (const difference of differences) console.error(`  - ${difference.relativePath} (${difference.kind})`);
        throw new Error('UI tokens 生成检查失败');
    }

    writeGeneratedOutputs(PACKAGE_ROOT, outputs);
    console.log('✓ styles.css、preflight.css 与 utils.ts 令牌块已从 shared 单一信源重新生成');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const runPromise = process.argv.includes('--check')
        ? Promise.resolve().then(runStandalone)
        : withGenerateLock(
            { packageName: 'brutx-ui-vue', cacheDir: path.resolve(PACKAGE_ROOT, 'node_modules', '.cache') },
            runStandalone,
        )
    runPromise.catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
