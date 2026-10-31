import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import { collectionItemVariants } from '@/lib/collection-item-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const selectTriggerVariants = cva(
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
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0',
        '[&>span]:line-clamp-1',
    ],
    {
        variants: {
            size: {
                sm: 'h-9',
                default: 'h-11',
                lg: 'h-14',
            },
            variant: {
                default: '',
                error: 'border-brutal-destructive focus-visible:ring-brutal-destructive',
                success: 'border-brutal-success focus-visible:ring-brutal-success',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const selectContentVariants = cva(
    [
        'relative z-dropdown max-h-96 min-w-[8rem] overflow-hidden',
        ...brutalFloatingSurfaceClasses,
        ...floatingContentAnimationClasses,
    ]
)

export const selectItemVariants = cva(
    [
        'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-3',
        // Reka 管理选项导航，共享行样式读取其高亮与真实可见焦点状态
        'font-bold',
    ],
    {
        variants: {
            variant: {
                default: collectionItemVariants(),
                primary: collectionItemVariants({ variant: 'primary' }),
                secondary: collectionItemVariants({ variant: 'secondary' }),
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
