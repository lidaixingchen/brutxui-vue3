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
// 注意：AUDIO_*/CANVAS_*/GLITCH_*/HARDCORE_INPUT_* 属于组件内部调优参数，
// 仅为兼容既有消费方保留导出，不作为稳定的公共 API 契约，后续重构可收敛回组件模块。
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
    SKETCHY_CHART_DEFAULT_WIDTH_PX,
    SKETCHY_CHART_DEFAULT_HEIGHT_PX,
    TWO_DIGIT_YEAR_PIVOT,
    DEFAULT_MESSAGE_DURATION_MS,
    MESSAGE_GRACE_PERIOD_MS,
    DEFAULT_TOAST_MAX_VISIBLE,
    DEFAULT_TOAST_GAP_PX,
    GLITCH_AUTOPLAY_ACTIVE_DURATION_MS,
    GLITCH_MIN_INTERVAL_MS,
    CANVAS_SAMPLE_GRID_SIZE,
    CANVAS_PROGRESS_CHECK_FRAME_INTERVAL,
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
    DATA_TABLE_COLUMN_WIDTH_FALLBACK_PX,
    DATA_TABLE_EXPAND_COLUMN_WIDTH_PX,
    DATA_TABLE_SELECT_COLUMN_WIDTH_PX,
    DATA_TABLE_ROW_HEIGHT_FALLBACK_PX,
    DATA_TABLE_FIXED_COLUMN_Z_INDEX,
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
// VALID_THEMES 属 useTheme（theme-* class 体系）；DEFAULT_THEMES 属 CSS 变量体系，
// 两者是两套独立主题系统，命名口径不同（见 ./theme-names）
export { VALID_THEMES } from './theme-names'
export type { ThemeName } from './theme-names'

// 主题编辑器
export { createThemeEditor } from './theme-editor'
export type {
    PartialThemeVariables,
    ThemeEditorOptions,
    CSSGenerateOptions,
    ThemeEditorReturn,
} from './theme-editor'
