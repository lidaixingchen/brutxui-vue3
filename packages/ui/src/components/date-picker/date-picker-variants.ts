import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const datePickerTriggerVariants = cva(
    [
        'flex items-center justify-between gap-2 w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        brutalPress,
        FOCUS_RING_CLASSES,
        'disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            size: {
                sm: 'h-9 px-3 text-sm',
                default: 'h-11 px-4 text-base',
                lg: 'h-14 px-5 text-lg',
            },
            variant: {
                default: '', // no-op: default border style (base classes)
                error: 'border-brutal-destructive',
                success: 'border-brutal-success',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const datePickerPanelVariants = cva([
    'flex',
    'border-3 border-brutal rounded-brutal',
    'bg-brutal-bg',
    'shadow-brutal-lg',
])

export const datePickerShortcutVariants = cva(
    [
        'w-full px-3 py-2 text-left text-sm font-semibold',
        'text-brutal-fg',
        'cursor-pointer',
        'transition-all duration-100',
        'hover:bg-brutal-muted hover:-translate-x-0.5',
        'active:translate-y-[2px]',
    ],
    {
        variants: {
            active: {
                // 激活态补充 hover:bg-brutal-primary：hover 伪类特异性高于普通类，
                // 若不覆盖，悬停时激活项背景会被基础类的 hover:bg-brutal-muted 压掉
                true: 'bg-brutal-primary text-brutal-primary-foreground hover:bg-brutal-primary hover:text-brutal-primary-foreground',
                false: '', // no-op: inactive state
            },
        },
        defaultVariants: {
            active: false,
        },
    }
)

export const datePickerFooterVariants = cva([
    'flex items-center justify-end gap-2 p-3',
    'border-t-3 border-brutal',
])

export const timePickerPanelVariants = cva(
    ['items-center gap-1 p-2 border-brutal'],
    {
        variants: {
            embedded: {
                true: 'flex border-t-3',
                false: 'inline-flex border-3 rounded-brutal bg-brutal-bg shadow-brutal-lg',
            },
        },
        defaultVariants: {
            embedded: false,
        },
    }
)

export const timePickerTriggerVariants = cva([
    // inline-flex 使 justify-center / gap-0.5 自包含生效，不再依赖被合并进 SelectTrigger 的 flex 容器
    'inline-flex items-center w-12 px-0 justify-center gap-0.5 font-mono text-sm rounded-brutal shadow-brutal-sm',
    'hover:shadow-brutal',
])
