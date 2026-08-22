import { describe, it, expect } from 'vitest';
import {
    TokenStyleCompiler,
    THEME_START,
    THEME_END,
    ROOT_START,
    ROOT_END,
    PRESETS_START,
    PRESETS_END,
    PATTERN_UTILS_START,
    PATTERN_UTILS_END,
    FONT_STACK_START,
    FONT_STACK_END,
} from './token-style-compiler.js';

describe('TokenStyleCompiler (Pure Calculation)', () => {
    const compiler = new TokenStyleCompiler();

    describe('纯编译产物生成', () => {
        it('能够生成包含 @theme 变量的 themeBlock', () => {
            const block = compiler.compileThemeBlock();
            expect(block).toContain('--color-brutal-primary:');
            expect(block).toContain('--color-brutal-bg:');
            expect(block).toContain('--default-font-family:');
            expect(block).toContain('--ease-brutal-');
        });

        it('能够生成 :root 和 .dark 运行时变量块', () => {
            const block = compiler.compileRootBlock(4);
            expect(block).toContain(':root {');
            expect(block).toContain('.dark {');
            expect(block).toContain('--brutal-primary:');
            expect(block).toContain('--brutal-bg:');
            expect(block).toContain('--shadow-brutal:');
        });

        it('能够生成主题预设规则块', () => {
            const block = compiler.compileThemePresetsBlock(4);
            expect(block).toContain('.theme-pastel {');
            expect(block).toContain('.theme-mono {');
            expect(block).toContain('.theme-warm {');
        });

        it('能够生成 preflight 字体栈', () => {
            const block = compiler.compileFontStackBlock();
            expect(block).toContain('font-family: var(');
            expect(block).toContain('--default-font-family');
        });
    });

    describe('CSS Marker 区间精准注入与 Patch', () => {
        it('能够将编译块安全注入 Marker 区间', () => {
            const rawCss = `
/* before */
${THEME_START}
old content
${THEME_END}
/* after */
`;
            const patched = compiler.patchBetweenMarkers(rawCss, THEME_START, THEME_END, '    --new-token: #123456;');
            expect(patched).toContain('--new-token: #123456;');
            expect(patched).not.toContain('old content');
            expect(patched).toContain('/* before */');
            expect(patched).toContain('/* after */');
        });

        it('Marker 不存在时应抛出清晰错误', () => {
            expect(() => {
                compiler.patchBetweenMarkers('body {}', THEME_START, THEME_END, 'content');
            }).toThrow('无法找到注入标记');
        });

        it('patchStylesCss 能够同时打好全部 Marker 区间的补丁', () => {
            const raw = `
@theme {
    ${THEME_START}
    ${THEME_END}
}
@layer base {
    ${ROOT_START}
    ${ROOT_END}
    ${PRESETS_START}
    ${PRESETS_END}
}
${PATTERN_UTILS_START}
${PATTERN_UTILS_END}
`;
            const { content, changed } = compiler.patchStylesCss(raw);
            expect(changed).toBe(true);
            expect(content).toContain('--color-brutal-primary:');
            expect(content).toContain(':root {');
            expect(content).toContain('.theme-pastel {');
            // 第四区间：纹理工具类（@utility 声明）由 PATTERN_UTILITIES 单一数据源生成
            expect(content).toContain('@utility bg-pattern-dots');
        });

        it('能够生成 colorNames 与 zIndexNames 块并成功 patch utils.ts', () => {
            const block = compiler.compileColorNamesBlock();
            expect(block).toContain('const BRUTAL_COLOR_NAMES = [');
            expect(block).toContain("'brutal-primary',");
            expect(block).toContain("'brutal-primary-subtle',");

            const zIndexBlock = compiler.compileZIndexNamesBlock();
            expect(zIndexBlock).toContain('const BRUTAL_Z_INDEX_NAMES = [');
            expect(zIndexBlock).toContain("'dialog',");
            expect(zIndexBlock).toContain("'popover',");

            const rawUtils = `
import { clsx } from 'clsx';
/* @brutx:color-names:start */
const old = [];
/* @brutx:color-names:end */

/* @brutx:z-index-names:start */
const oldZ = [];
/* @brutx:z-index-names:end */
export function cn() {}
`;
            const { content, changed } = compiler.patchUtilsTs(rawUtils);
            expect(changed).toBe(true);
            expect(content).toContain('const BRUTAL_COLOR_NAMES = [');
            expect(content).toContain("'brutal-accent',");
            expect(content).toContain('const BRUTAL_Z_INDEX_NAMES = [');
            expect(content).toContain("'dialog',");
            expect(content).not.toContain('const old = [];');
            expect(content).not.toContain('const oldZ = [];');
        });

        it('能够生成 CLI utils 模板并成功 patch constants.ts', () => {
            const cliTemplate = compiler.compileCliUtilsTemplate();
            expect(cliTemplate).toContain('export const UTILS_TEMPLATE = `');
            expect(cliTemplate).toContain('extendTailwindMerge');
            expect(cliTemplate).toContain('FOCUS_RING_CLASSES');
            expect(cliTemplate).toContain('export const CN_FUNCTION_TEMPLATE = UTILS_TEMPLATE;');
            expect(cliTemplate).toContain('export const CN_FUNCTION_BODY_TEMPLATE = `');

            const rawConstants = `
export const CONFIG_FILES = {};
/* @brutx:cli-utils-template:start */
export const UTILS_TEMPLATE = 'old';
/* @brutx:cli-utils-template:end */
`;
            const { content, changed } = compiler.patchCliConstants(rawConstants);
            expect(changed).toBe(true);
            expect(content).toContain('export const UTILS_TEMPLATE = `');
            expect(content).toContain('FOCUS_RING_CLASSES');
            expect(content).not.toContain("export const UTILS_TEMPLATE = 'old';");
        });
    });
});

