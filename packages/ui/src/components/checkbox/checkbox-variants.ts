import { cva } from 'class-variance-authority'

export const checkboxVariants = cva(
    [
        'peer shrink-0',
        'border-3 border-brutal',
        'bg-brutal-bg',
        'flex items-center justify-center',
        'transition-all duration-150',
        'shadow-brutal-sm',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=checked]:bg-brutal-success',
                primary: 'data-[state=checked]:bg-brutal-primary',
                secondary: 'data-[state=checked]:bg-brutal-secondary',
                accent: 'data-[state=checked]:bg-brutal-accent',
                danger: 'data-[state=checked]:bg-brutal-destructive',
            },
            size: {
                sm: 'h-5 w-5',
                default: 'h-6 w-6',
                lg: 'h-7 w-7',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const checkboxIndicatorVariants = cva(
    [
        'flex items-center justify-center text-current',
    ],
    {
        variants: {
            size: {
                sm: 'h-3 w-3 stroke-[3]',
                default: 'h-4 w-4 stroke-[3]',
                lg: 'h-5 w-5 stroke-[3]',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)
