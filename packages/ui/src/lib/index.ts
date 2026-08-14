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
// 注意：仅导出组件公共 props/配置默认值。AUDIO_*/CANVAS_*/GLITCH_*/HARDCORE_INPUT_*
// 等音效/画布/特效内部调优参数不再从聚合入口导出（各组件直接 import './defaults'），
// 以保持公共 API 面精简，允许内部自由调整。
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
    DEFAULT_DIALOG_TRANSITION_MS,
    DATA_TABLE_COLUMN_WIDTH_FALLBACK_PX,
    DATA_TABLE_EXPAND_COLUMN_WIDTH_PX,
    DATA_TABLE_SELECT_COLUMN_WIDTH_PX,
    DATA_TABLE_ROW_HEIGHT_FALLBACK_PX,
    DATA_TABLE_FIXED_COLUMN_Z_INDEX,
    DEFAULT_PAGE_SIZE,
    DEFAULT_AUTOPLAY_DELAY_MS,
} from './defaults'

// 主题名称常量与类型
export { VALID_THEMES } from './theme-names'
export type { ThemeName } from './theme-names'

