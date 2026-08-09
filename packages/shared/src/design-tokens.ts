/**
 * Design tokens single source of truth.
 *
 * All brutalist design token values (border, shadow, radius, colors, etc.)
 * Consumers derive their format-specific output:
 * - `packages/registry/scripts/build-registry.ts` -> registry JSON `cssVars` field
 * - `packages/ui/src/styles.css` -> `@theme` (with fallbacks) + `:root` / `.dark` blocks (build-time injection via `packages/ui/scripts/generate-styles-tokens.ts`)
 * - CSS `var(--brutal-*, fallback)` fallbacks sourced from `BASE_THEME.light`
 *
 * Keep this file free of imports so it can be consumed by both the ui and
 * registry packages without creating cross-package dependencies.
 */

export type ThemeMode = 'light' | 'dark';

/**
 * 原始色板：black/yellow 作为品牌基础色，供本文件内的主题令牌引用（单一事实来源）。
 * 与语义令牌（border/fg/accent 等）重合处统一引用此处的常量，避免调整主题色时
 * 多处置放导致漂移。外部如需原始色值，通过 BASE_THEME 的语义令牌读取。
 */
const PALETTE_BLACK = '#000000';
const PALETTE_YELLOW = '#FFE66D';

export interface ThemeTokens {
    borderWidth: string;
    borderColor: string;
    shadowOffsetX: string;
    shadowOffsetY: string;
    shadowColor: string;
    radius: string;
    pressedOffset: string;
    bg: string;
    fg: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    success: string;
    successForeground: string;
    muted: string;
    mutedForeground: string;
    ring: string;
    info: string;
    infoForeground: string;
    overlay: string;
    placeholder: string;
    black: string;
    yellow: string;
}

export const BASE_THEME: Readonly<Record<ThemeMode, Readonly<ThemeTokens>>> = Object.freeze({
    light: Object.freeze({
        borderWidth: '3px',
        borderColor: PALETTE_BLACK,
        shadowOffsetX: '4px',
        shadowOffsetY: '4px',
        shadowColor: PALETTE_BLACK,
        radius: '0px',
        pressedOffset: '2px',
        bg: '#ffffff',
        fg: PALETTE_BLACK,
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: '#ffffff',
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#f3f4f6',
        mutedForeground: '#4B5563',
        ring: PALETTE_BLACK,
        info: '#4A90D9',
        // 黑字对比度 6.28:1 满足 WCAG AA（4.5:1），与 primary/secondary 黑字风格一致
        infoForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.5)',
        placeholder: '#9CA3AF',
        black: PALETTE_BLACK,
        yellow: PALETTE_YELLOW,
    }),
    dark: Object.freeze({
        borderWidth: '3px',
        borderColor: '#ffffff',
        shadowOffsetX: '4px',
        shadowOffsetY: '4px',
        shadowColor: '#ffffff',
        radius: '0px',
        pressedOffset: '2px',
        bg: '#141414',
        fg: '#ffffff',
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: '#ffffff',
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#ffffff',
        info: '#3B82F6',
        // 黑字对比度 5.71:1 满足 WCAG AA（4.5:1）
        infoForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.7)',
        placeholder: '#6B7280',
        black: PALETTE_BLACK,
        yellow: PALETTE_YELLOW,
    }),
});

const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
    borderWidth: 'brutal-border-width',
    borderColor: 'brutal-border-color',
    shadowOffsetX: 'brutal-shadow-offset-x',
    shadowOffsetY: 'brutal-shadow-offset-y',
    shadowColor: 'brutal-shadow-color',
    radius: 'brutal-radius',
    pressedOffset: 'brutal-pressed-offset',
    bg: 'brutal-bg',
    fg: 'brutal-fg',
    primary: 'brutal-primary',
    primaryForeground: 'brutal-primary-foreground',
    secondary: 'brutal-secondary',
    secondaryForeground: 'brutal-secondary-foreground',
    accent: 'brutal-accent',
    accentForeground: 'brutal-accent-foreground',
    destructive: 'brutal-destructive',
    destructiveForeground: 'brutal-destructive-foreground',
    success: 'brutal-success',
    successForeground: 'brutal-success-foreground',
    muted: 'brutal-muted',
    mutedForeground: 'brutal-muted-foreground',
    ring: 'brutal-ring',
    info: 'brutal-info',
    infoForeground: 'brutal-info-foreground',
    overlay: 'brutal-overlay',
    placeholder: 'brutal-placeholder',
    black: 'brutal-black',
    yellow: 'brutal-yellow',
};

export function toCssVars(tokens: ThemeTokens): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of Object.keys(TOKEN_TO_CSS_VAR) as Array<keyof ThemeTokens>) {
        const value = tokens[key];
        if (value === undefined || value === null) {
            // 缺值/null 会静默产出 "--brutal-*: undefined/null" 的脏样式，显式抛错暴露调用方数据问题
            throw new Error(`Missing design token value for key: ${key}`);
        }
        result[TOKEN_TO_CSS_VAR[key]] = value;
    }
    return result;
}

export const CSS_VARS: Record<ThemeMode, Record<string, string>> = {
    light: toCssVars(BASE_THEME.light),
    dark: toCssVars(BASE_THEME.dark),
};
