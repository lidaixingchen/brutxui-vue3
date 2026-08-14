/**
 * @module composables
 * @description BrutxUI Vue 3 Composables 集合
 *
 * 提供可复用的 Vue 3 组合式函数，涵盖：
 * - UI 交互（Toast、Theme、Dialog、Locale）
 * - 表单输入（FormFieldValidation、ColorPicker、DatePicker）
 * - 数据表格（Sort、Filter、Selection、Pagination）
 * - 动画（Animation、ReducedMotion、CanvasInteraction）
 * - 工具函数（Debounce、Throttle、Clipboard）
 */

// UI 交互类
export { useToast, provideToast, createToast, destroyFallback as destroyToastFallback } from './useToast'
export type { ToastItem, ToastPosition, ToastStackOptions, PromiseToastOptions } from './useToast'

export { useMessage, destroyMessageSystem } from './useMessage'
export type { MessageItem, MessageOptions, MessageType, UseMessageReturn } from './useMessage'

export { useTheme, provideTheme, createTheme, destroyFallback as destroyThemeFallback } from './useTheme'
export type { ThemeName, ColorMode, ResolvedColorMode } from './useTheme'

export { destroyBrutxUI, destroyBrutxFallbacks } from './destroyFallbacks'

export { useLocale, provideLocale } from './useLocale'
export type { TranslateFunction } from './useLocale'

export { useClearable } from './useClearable'
export type { UseClearableOptions } from './useClearable'

export { useClearableSelection } from './useClearableSelection'
export type { UseClearableSelectionOptions, UseClearableSelectionReturn } from './useClearableSelection'

export { useSelectionDisplayText } from './useSelectionDisplayText'
export type { UseSelectionDisplayTextOptions } from './useSelectionDisplayText'

export { useSelectableTrigger } from './useSelectableTrigger'
export type { SelectableTriggerClass, SelectableTriggerState, UseSelectableTriggerOptions, UseSelectableTriggerReturn } from './useSelectableTrigger'

export { useTransferPanelSelection } from './useTransferPanelSelection'
export type { TransferPanelItem, TransferPanelKey, UseTransferPanelSelectionOptions, UseTransferPanelSelectionReturn } from './useTransferPanelSelection'

export { useDialog } from './useDialog'
export type { UseDialogReturn, ShowDialogOptions } from './useDialog'

export { useMessageBox } from './useMessageBox'
export type { UseMessageBoxReturn, MessageBoxOptions } from './useMessageBox'

export { useStepper } from './useStepper'
export type { Step, UseStepperOptions, UseStepperReturn } from './useStepper'

// 表单/输入类
export { useFormFieldValidation } from './useFormFieldValidation'
export type { UseFormFieldValidationOptions, UseFormFieldValidationReturn, ValidationState, ValidationRule, ValidateOn } from './useFormFieldValidation'

export { useColorPicker } from './useColorPicker'
export type { UseColorPickerOptions, UseColorPickerReturn } from './useColorPicker'

export { useColorHistory } from './useColorHistory'
export type { UseColorHistoryOptions, UseColorHistoryReturn } from './useColorHistory'

export { useDatePicker } from './useDatePicker'
export type { UseDatePickerOptions, UseDatePickerReturn } from './useDatePicker'

export { useUpload } from './useUpload'
export type { UseUploadOptions, UseUploadReturn } from './useUpload'

// DataTable 类
export { useDataTableSort } from './useDataTableSort'
export type { UseDataTableSortOptions, UseDataTableSortReturn } from './useDataTableSort'

export { useDataTableFilter } from './useDataTableFilter'
export type { UseDataTableFilterOptions, UseDataTableFilterReturn } from './useDataTableFilter'

export { useDataTableSelection } from './useDataTableSelection'
export type { UseDataTableSelectionOptions, UseDataTableSelectionReturn } from './useDataTableSelection'

export { useDataTablePagination } from './useDataTablePagination'
export type { UseDataTablePaginationOptions, UseDataTablePaginationReturn } from './useDataTablePagination'

// 动画/Canvas 类
export { useReducedMotion } from './useReducedMotion'
export { useGlitchEffect } from './useGlitchEffect'
export type { GlitchTrigger, UseGlitchEffectOptions } from './useGlitchEffect'
export { useCanvasInteraction } from './useCanvasInteraction'
export type { UseCanvasInteractionReturn } from './useCanvasInteraction'

// 轮播/画板类
export { useCarousel } from './useCarousel'
export type { UseCarouselOptions, UseCarouselReturn } from './useCarousel'

export { useCarouselEnhanced } from './useCarouselEnhanced'
export type { UseCarouselEnhancedOptions } from './useCarouselEnhanced'
export { useKanban } from './useKanban'
export type { KanbanCard, KanbanColumn, UseKanbanOptions, UseKanbanReturn } from './useKanban'

// 音频类
export { useAudioEngine } from './useAudioEngine'
export type { UseAudioEngineReturn } from './useAudioEngine'

// 工具类
export { useDebounce } from './useDebounce'
export type { UseDebounceOptions, UseDebounceReturn } from './useDebounce'

export { useThrottle } from './useThrottle'
export type { UseThrottleOptions, UseThrottleReturn } from './useThrottle'

export { useClipboard } from './useClipboard'
export type { UseClipboardReturn } from './useClipboard'
