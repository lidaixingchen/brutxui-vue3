/**
 * useTheme（theme-* class 体系）的合法主题名。
 *
 * 命名与 theme-variables 的 DEFAULT_THEMES（CSS 变量体系）对齐：
 * 基础主题均为 'classic'，共享 pastel/mono/warm；DEFAULT_THEMES 额外含 'dark'（完整深色配色，
 * useTheme 中深色以 colorMode='dark' 实现，故 'dark' 不是 theme-class 主题名）。
 * VALID_THEMES 是 DEFAULT_THEMES 键集的非 dark 子集，由 theme-names 单一来源定义。
 */
export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'

export const VALID_THEMES: readonly ThemeName[] = ['classic', 'pastel', 'mono', 'warm'] as const
