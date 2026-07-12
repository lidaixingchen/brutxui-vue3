/**
 * Design tokens single source of truth.
 *
 * All brutalist design token values (border, shadow, radius, colors, etc.)
 * are defined here. Consumers derive their format-specific output:
 * - `packages/registry/scripts/build-registry.ts` -> registry JSON `cssVars` field
 * - `packages/ui/src/styles.css` -> `:root` / `.dark` blocks (planned: build-time injection)
 * - CSS `var(--brutal-*, fallback)` fallbacks (planned: reference these constants)
 *
 * Keep this file free of imports so it can be consumed by both the ui and
 * registry packages without creating cross-package dependencies.
 */

export type ThemeMode = 'light' | 'dark';

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

export const BASE_THEME: Record<ThemeMode, ThemeTokens> = {
    light: {
        borderWidth: '3px',
        borderColor: '#000000',
        shadowOffsetX: '4px',
        shadowOffsetY: '4px',
        shadowColor: '#000000',
        radius: '0px',
        pressedOffset: '2px',
        bg: '#ffffff',
        fg: '#000000',
        primary: '#FF6B6B',
        primaryForeground: '#000000',
        secondary: '#4ECDC4',
        secondaryForeground: '#000000',
        accent: '#FFE66D',
        accentForeground: '#000000',
        destructive: '#EF476F',
        destructiveForeground: '#ffffff',
        success: '#7FB069',
        successForeground: '#000000',
        muted: '#f3f4f6',
        mutedForeground: '#4B5563',
        ring: '#000000',
        info: '#4A90D9',
        infoForeground: '#ffffff',
        overlay: 'rgba(0, 0, 0, 0.5)',
        placeholder: '#9CA3AF',
        black: '#000000',
        yellow: '#FFE66D',
    },
    dark: {
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
        primaryForeground: '#000000',
        secondary: '#4ECDC4',
        secondaryForeground: '#000000',
        accent: '#FFE66D',
        accentForeground: '#000000',
        destructive: '#EF476F',
        destructiveForeground: '#ffffff',
        success: '#7FB069',
        successForeground: '#000000',
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#ffffff',
        info: '#3B82F6',
        infoForeground: '#ffffff',
        overlay: 'rgba(0, 0, 0, 0.7)',
        placeholder: '#6B7280',
        black: '#000000',
        yellow: '#FFE66D',
    },
};

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
        result[TOKEN_TO_CSS_VAR[key]] = tokens[key];
    }
    return result;
}

export const CSS_VARS: Record<ThemeMode, Record<string, string>> = {
    light: toCssVars(BASE_THEME.light),
    dark: toCssVars(BASE_THEME.dark),
};
