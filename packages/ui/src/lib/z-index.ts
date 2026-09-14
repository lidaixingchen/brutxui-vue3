/**
 * 全局浮层与覆盖层 Z-Index 常量。
 */
export const Z_INDEX_TOKENS = Object.freeze({
    hide: -1,
    base: 0,
    docked: 10,
    sticky: 10,
    header: 40,
    floating: 50,
    popover: 100,
    dropdown: 100,
    tooltip: 200,
    dialog: 1000,
    tourCanvas: 9000,
    tourPopover: 9001,
    previewOverlay: 9100,
    previewControl: 9101,
    loading: 9200,
    toast: 10010,
    message: 10010,
} as const)

export const Z_INDEX = {
    STICKY: Z_INDEX_TOKENS.sticky,
    HEADER: Z_INDEX_TOKENS.header,
    FLOATING: Z_INDEX_TOKENS.floating,
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
