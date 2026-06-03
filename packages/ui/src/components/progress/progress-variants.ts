import { cva } from 'class-variance-authority'

export const progressRootVariants = cva(
    [
        'relative w-full overflow-hidden rounded-brutal',
        'border-3 border-brutal bg-brutal-bg',
        'shadow-brutal-sm',
    ],
    {
        variants: {
            size: {
                sm: 'h-3',
                default: 'h-6',
                lg: 'h-8',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const progressIndicatorVariants = cva(
    [
        'h-full w-full flex-1 transition-all duration-300 ease-out',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
                danger: 'bg-brutal-destructive',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
