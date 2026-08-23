import { cva } from 'class-variance-authority'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

/** 工控窗口顶栏容器：muted 底 + 实体粗线与卡身分隔 */
export const cardWindowHeaderVariants = cva(
    [
        'flex items-center justify-between gap-3',
        'border-b-3 border-brutal',
        'bg-brutal-muted',
        'px-4 py-2',
    ],
    {
        variants: {},
        defaultVariants: {},
    },
)

/** 窗口顶栏控制按钮变体（最小化、最大化、关闭等 ASCII 机械按钮） */
export const cardWindowHeaderButtonVariants = cva(
    [
        'inline-flex items-center justify-center',
        'min-h-[22px] px-1.5',
        'font-mono text-xs font-bold uppercase',
        'transition-colors duration-150 cursor-pointer select-none rounded-brutal',
        'active:translate-y-[1px]',
        FOCUS_RING_CLASSES,
    ],
    {
        variants: {
            action: {
                default: 'text-brutal-fg hover:bg-brutal-bg',
                close: 'text-brutal-fg hover:bg-brutal-destructive hover:text-brutal-destructive-foreground',
            },
        },
        defaultVariants: {
            action: 'default',
        },
    },
)

/** 三色微型指示方块（红黄绿，语义令牌着色） */
export const cardWindowHeaderLampVariants = cva(
    ['size-3 border-2 border-brutal transition-all duration-150'],
    {
        variants: {
            interactive: {
                true: ['cursor-pointer hover:scale-110 active:translate-y-[1px]', FOCUS_RING_CLASSES],
                false: 'pointer-events-none',
            },
            color: {
                close: 'bg-brutal-destructive',
                minimize: 'bg-brutal-accent',
                maximize: 'bg-brutal-status-success',
            },
        },
        defaultVariants: {
            interactive: false,
            color: 'close',
        },
    },
)
