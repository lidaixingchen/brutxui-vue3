/**
 * useTheme（theme-* class 体系）的合法主题名。
 *
 * 注意：这套主题名属于传统的「主题类切换」系统（应用 `theme-classic` 等 class 到根元素），
 * 与 theme-variables 的 DEFAULT_THEMES（CSS 变量体系，键为 default/dark/pastel/mono/warm）是
 * 两套相互独立的主题系统，命名口径不同，勿混淆；'classic' 在 DEFAULT_THEMES 中不存在，
 * 而 'default'/'dark' 也不属于 VALID_THEMES。
 */
export type ThemeName = 'classic' | 'pastel' | 'mono' | 'warm'

export const VALID_THEMES: readonly ThemeName[] = ['classic', 'pastel', 'mono', 'warm'] as const
