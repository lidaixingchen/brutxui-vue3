import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
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
        'disabled:cursor-not-allowed disabled:opacity-50',
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
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        ...brutalFloatingSurfaceClasses,
        ...floatingContentAnimationClasses,
    ]
)

export const selectItemVariants = cva(
    [
        'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-3',
        // listbox 项不可聚焦（高亮由 reka Listbox 键盘导航管理），不携带 outline-none
        'font-bold',
        brutalHoverLift,
        brutalPress,
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ],
    {
        variants: {
            variant: {
                default: 'data-[highlighted]:bg-brutal-accent data-[highlighted]:text-brutal-accent-foreground',
                primary: 'data-[highlighted]:bg-brutal-primary data-[highlighted]:text-brutal-primary-foreground',
                secondary: 'data-[highlighted]:bg-brutal-secondary data-[highlighted]:text-brutal-secondary-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
