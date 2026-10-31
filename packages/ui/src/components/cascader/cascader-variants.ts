import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import { collectionItemVariants } from '@/lib/collection-item-variants'
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
        'aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:shadow-none aria-disabled:hover:translate-x-0 aria-disabled:hover:translate-y-0 aria-disabled:active:translate-x-0 aria-disabled:active:translate-y-0 aria-disabled:active:shadow-none',
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
        collectionItemVariants({ variant: 'default' }),
        'flex w-full cursor-pointer items-center justify-between select-none rounded-brutal border-3 border-transparent px-3 py-2 text-sm font-semibold',
    ],
    {
        variants: {
            active: { true: '', false: '' },
            selected: { true: '', false: '' },
            trail: { true: '', false: '' },
        },
        defaultVariants: {
            active: false,
            selected: false,
            trail: false,
        },
    },
)

export const cascaderSelectionIndicatorVariants = cva(
    'flex h-4 w-4 shrink-0 items-center justify-center',
)

export const cascaderPathIndicatorVariants = cva(
    [
        'h-4 w-4 shrink-0 stroke-3 transition-transform duration-150 motion-reduce:transition-none',
        'data-[active-path]:rotate-90 data-[selected-trail]:rotate-90',
    ],
)
