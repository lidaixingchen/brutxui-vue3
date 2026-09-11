import { describe, it, expect, vi } from 'vitest';
import {
    TokenStyleCompiler,
    replaceBetweenMarkers,
    ROOT_START,
    ROOT_END,
    THEME_START,
    THEME_END,
    PATTERN_UTILITIES,
} from '../../src/tokens/index.js';
import { BASE_THEME, BRUTAL_COLOR_NAMES } from '../../src/design-tokens.js';

describe('TokenStyleCompiler', () => {
    const compiler = new TokenStyleCompiler();

    it('formatVarsBlock 正确格式化选择器与变量缩进', () => {
        const block = compiler.formatVarsBlock('.test', { 'test-var': '10px' }, 2);
        expect(block).toBe('  .test {\n      --test-var: 10px;\n  }');
    });

    it('compileRootBlock 生成符合规范的 :root 与 .dark 变量块', () => {
        const result = compiler.compileRootBlock(4);
        expect(result).toContain(':root {');
        expect(result).toContain('.dark {');
        expect(result).toContain(`--brutal-primary: ${BASE_THEME.light.primary};`);
        expect(result).toContain(`--brutal-primary: ${BASE_THEME.dark.primary};`);
        expect(result).toContain('--shadow-brutal:');
        expect(result).toContain('--z-index-dialog:');
    });

    it('compileThemeBlock 生成符合 Tailwind v4 规范的 @theme 声明', () => {
        const result = compiler.compileThemeBlock();
        expect(result).toContain('--color-brutal-primary: var(--brutal-primary, #FF6B6B);');
        expect(result).toContain('--default-font-family:');
        expect(result).toContain('--shadow-brutal:');
        expect(result).toContain('--ease-brutal-snap:');
    });

    it('compileThemePresetsBlock 生成主题预设区块', () => {
        const result = compiler.compileThemePresetsBlock(4);
        expect(result).toContain('.theme-pastel {');
        expect(result).toContain('.dark .theme-pastel, .theme-pastel.dark {');
        expect(result).toContain('.theme-mono {');
        expect(result).toContain('.theme-warm {');
    });

    it('compileFontStackBlock 生成规范字体栈声明', () => {
        const result = compiler.compileFontStackBlock();
        expect(result).toContain('--default-font-family');
        expect(result).toContain('font-family: var(');
    });

    it('compilePatternUtilityBlock 完整输出全部纹理模式声明', () => {
        const result = compiler.compilePatternUtilityBlock(0);
        for (const pattern of PATTERN_UTILITIES) {
            expect(result).toContain(`@utility ${pattern.name} {`);
        }
        expect(result).toContain('&::-webkit-scrollbar');
        expect(result).toContain('&::before');
    });

    it('compileCliUtilityRules 展开工具类为扁平直挂规则', () => {
        const result = compiler.compileCliUtilityRules();
        expect(result).toContain('.shadow-brutal {');
        expect(result).toContain('.bg-pattern-dots {');
        expect(result).toContain('.scrollbar-brutal::-webkit-scrollbar {');
        expect(result).toContain('.hud-crosshairs::before {');
    });

    it('compileColorNamesBlock 与 compileZIndexNamesBlock 导出合法数组', () => {
        const colorBlock = compiler.compileColorNamesBlock();
        expect(colorBlock).toContain('const BRUTAL_COLOR_NAMES = [');
        for (const name of BRUTAL_COLOR_NAMES) {
            expect(colorBlock).toContain(`'${name}'`);
        }

        const zIndexBlock = compiler.compileZIndexNamesBlock();
        expect(zIndexBlock).toContain('const BRUTAL_Z_INDEX_NAMES = [');
        expect(zIndexBlock).toContain("'dialog'");
    });

    it('collectPresetVars 正确处理 undefined 与未映射的非法 token', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const vars = compiler.collectPresetVars(
            {
                primary: '#123456',
                bg: undefined,
                // @ts-expect-error 故意传入非法 token key 测试防御性警告
                unknownToken: '#abcdef',
            },
            'test-preset',
        );

        expect(vars['brutal-primary']).toBe('#123456');
        expect(vars['brutal-bg']).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('缺少 CSS 变量映射'),
        );
        warnSpy.mockRestore();
    });
});

describe('replaceBetweenMarkers', () => {
    it('正确在标记区间注入替换内容', () => {
        const initial = `header\n${THEME_START}\nold content\n${THEME_END}\nfooter`;
        const replacement = 'new generated content';
        const patched = replaceBetweenMarkers(initial, THEME_START, THEME_END, replacement);

        expect(patched).toBe(`header\n${THEME_START}\nnew generated content\n${THEME_END}\nfooter`);
    });

    it('保留缩进格式', () => {
        const initial = `{\n    ${ROOT_START}\n    old\n    ${ROOT_END}\n}`;
        const replacement = '    --color: red;';
        const patched = replaceBetweenMarkers(initial, ROOT_START, ROOT_END, replacement);

        expect(patched).toBe(`{\n    ${ROOT_START}\n    --color: red;\n    ${ROOT_END}\n}`);
    });

    it('当缺少标记或标记顺序颠倒时抛出明确错误', () => {
        const invalidMissingEnd = `header\n${THEME_START}\nno end marker`;
        expect(() => {
            replaceBetweenMarkers(invalidMissingEnd, THEME_START, THEME_END, 'replacement', 'test.css');
        }).toThrow('在 test.css 中');

        const invalidMissingStart = `header\nno start marker\n${THEME_END}`;
        expect(() => {
            replaceBetweenMarkers(invalidMissingStart, THEME_START, THEME_END, 'replacement');
        }).toThrow('无法找到注入标记');

        const invalidInverted = `header\n${THEME_END}\ninverted\n${THEME_START}`;
        expect(() => {
            replaceBetweenMarkers(invalidInverted, THEME_START, THEME_END, 'replacement');
        }).toThrow('无法找到注入标记');
    });
});
