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
    statusSuccess: string;
    statusSuccessForeground: string;
    statusWarning: string;
    statusWarningForeground: string;
    statusInfo: string;
    statusInfoForeground: string;
    statusError: string;
    statusErrorForeground: string;
    overlay: string;
    overlaySubtle: string;
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
        bg: '#ffffff',
        fg: PALETTE_BLACK,
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: PALETTE_BLACK,
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#f3f4f6',
        mutedForeground: '#4B5563',
        ring: PALETTE_BLACK,
        info: '#4A90D9',
        // 黑字对比度 6.28:1 满足 WCAG AA（4.5:1），与 primary/secondary 黑字风格一致
        infoForeground: PALETTE_BLACK,
        // 状态色为恒定辨识信号，亮暗一致（维持 Result 现状渲染）；success/info 黑字对比 8.6:1 / 5.8:1 过 AA
        statusSuccess: '#22c55e',
        statusSuccessForeground: PALETTE_BLACK,
        statusWarning: PALETTE_YELLOW,
        statusWarningForeground: PALETTE_BLACK,
        statusInfo: '#3b82f6',
        statusInfoForeground: PALETTE_BLACK,
        statusError: '#EF476F',
        statusErrorForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.5)',
        // 5% 微妙叠色（拖拽指示等浅层覆盖，取代硬编码 bg-black/5，见审查报告 §3.4）
        overlaySubtle: 'rgba(0, 0, 0, 0.05)',
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
        bg: '#141414',
        fg: '#ffffff',
        primary: '#FF6B6B',
        primaryForeground: PALETTE_BLACK,
        secondary: '#4ECDC4',
        secondaryForeground: PALETTE_BLACK,
        accent: PALETTE_YELLOW,
        accentForeground: PALETTE_BLACK,
        destructive: '#EF476F',
        destructiveForeground: PALETTE_BLACK,
        success: '#7FB069',
        successForeground: PALETTE_BLACK,
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#ffffff',
        info: '#3B82F6',
        // 黑字对比度 5.71:1 满足 WCAG AA（4.5:1）
        infoForeground: PALETTE_BLACK,
        // 状态色恒定，亮暗一致（见 light 注释）
        statusSuccess: '#22c55e',
        statusSuccessForeground: PALETTE_BLACK,
        statusWarning: PALETTE_YELLOW,
        statusWarningForeground: PALETTE_BLACK,
        statusInfo: '#3b82f6',
        statusInfoForeground: PALETTE_BLACK,
        statusError: '#EF476F',
        statusErrorForeground: PALETTE_BLACK,
        overlay: 'rgba(0, 0, 0, 0.7)',
        // 5% 微妙叠色（dark 下为白叠色，见 light 注释）
        overlaySubtle: 'rgba(255, 255, 255, 0.05)',
        placeholder: '#6B7280',
        black: PALETTE_BLACK,
        yellow: PALETTE_YELLOW,
    }),
});

export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
    borderWidth: 'brutal-border-width',
    borderColor: 'brutal-border-color',
    shadowOffsetX: 'brutal-shadow-offset-x',
    shadowOffsetY: 'brutal-shadow-offset-y',
    shadowColor: 'brutal-shadow-color',
    radius: 'brutal-radius',
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
    statusSuccess: 'brutal-status-success',
    statusSuccessForeground: 'brutal-status-success-foreground',
    statusWarning: 'brutal-status-warning',
    statusWarningForeground: 'brutal-status-warning-foreground',
    statusInfo: 'brutal-status-info',
    statusInfoForeground: 'brutal-status-info-foreground',
    statusError: 'brutal-status-error',
    statusErrorForeground: 'brutal-status-error-foreground',
    overlay: 'brutal-overlay',
    overlaySubtle: 'brutal-overlay-subtle',
    placeholder: 'brutal-placeholder',
    black: 'brutal-black',
    yellow: 'brutal-yellow',
};

export interface ThemePresetOverrides {
    name: string;
    selector: string;
    darkSelector: string;
    light: Partial<ThemeTokens>;
    dark: Partial<ThemeTokens>;
}

