import { describe, expect, it } from 'vitest';
import {
    BRUTAL_COLOR_NAMES,
    NON_COLOR_TOKEN_KEYS,
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
