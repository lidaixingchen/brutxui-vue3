import { describe, expect, it } from 'vitest';
import {
    BASE_THEME,
    BRUTAL_COLOR_NAMES,
    NON_COLOR_TOKEN_KEYS,
    SHADOW_DEFINITIONS,
    SUBTLE_COLOR_DEFS,
    TOKEN_TO_CSS_VAR,
    type ThemeTokens,
} from '../src/design-tokens.js';

describe('design-tokens: BRUTAL_COLOR_NAMES 纯函数派生', () => {
    it('NON_COLOR_TOKEN_KEYS 包含所有预期的非颜色令牌', () => {
        expect(NON_COLOR_TOKEN_KEYS).toBeInstanceOf(Set);
        expect(NON_COLOR_TOKEN_KEYS.size).toBe(6);
        expect(NON_COLOR_TOKEN_KEYS.has('borderWidth')).toBe(true);
        expect(NON_COLOR_TOKEN_KEYS.has('borderColor')).toBe(true);
        expect(NON_COLOR_TOKEN_KEYS.has('shadowOffsetX')).toBe(true);
        expect(NON_COLOR_TOKEN_KEYS.has('shadowOffsetY')).toBe(true);
        expect(NON_COLOR_TOKEN_KEYS.has('shadowColor')).toBe(true);
        expect(NON_COLOR_TOKEN_KEYS.has('radius')).toBe(true);
    });

    it('BRUTAL_COLOR_NAMES 派生出 36 个颜色且为冻结已排序数组', () => {
        expect(Array.isArray(BRUTAL_COLOR_NAMES)).toBe(true);
        expect(Object.isFrozen(BRUTAL_COLOR_NAMES)).toBe(true);

        const baseKeys = (Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>).filter(
            k => !NON_COLOR_TOKEN_KEYS.has(k),
        );
        expect(baseKeys.length).toBe(30);
        expect(SUBTLE_COLOR_DEFS.length).toBe(6);
        expect(BRUTAL_COLOR_NAMES.length).toBe(36);

        // 验证数组已升序排序
        const sortedCopy = [...BRUTAL_COLOR_NAMES].sort();
        expect(BRUTAL_COLOR_NAMES).toEqual(sortedCopy);
    });

    it('不包含任何非颜色属性，且包含基础色与 subtle 衍生色', () => {
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-border-width');
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-border-color');
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-shadow-offset-x');
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-shadow-offset-y');
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-shadow-color');
        expect(BRUTAL_COLOR_NAMES).not.toContain('brutal-radius');

        // 基础颜色抽样
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-bg');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-fg');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-primary');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-primary-foreground');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-accent');

        // subtle 衍生色抽样
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-primary-subtle');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-secondary-subtle');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-accent-subtle');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-destructive-subtle');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-success-subtle');
        expect(BRUTAL_COLOR_NAMES).toContain('brutal-info-subtle');
    });
});

/** 将阴影值按层拆分（括号感知：var()/calc() 内部的逗号不分层），返回每层的空白分隔 token 序列 */
function splitShadowLayers(value: string): string[][] {
    const layers: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of value) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) {
            layers.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    layers.push(current);
    return layers.map(layer => tokenizeLayer(layer));
}

/** 将单层阴影按空白拆分为 token（括号感知：函数调用内部的空格不切分） */
function tokenizeLayer(layer: string): string[] {
    const tokens: string[] = [];
    let depth = 0;
    let current = '';
    for (const ch of layer.trim()) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (/\s/.test(ch) && depth === 0) {
            if (current) {
                tokens.push(current);
                current = '';
            }
        } else {
            current += ch;
        }
    }
    if (current) tokens.push(current);
    return tokens;
}

describe('SHADOW_DEFINITIONS stacked 档位', () => {
    const stacked = SHADOW_DEFINITIONS.find(def => def.themeVar === '--shadow-brutal-stacked');
    if (!stacked) {
        throw new Error('SHADOW_DEFINITIONS 缺少 --shadow-brutal-stacked 档位');
    }
    const light: ThemeTokens = BASE_THEME.light;
    const layers = splitShadowLayers(stacked.build(light));

    it('由三个阴影层组成', () => {
        expect(layers).toHaveLength(3);
    });

    it('三层偏移均经运行时偏移变量派生，无硬编码像素位移', () => {
        const value = stacked.build(light);
        for (const layer of layers) {
            // 层语法 offset-x offset-y blur spread color：前两个字段必须为运行时偏移派生
            const [offsetX, offsetY] = layer;
            expect(offsetX).toMatch(/^(?:calc\()?var\(--brutal-shadow-offset-/);
            expect(offsetY).toMatch(/^(?:calc\()?var\(--brutal-shadow-offset-/);
        }
        expect(value).not.toMatch(/(?:^|,\s*)\d+px\s+\d+px\s+0px/);
    });

    it('沿用 sm/base/lg 系数族：内层 0.5x、中层 1x、外层 1.5x', () => {
        const xMultipliers = layers.map(layer =>
            layer
                .filter(token => /^(?:calc\()?var\(--brutal-shadow-offset-x/.test(token))
                .map(token => /calc\(var\(--brutal-shadow-offset-x,[^)]*\)\s*\*\s*([\d.]+)\)/.exec(token)?.[1] ?? '1'),
        );
        expect(xMultipliers[0]).toEqual(['0.5']);
        expect(xMultipliers[1]).toEqual(['1']);
        expect(xMultipliers[2]).toEqual(['1.5']);
    });

    it('三明治配色：边框色夹主题色，仅中间层引用 --brutal-primary', () => {
        const value = stacked.build(light);
        const colorRefs = layers.map(
            layer => layer.find(token => /^var\(--brutal-(?:border-color|primary)/.test(token)) ?? '',
        );
        expect(colorRefs[0]).toContain('--brutal-border-color');
        expect(colorRefs[1]).toContain('--brutal-primary');
        expect(colorRefs[2]).toContain('--brutal-border-color');
        expect(value.match(/--brutal-primary/g)).toHaveLength(1);
    });
});

describe('SHADOW_DEFINITIONS inset 档位', () => {
    const inset = SHADOW_DEFINITIONS.find(def => def.themeVar === '--shadow-brutal-inset');
    if (!inset) {
        throw new Error('SHADOW_DEFINITIONS 缺少 --shadow-brutal-inset 档位');
    }

    it('以 inset 关键字开头，凹槽深度经运行时偏移变量 0.5x 派生', () => {
        const value = inset.build(BASE_THEME.light);
        expect(value.startsWith('inset ')).toBe(true);
        expect(value).toContain('calc(var(--brutal-shadow-offset-x');
        expect(value).toContain('calc(var(--brutal-shadow-offset-y');
        expect(value).toMatch(/\*\s*0\.5\)/);
        expect(value).not.toMatch(/inset\s+\d+px/);
    });

    it('凹槽描边引用边框色令牌', () => {
        expect(inset.build(BASE_THEME.light)).toContain('var(--brutal-border-color');
    });
});
