import { Z_INDEX_TOKENS } from 'brutx-shared-vue'

/**
 * 全局浮层与覆盖层 Z-Index 常量（单一数据源从 shared Z_INDEX_TOKENS 派生）。
 */
export const Z_INDEX = {
    STICKY: Z_INDEX_TOKENS.sticky,
    HEADER: Z_INDEX_TOKENS.header,
    POPOVER: Z_INDEX_TOKENS.popover,
    DROPDOWN: Z_INDEX_TOKENS.dropdown,
    TOOLTIP: Z_INDEX_TOKENS.tooltip,
    DIALOG: Z_INDEX_TOKENS.dialog,
    TOUR_CANVAS: Z_INDEX_TOKENS.tourCanvas,
    TOUR_POPOVER: Z_INDEX_TOKENS.tourPopover,
    IMAGE_PREVIEW_OVERLAY: Z_INDEX_TOKENS.previewOverlay,
    IMAGE_PREVIEW_CONTROL: Z_INDEX_TOKENS.previewControl,
    LOADING: Z_INDEX_TOKENS.loading,
    TOAST: Z_INDEX_TOKENS.toast,
    MESSAGE: Z_INDEX_TOKENS.message,
} as const
