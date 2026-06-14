import { cva } from 'class-variance-authority'

export const selectTriggerVariants = cva(
    [
        'flex w-full items-center justify-between px-4 py-2',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal',
        'font-bold placeholder:text-brutal-placeholder',
        'shadow-brutal',
        'transition-all duration-150',
        'focus:outline-none focus:shadow-brutal-lg focus:-translate-x-0.5 focus:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:translate-x-0 active:shadow-none',
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
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const selectContentVariants = cva(
    [
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
    ]
)

export const selectItemVariants = cva(
    [
        'relative flex w-full cursor-pointer select-none items-center py-2 pl-8 pr-3',
        'font-bold outline-none',
        'hover:shadow-brutal-sm',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
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
