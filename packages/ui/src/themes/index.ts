/**
 * @module themes
 * @description 预设主题配置
 *
 * 提供多种预设主题，支持主题切换和自定义覆盖。
 * 所有主题均基于 ThemeVariables 类型定义，与 CSS 变量 (--brutal-*) 对应。
 */

import type { ThemeVariables } from '../lib/theme-variables'

// ============================================================================
// 预设主题定义
// ============================================================================

/**
 * 默认主题 - Neo-Brutalism 风格
 *
 * 经典的粗野主义设计：鲜艳的珊瑚红主色、纯黑边框、无圆角、硬朗阴影。
 */
export const defaultTheme: ThemeVariables = {
    colors: {
        primary: '#FF6B6B',
        primaryForeground: '#000000',
        secondary: '#4ECDC4',
        secondaryForeground: '#000000',
        accent: '#FFE66D',
        accentForeground: '#000000',
        destructive: '#EF476F',
        destructiveForeground: '#FFFFFF',
        success: '#7FB069',
        successForeground: '#000000',
        info: '#4A90D9',
        infoForeground: '#FFFFFF',
        bg: '#FFFFFF',
        fg: '#000000',
        muted: '#f3f4f6',
        mutedForeground: '#4B5563',
        ring: '#000000',
        overlay: 'rgba(0, 0, 0, 0.5)',
        placeholder: '#9CA3AF',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '3px',
        color: '#000000',
        radius: '0px',
    },
    shadow: {
        offsetX: '4px',
        offsetY: '4px',
        color: '#000000',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 暗色主题
 *
 * 深色背景上的粗野主义风格，保持鲜明的色彩对比度。
 * 边框和阴影使用白色以适应深色背景。
 */
export const darkTheme: ThemeVariables = {
    colors: {
        primary: '#FF6B6B',
        primaryForeground: '#000000',
        secondary: '#4ECDC4',
        secondaryForeground: '#000000',
        accent: '#FFE66D',
        accentForeground: '#000000',
        destructive: '#EF476F',
        destructiveForeground: '#FFFFFF',
        success: '#7FB069',
        successForeground: '#000000',
        info: '#3B82F6',
        infoForeground: '#FFFFFF',
        bg: '#141414',
        fg: '#FFFFFF',
        muted: '#1e1e1e',
        mutedForeground: '#9CA3AF',
        ring: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.7)',
        placeholder: '#6B7280',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '3px',
        color: '#FFFFFF',
        radius: '0px',
    },
    shadow: {
        offsetX: '4px',
        offsetY: '4px',
        color: '#FFFFFF',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

/**
 * 高对比度主题
 *
 * 为无障碍访问优化的主题，使用更粗的边框、更大的阴影偏移，
 * 以及更高对比度的色彩组合。适合视力受限用户使用。
 */
export const highContrastTheme: ThemeVariables = {
    colors: {
        primary: '#0000CC',
        primaryForeground: '#FFFFFF',
        secondary: '#006600',
        secondaryForeground: '#FFFFFF',
        accent: '#CC6600',
        accentForeground: '#FFFFFF',
        destructive: '#CC0000',
        destructiveForeground: '#FFFFFF',
        success: '#006600',
        successForeground: '#FFFFFF',
        info: '#0000CC',
        infoForeground: '#FFFFFF',
        bg: '#FFFFFF',
        fg: '#000000',
        muted: '#E5E5E5',
        mutedForeground: '#333333',
        ring: '#000000',
        overlay: 'rgba(0, 0, 0, 0.8)',
        placeholder: '#555555',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '4px',
        color: '#000000',
        radius: '0px',
    },
    shadow: {
        offsetX: '6px',
        offsetY: '6px',
        color: '#000000',
    },
    typography: {
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
        fontSize: {
            sm: '1rem',
            base: '1.125rem',
            lg: '1.25rem',
            xl: '1.5rem',
            '2xl': '1.75rem',
        },
    },
}

/**
 * 简约主题
 *
 * 去除粗野主义的张扬，保留其结构感。
 * 使用更细的边框、柔和的阴影、system-ui 字体，视觉上更轻盈克制。
 */
export const minimalTheme: ThemeVariables = {
    colors: {
        primary: '#333333',
        primaryForeground: '#FFFFFF',
        secondary: '#666666',
        secondaryForeground: '#FFFFFF',
        accent: '#555555',
        accentForeground: '#FFFFFF',
        destructive: '#CC0000',
        destructiveForeground: '#FFFFFF',
        success: '#006600',
        successForeground: '#FFFFFF',
        info: '#0066CC',
        infoForeground: '#FFFFFF',
        bg: '#FAFAFA',
        fg: '#333333',
        muted: '#F0F0F0',
        mutedForeground: '#777777',
        ring: '#333333',
        overlay: 'rgba(0, 0, 0, 0.4)',
        placeholder: '#AAAAAA',
    },
    spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
    },
    border: {
        width: '1px',
        color: '#CCCCCC',
        radius: '4px',
    },
    shadow: {
        offsetX: '2px',
        offsetY: '2px',
        color: '#CCCCCC',
    },
    typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: {
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
        },
    },
}

// ============================================================================
// 主题集合
// ============================================================================

/**
 * 所有预设主题映射
 */
export const themes = {
    default: defaultTheme,
    dark: darkTheme,
    'high-contrast': highContrastTheme,
    minimal: minimalTheme,
} as const

/**
 * 预设主题名称类型
 */
export type PresetThemeName = keyof typeof themes

/**
 * 获取所有可用的预设主题名称
 */
export function getPresetThemeNames(): PresetThemeName[] {
    return Object.keys(themes) as PresetThemeName[]
}

/**
 * 根据名称获取预设主题
 * @param name - 主题名称
 * @returns 主题变量配置，如果主题不存在则返回 undefined
 */
export function getPresetTheme(name: string): ThemeVariables | undefined {
    return themes[name as PresetThemeName]
}

/**
 * 创建自定义主题（基于预设主题覆盖）
 * @param baseThemeName - 基础主题名称
 * @param overrides - 覆盖的变量
 * @returns 合并后的主题变量
 */
export function createCustomTheme(
    baseThemeName: PresetThemeName,
    overrides: Partial<ThemeVariables>
): ThemeVariables {
    const baseTheme = themes[baseThemeName]
    return deepMerge(
        baseTheme as unknown as Record<string, unknown>,
        overrides as unknown as Record<string, unknown>,
    ) as unknown as ThemeVariables
}

// ============================================================================
// 内部工具函数
// ============================================================================

/**
 * 深度合并对象
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
    const result = { ...target }

    for (const key of Object.keys(source) as Array<keyof T>) {
        const sourceVal = source[key]
        const targetVal = target[key]

        if (
            sourceVal !== null &&
            sourceVal !== undefined &&
            typeof sourceVal === 'object' &&
            !Array.isArray(sourceVal) &&
            typeof targetVal === 'object' &&
            targetVal !== null &&
            !Array.isArray(targetVal)
        ) {
            result[key] = deepMerge(
                targetVal as Record<string, unknown>,
                sourceVal as Record<string, unknown>
            ) as T[keyof T]
        } else if (sourceVal !== undefined) {
            result[key] = sourceVal as T[keyof T]
        }
    }

    return result
}

// ============================================================================
// Re-exports
// ============================================================================

export type { ThemeVariables, ThemeColors, ThemeSpacing, ThemeBorder, ThemeShadow, ThemeTypography } from '../lib/theme-variables'
