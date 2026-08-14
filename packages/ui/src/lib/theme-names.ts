/**
 * useTheme（theme-* class 体系）的合法主题名。
 *
 * 包含 classic 基础主题与 pastel、mono、warm 预设主题。
 * 由 theme-names 单一来源定义。
 */
export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'

export const VALID_THEMES: readonly ThemeName[] = ['classic', 'pastel', 'mono', 'warm'] as const