export const THEME_PRESETS: Readonly<Record<string, Readonly<ThemePresetOverrides>>> = Object.freeze({
    pastel: Object.freeze({
        name: 'pastel',
        selector: '.theme-pastel',
        darkSelector: '.dark .theme-pastel, .theme-pastel.dark',
        light: Object.freeze({
            borderWidth: '2px',
            borderColor: '#1e1e24',
            shadowOffsetX: '3px',
            shadowOffsetY: '3px',
            shadowColor: '#1e1e24',
            radius: '8px',
            bg: '#faf9f6',
            fg: '#1e1e24',
            primary: '#d6c6e1',
            primaryForeground: '#1e1e24',
            secondary: '#c5ded9',
            secondaryForeground: '#1e1e24',
            accent: '#fbe3b5',
            accentForeground: '#1e1e24',
            destructive: '#f3b0b0',
            destructiveForeground: '#1e1e24',
            success: '#cce2cb',
            successForeground: '#1e1e24',
            muted: '#eae8e1',
            mutedForeground: '#5e5e6b',
            ring: '#1e1e24',
            info: '#a8c8e8',
            infoForeground: '#1e1e24',
            overlay: 'rgba(0, 0, 0, 0.4)',
            placeholder: '#b0aeb5',
        }),
        dark: Object.freeze({
            borderColor: '#3a3a4a',
            shadowColor: '#3a3a4a',
            radius: '8px',
            bg: '#16161e',
            fg: '#f0f0f5',
            primary: '#e8988a',
            primaryForeground: '#16161e',
            secondary: '#e0b8b0',
            secondaryForeground: '#16161e',
            accent: '#9ac4b6',
            accentForeground: '#16161e',
            destructive: '#db6e60',
            destructiveForeground: '#16161e',
            success: '#7cbfa0',
            successForeground: '#16161e',
            muted: '#20202c',
            mutedForeground: '#9898b0',
            ring: '#9ac4b6',
            info: '#88b8e6',
            infoForeground: '#16161e',
            overlay: 'rgba(0, 0, 0, 0.6)',
            placeholder: '#666677',
        }),
    }),
    mono: Object.freeze({
        name: 'mono',
        selector: '.theme-mono',
        darkSelector: '.dark .theme-mono, .theme-mono.dark',
        light: Object.freeze({
            borderWidth: '4px',
            borderColor: '#000000',
            shadowOffsetX: '5px',
            shadowOffsetY: '5px',
            shadowColor: '#000000',
            radius: '0px',
            bg: '#ffffff',
            fg: '#000000',
            primary: '#000000',
            primaryForeground: '#ffffff',
            secondary: '#ffffff',
            secondaryForeground: '#000000',
            accent: '#707070',
            accentForeground: '#ffffff',
            destructive: '#333333',
            destructiveForeground: '#ffffff',
            success: '#dddddd',
            successForeground: '#000000',
            muted: '#f0f0f0',
            mutedForeground: '#555555',
            ring: '#000000',
            info: '#666666',
            infoForeground: '#ffffff',
            overlay: 'rgba(0, 0, 0, 0.5)',
            placeholder: '#888888',
        }),
        dark: Object.freeze({
            borderColor: '#ffffff',
            shadowColor: '#ffffff',
            bg: '#000000',
            fg: '#ffffff',
            primary: '#ffffff',
            primaryForeground: '#000000',
            secondary: '#000000',
            secondaryForeground: '#ffffff',
            accent: '#888888',
            accentForeground: '#000000',
            destructive: '#cccccc',
            destructiveForeground: '#000000',
            success: '#222222',
            successForeground: '#ffffff',
            muted: '#1a1a1a',
            mutedForeground: '#aaaaaa',
            ring: '#ffffff',
            info: '#999999',
            infoForeground: '#000000',
            overlay: 'rgba(0, 0, 0, 0.7)',
            placeholder: '#777777',
        }),
    }),
    warm: Object.freeze({
        name: 'warm',
        selector: '.theme-warm',
        darkSelector: '.dark .theme-warm, .theme-warm.dark',
        light: Object.freeze({
            borderWidth: '3px',
            borderColor: '#5C3D2E',
            shadowOffsetX: '4px',
            shadowOffsetY: '4px',
            shadowColor: '#5C3D2E',
            radius: '4px',
            bg: '#FFF8F0',
            fg: '#2D1810',
            primary: '#E8722A',
            primaryForeground: '#2D1810',
            secondary: '#856A44',
            secondaryForeground: '#FFF8F0',
            accent: '#F2C078',
            accentForeground: '#2D1810',
            destructive: '#C0392B',
            destructiveForeground: '#FFF8F0',
            success: '#82943E',
            successForeground: '#2D1810',
            muted: '#F5EDE3',
            mutedForeground: '#6B5B4F',
            ring: '#E8722A',
            info: '#D4956A',
            infoForeground: '#2D1810',
            overlay: 'rgba(45, 24, 16, 0.5)',
            placeholder: '#B8A898',
        }),
        dark: Object.freeze({
            borderWidth: '3px',
            borderColor: '#C4A882',
            shadowOffsetX: '4px',
            shadowOffsetY: '4px',
            shadowColor: '#C4A882',
            radius: '4px',
            bg: '#1A1410',
            fg: '#F5E6D3',
            primary: '#F59E4C',
            primaryForeground: '#1A1410',
            secondary: '#B8956A',
            secondaryForeground: '#1A1410',
            accent: '#FFD89B',
            accentForeground: '#1A1410',
            destructive: '#E74C3C',
            destructiveForeground: '#1A1410',
            success: '#A3B556',
            successForeground: '#1A1410',
            muted: '#2A2018',
            mutedForeground: '#B8A898',
            ring: '#F59E4C',
            info: '#E0A97E',
            infoForeground: '#1A1410',
            overlay: 'rgba(0, 0, 0, 0.7)',
            placeholder: '#8C7A6B',
        }),
    }),
});

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
