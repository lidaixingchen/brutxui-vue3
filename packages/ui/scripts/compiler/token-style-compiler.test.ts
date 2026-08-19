import { describe, it, expect } from 'vitest';
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

        it('patchStylesCss 能够同时打好三个 Marker 区间的补丁', () => {
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
`;
            const { content, changed } = compiler.patchStylesCss(raw);
            expect(changed).toBe(true);
            expect(content).toContain('--color-brutal-primary:');
            expect(content).toContain(':root {');
            expect(content).toContain('.theme-pastel {');
        });
    });
});
