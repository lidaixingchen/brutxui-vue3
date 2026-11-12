import { describe, it, expect, vi } from 'vitest';
import {
    TokenStyleCompiler,
    replaceBetweenMarkers,
    ROOT_START,
    ROOT_END,
    THEME_START,
    THEME_END,
    replaceThemeBlock,
    PATTERN_UTILITIES,
} from '../../src/tokens/index.js';
import { BASE_THEME, BRUTAL_COLOR_NAMES, SHADOW_DEFINITIONS, THEME_PRESETS } from '../../src/design-tokens.js';

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
        expect(result).toContain(`--brutal-item-highlight: ${BASE_THEME.light.itemHighlight};`);
        expect(result).toContain(`--brutal-item-highlight-foreground: ${BASE_THEME.light.itemHighlightForeground};`);
        expect(result).toContain(`--brutal-item-highlight: ${BASE_THEME.dark.itemHighlight};`);
        expect(result).toContain(`--brutal-item-highlight-foreground: ${BASE_THEME.dark.itemHighlightForeground};`);
        expect(result).toContain('--shadow-brutal:');
        expect(result).toContain('--z-index-dialog:');
    });

    it('compileThemeBlock 生成符合 Tailwind v4 规范的 @theme 声明', () => {
        const result = compiler.compileThemeBlock();
        const standardThemeStart = result.indexOf('\n\n@theme {');
        const inlineTheme = result.slice(0, standardThemeStart);
        const standardTheme = result.slice(standardThemeStart + 2);

        expect(result.match(/@theme(?: inline)? \{/g)).toHaveLength(2);
        expect(inlineTheme).toContain('@theme inline {');
        expect(inlineTheme).toContain('--color-brutal-primary: var(--brutal-primary, #FF6B6B);');
        expect(inlineTheme).toContain(`--color-brutal-item-highlight: var(--brutal-item-highlight, ${BASE_THEME.light.itemHighlight});`);
        expect(inlineTheme).toContain(`--color-brutal-item-highlight-foreground: var(--brutal-item-highlight-foreground, ${BASE_THEME.light.itemHighlightForeground});`);
        expect(inlineTheme).toContain('--color-brutal-primary-subtle: var(--brutal-primary-subtle,');
        expect(inlineTheme).toContain(`--border-width-3: var(--brutal-border-width, ${BASE_THEME.light.borderWidth});`);
        expect(inlineTheme).toContain(`--radius-brutal: var(--brutal-radius, ${BASE_THEME.light.radius});`);
        expect(inlineTheme).not.toContain('--shadow-brutal:');
        expect(standardTheme).toContain('@theme {');
        expect(standardTheme).toContain('--default-font-family:');
        expect(standardTheme).toContain('--shadow-brutal:');
        expect(standardTheme).toContain('--ease-brutal-snap:');
        expect(standardTheme).not.toContain('--border-width-3:');
        expect(standardTheme).not.toContain('--radius-brutal:');
        expect(standardTheme).not.toContain('--color-brutal-');
    });

    it('compileThemePresetsBlock 生成主题预设区块', () => {
        const result = compiler.compileThemePresetsBlock(4);
        expect(result).toContain('.theme-pastel {');
        expect(result).toContain('.dark .theme-pastel, .theme-pastel.dark {');
        expect(result).toContain('.theme-mono {');
        expect(result).toContain('.theme-warm {');
        for (const preset of Object.values(THEME_PRESETS)) {
            expect(result).toContain(`--brutal-item-highlight: ${preset.light.itemHighlight};`);
            expect(result).toContain(`--brutal-item-highlight-foreground: ${preset.light.itemHighlightForeground};`);
            expect(result).toContain(`--brutal-item-highlight: ${preset.dark.itemHighlight};`);
            expect(result).toContain(`--brutal-item-highlight-foreground: ${preset.dark.itemHighlightForeground};`);
        }
        expect(result.match(/--brutal-primary-subtle: color-mix/g) ?? []).toHaveLength(Object.values(THEME_PRESETS).length * 2);
    });

    it('预设派生色读取运行时变量并保留基础主题 fallback', () => {
        const result = compiler.compileThemePresetsBlock();
        const warmLight = result.slice(result.indexOf('.theme-warm {'), result.indexOf('.dark .theme-warm'));
        const warmDark = result.slice(result.indexOf('.dark .theme-warm'));
        expect(warmLight).toContain(`--brutal-primary: ${THEME_PRESETS.warm.light.primary};`);
        expect(warmLight).toContain(`var(--brutal-primary, ${BASE_THEME.light.primary})`);
        expect(warmLight).toContain(`var(--brutal-bg, ${BASE_THEME.light.bg})`);
        expect(warmDark).toContain(`--brutal-primary: ${THEME_PRESETS.warm.dark.primary};`);
        expect(warmDark).toContain(`var(--brutal-primary, ${BASE_THEME.dark.primary})`);
        expect(warmDark).toContain(`var(--brutal-bg, ${BASE_THEME.dark.bg})`);
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
        expect(result).toContain(String.raw`.hover\:shadow-brutal:hover {`);
        expect(result).toContain(String.raw`.focus\:shadow-brutal-lg:focus {`);
        expect(result).toContain(String.raw`.data-\[state\=active\]\:shadow-brutal-sm[data-state="active"] {`);
        for (const def of SHADOW_DEFINITIONS) {
            expect(result).toContain(`box-shadow: ${def.build(BASE_THEME.light)};`);
        }
        expect(result).not.toContain('box-shadow: var(--shadow-brutal');
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

describe('replaceThemeBlock', () => {
    it('moves legacy theme markers around complete inline and standard theme blocks idempotently', () => {
        const compiler = new TokenStyleCompiler();
        const initial = `@theme {\n    ${THEME_START}\n    old generated declarations\n    ${THEME_END}\n}\nbody { color: var(--brutal-fg); }`;
        const replacement = compiler.compileThemeBlock();
        const patched = replaceThemeBlock(initial, THEME_START, THEME_END, replacement, 'styles.css');

        expect(patched).toBe(`${THEME_START}\n${replacement}\n${THEME_END}\nbody { color: var(--brutal-fg); }`);
        expect(patched).toContain('@theme inline {');
        expect(patched).toContain('\n@theme {');
        expect(patched).not.toContain('@theme {\n    @theme inline {');
        expect(replaceThemeBlock(patched, THEME_START, THEME_END, replacement, 'styles.css')).toBe(patched);
    });
});
