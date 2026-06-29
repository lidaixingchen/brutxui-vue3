import { cva } from 'class-variance-authority'

export const treeSelectTriggerVariants = cva(
    [
        'flex items-center justify-between w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg font-semibold',
        'transition-all duration-150',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
    ],
    {
        variants: {
            size: {
                sm: 'h-8 px-2 text-xs',
                default: 'h-10 px-3 text-sm',
                lg: 'h-12 px-4 text-base',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const treeSelectNodeVariants = cva(
    [
        'flex items-center gap-2 px-2 py-1.5 cursor-pointer select-none',
        'border-3 border-transparent rounded-brutal',
        'text-sm text-brutal-fg font-medium',
        'transition-all duration-150',
        'hover:border-brutal hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0',
    ],
    {
        variants: {
            selected: {
                true: 'bg-brutal-primary border-brutal shadow-brutal',
                false: '', // no-op: unselected state
            },
        },
        defaultVariants: {
            selected: false,
        },
    }
)
