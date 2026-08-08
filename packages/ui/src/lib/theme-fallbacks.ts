/**
 * Theme fallback colors for Canvas/SVG rendering when CSS variables are unavailable.
 * 这些值对应默认 classic 主题（styles.css 的 :root 块 / shared/design-tokens.ts 的 BASE_THEME.light）。
 * 注意：本模块作为 scratch-card 的独立 registry lib 分发（registry:lib），必须保持自包含、
 * 无 `@/` 相对导入（CLI 独立安装时不会携带 src/themes 等模块），因此无法直接引用主题系统常量，
 * 仅以注释标注单一数据源（shared/design-tokens.ts）。
 */

/** Primary accent color (coral red) */
export const FALLBACK_PRIMARY_COLOR = '#FF6B6B'

/** Secondary accent color (teal) */
export const FALLBACK_SECONDARY_COLOR = '#4ECDC4'

/**
 * Foreground / border color（仅默认 light 主题）。
 * 注意：dark 主题下 styles.css 的 --brutal-fg / --brutal-border-color 为 #ffffff；
 * 暗色环境下 CSS 变量不可用（如 SSR）时应优先通过 getComputedStyle 读取主题变量，本常量仅作 light 兜底。
 */
export const FALLBACK_FG_COLOR = '#000000'
