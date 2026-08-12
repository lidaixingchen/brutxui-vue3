import { cva } from 'class-variance-authority'
import { FOCUS_OUTLINE_CLASSES } from '@/lib/utils'
import { brutalHoverLift, brutalHoverLiftSm, brutalPress } from '@/lib/brutal-interaction-variants'

export const overlayVariants = cva([
    'fixed inset-0 z-50 bg-brutal-overlay',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
])

export const sectionHeaderVariants = cva([
    'flex flex-col space-y-2 pb-4 border-b-3 border-brutal',
])

export const sectionFooterVariants = cva([
    'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 border-t-3 border-brutal',
])

export const CLOSE_BUTTON_BASE_CLASSES = [
    'h-8 w-8 flex items-center justify-center',
    'border-3 border-brutal bg-brutal-bg text-brutal-fg',
    'shadow-brutal-sm',
    'transition-all duration-150',
    'hover:bg-brutal-destructive hover:text-brutal-fg',
    brutalPress,
    FOCUS_OUTLINE_CLASSES,
]

// 关闭按钮的定位类：dialog 与 sheet-right 均为右上角，抽取后单一来源，避免调整时漏改
const CLOSE_BUTTON_TOP_RIGHT = 'absolute right-4 top-4'
const CLOSE_BUTTON_TOP_LEFT = 'absolute left-4 top-4'

// brutalPress 为按压反馈（active:translate-y + 去阴影），motion 变体仅追加 hover 位移/阴影。
// 按下瞬间 active 规则整体接管 translate（y 从 hover 的 -0.5 跳到 2px）是有意的粗野风按压反馈，
// 与 hover 悬浮位移各自绑定伪类，互不覆盖，勿移除 brutalPress 或合并进 motion 变体。
export const modalCloseButtonVariants = cva(CLOSE_BUTTON_BASE_CLASSES, {
    variants: {
        placement: {
            dialog: CLOSE_BUTTON_TOP_RIGHT,
            'sheet-left': CLOSE_BUTTON_TOP_LEFT,
            'sheet-right': CLOSE_BUTTON_TOP_RIGHT,
        },
        motion: {
            default: brutalHoverLift,
            sm: brutalHoverLiftSm,
        },
    },
    defaultVariants: {
        placement: 'dialog',
        motion: 'default',
    },
})

export const baseModalContentClasses = [
    'bg-brutal-bg',
    'border-3 border-brutal',
    'shadow-brutal-xl',
    'rounded-brutal',
]
