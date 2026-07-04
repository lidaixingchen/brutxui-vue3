import { cva } from 'class-variance-authority'
import { brutalHoverLift } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'

export const cascaderTriggerVariants = cva(
    [
        'flex w-full items-center justify-between px-4 py-2',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal rounded-brutal',
        'font-bold placeholder:text-brutal-placeholder',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        'focus:outline-none focus:shadow-brutal-lg focus:-translate-x-0.5 focus:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:translate-x-0 active:shadow-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>span]:line-clamp-1',
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
        'relative z-50 overflow-hidden',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
        ...floatingContentAnimationClasses,
    ]
)

export const cascaderItemVariants = cva(
    [
        'flex items-center justify-between w-full cursor-pointer select-none px-3 py-2 text-sm font-semibold rounded-brutal transition-all duration-150 outline-none',
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
        },
        defaultVariants: {
            active: false,
            selected: false,
        },
    }
)
