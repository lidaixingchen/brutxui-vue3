import { defaultTheme } from '@/themes'

/**
 * Theme fallback colors for Canvas/SVG rendering when CSS variables are unavailable.
 * 由默认主题（defaultTheme，即 styles.css 默认 light 主题）派生，避免手工同步漂移。
 */

/** Primary accent color (coral red) */
export const FALLBACK_PRIMARY_COLOR = defaultTheme.colors.primary

/** Secondary accent color (teal) */
export const FALLBACK_SECONDARY_COLOR = defaultTheme.colors.secondary

/**
 * Foreground / border color（仅默认 light 主题）。
 * 注意：dark 主题下 styles.css 的 --brutal-fg / --brutal-border-color 为 #ffffff；
 * 暗色环境下 CSS 变量不可用（如 SSR）时应优先通过 getComputedStyle 读取主题变量，本常量仅作 light 兜底。
 */
export const FALLBACK_FG_COLOR = defaultTheme.colors.fg
