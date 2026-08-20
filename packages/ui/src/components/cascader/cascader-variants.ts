import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const cascaderTriggerVariants = cva(
    [
        'flex w-full items-center justify-between px-4 py-2',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal rounded-brutal',
        'font-bold placeholder:text-brutal-placeholder',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        FOCUS_RING_CLASSES,
        'focus:shadow-brutal-lg focus:-translate-x-0.5 focus:-translate-y-0.5',
        brutalPress,
        'disabled:cursor-not-allowed disabled:opacity-50',
        // 限定到首个文本 span：line-clamp 会设置 display:-webkit-box，若命中图标容器
        // span（flex 布局）会覆盖其 display，导致图标被裁剪/布局异常
        '[&>span:first-child]:line-clamp-1',
    ],
    {
        variants: {
            size: {
                sm: 'h-9 text-xs',
                default: 'h-11 text-sm',
                lg: 'h-14 text-base',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const cascaderContentVariants = cva(
    [
        'relative z-dropdown overflow-hidden',
        ...brutalFloatingSurfaceClasses,
        ...floatingContentAnimationClasses,
    ]
)

export const cascaderItemVariants = cva(
    [
        'flex items-center justify-between w-full cursor-pointer select-none px-3 py-2 text-sm font-semibold rounded-brutal transition-all duration-150',
        'border-3 border-transparent',
        'disabled:pointer-events-none disabled:opacity-50',
    ],
    {
        variants: {
            active: {
                true: 'bg-brutal-muted text-brutal-fg border-brutal',
                false: '',
            },
            selected: {
                true: 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal',
                false: 'hover:bg-brutal-muted hover:text-brutal-fg',
            },
            trail: {
                true: 'bg-brutal-primary/15 font-bold',
                false: '',
            },
        },
        defaultVariants: {
            active: false,
            selected: false,
            trail: false,
        },
    }
)
