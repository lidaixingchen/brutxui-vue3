/**
 * @module lib
 * @description BrutxUI 工具函数库
 *
 * 提供通用工具函数，包括：
 * - 样式工具（cn - className 合并）
 * - 颜色工具（HSV/RGB/HSL 转换、颜色解析）
 * - 日期工具（ISO 周数、日期格式化）
 * - 默认配置（颜色预设、图标尺寸）
 */

// 样式工具
export { cn } from './utils'

// 颜色工具
export {
    hsvToRgb,
    rgbToHsv,
    rgbToHsl,
    hslToRgb,
    hsvToHex,
    hsvToHexAlpha,
    hexToHsv,
    hexToRgb,
    parseColor,
    isValidColor,
    formatColor,
    normalizeColor,
} from './color'
export type { HSVColor, RGBColor, HSLColor, ColorFormat } from './color'

// 日期工具
export {
    getISOWeekNumber,
    getWeekStartDate,
    formatDate,
    parseFormattedDate,
} from './date'

// 默认配置
export { DEFAULT_COLOR_PRESETS } from './default-presets'
export type { ColorPreset } from './default-presets'

// 图标尺寸
export { iconSizeVariants } from './icon-size-variants'
export type { IconSize } from './icon-size-variants'

// 验证工具
export { EMAIL_REGEX } from './validation'

// 默认值
export {
    DEFAULT_AUTOPLAY_INTERVAL_MS,
    HSV_PERCENT_PRECISION,
    HUE_DEGREES,
    HSV_COMPONENT_MAX,
    ALPHA_PRECISION,
    DIALOG_MIN_WIDTH_PX,
    DIALOG_MIN_HEIGHT_PX,
    MAX_TOASTS,
    DEFAULT_PAGE_SIZE_OPTIONS,
    CARD_3D_DEFAULT_PERSPECTIVE_PX,
    SKETCHY_CHART_DEFAULT_WIDTH,
    SKETCHY_CHART_DEFAULT_HEIGHT,
    TWO_DIGIT_YEAR_PIVOT,
} from './defaults'

// 主题变量系统
export {
    createThemeVariables,
    createDarkModeToggle,
    DEFAULT_THEME,
    DARK_THEME,
    PASTEL_THEME,
    MONO_THEME,
    WARM_THEME,
    DEFAULT_THEMES,
} from './theme-variables'
export type {
    ThemeVariables,
    ThemeColors,
    ThemeSpacing,
    ThemeBorder,
    ThemeShadow,
    ThemeTypography,
    ThemeOptions,
    ThemeApi,
    ThemeVariablesApi,
} from './theme-variables'

// 主题编辑器
export { createThemeEditor } from './theme-editor'
export type {
    PartialThemeVariables,
    ThemeEditorOptions,
    CSSGenerateOptions,
    ThemeEditorReturn,
} from './theme-editor'
