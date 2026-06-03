import { cva } from 'class-variance-authority'

export const tabsListVariants = cva(
    [
        'inline-flex items-center justify-center p-1 gap-1',
        'bg-brutal-bg border-3 border-brutal shadow-brutal',
    ],
    {
        variants: {
            size: {
                sm: 'h-9',
                default: 'h-12',
                lg: 'h-14',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const tabsTriggerVariants = cva(
    [
        'inline-flex items-center justify-center whitespace-nowrap px-4 py-2',
        'font-bold text-sm tracking-wide',
        'border-3 border-transparent',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-brutal-fg data-[state=active]:border-brutal data-[state=active]:shadow-brutal-sm',
        'data-[state=inactive]:hover:bg-brutal-muted data-[state=inactive]:shadow-none',
        'hover:shadow-brutal-sm hover:-translate-y-0.5',
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=active]:bg-brutal-accent',
                primary: 'data-[state=active]:bg-brutal-primary',
                secondary: 'data-[state=active]:bg-brutal-secondary',
                success: 'data-[state=active]:bg-brutal-success',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tabsContentVariants = cva(
    [
        'mt-3 p-4',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
    ]
)
