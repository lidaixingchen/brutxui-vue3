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
    DEFAULT_MESSAGE_DURATION_MS,
    MESSAGE_GRACE_PERIOD_MS,
    DEFAULT_TOAST_MAX_VISIBLE,
    DEFAULT_TOAST_GAP_PX,
    GLITCH_AUTOPLAY_ACTIVE_DURATION_MS,
    GLITCH_MIN_INTERVAL_MS,
    CANVAS_SAMPLE_GRID_SIZE,
    CANVAS_PROGRESS_CHECK_INTERVAL_MS,
    CANVAS_PROGRESS_THROTTLE_MS,
    AUDIO_TYPE_THROTTLE_MS,
    AUDIO_TYPE_BASE_FREQ,
    AUDIO_TYPE_FREQ_RANGE,
    AUDIO_TYPE_GAIN,
    AUDIO_TYPE_GAIN_END,
    AUDIO_TYPE_DURATION,
    AUDIO_SUCCESS_START_FREQ,
    AUDIO_SUCCESS_END_FREQ,
    AUDIO_SUCCESS_GAIN,
    AUDIO_SUCCESS_GAIN_END,
    AUDIO_SUCCESS_DURATION,
    AUDIO_FAIL_FREQ_1,
    AUDIO_FAIL_FREQ_2,
    AUDIO_FAIL_FREQ_SHIFT_TIME,
    AUDIO_FAIL_GAIN,
    AUDIO_FAIL_GAIN_END,
    AUDIO_FAIL_DURATION,
    DEFAULT_DIALOG_TRANSITION_MS,
    HARDCORE_INPUT_SHAKE_DELAY_MS,
    DEFAULT_PAGE_SIZE,
    DEFAULT_AUTOPLAY_DELAY_MS,
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
