import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'

export const selectTriggerVariants = cva(
    [
        'flex w-full items-center justify-between px-4 py-2',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal',
        'font-bold placeholder:text-brutal-placeholder',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        'focus:outline-none focus:shadow-brutal-lg focus:-translate-x-0.5 focus:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:translate-x-0 active:shadow-none', /* 组件私有：特定 X 轴位移重置，不抽取 */
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
                error: 'border-brutal-destructive focus:ring-brutal-destructive',
                success: 'border-brutal-success focus:ring-brutal-success',
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
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
        ...floatingContentAnimationClasses,
    ]
)

export const selectItemVariants = cva(
    [
        'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-3',
        'font-bold outline-none',
        brutalHoverLift,
        brutalPress,
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ],
    {
        variants: {
            variant: {
                default: 'focus:bg-brutal-accent focus:text-brutal-accent-foreground',
                primary: 'focus:bg-brutal-primary focus:text-brutal-primary-foreground',
                secondary: 'focus:bg-brutal-secondary focus:text-brutal-secondary-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
