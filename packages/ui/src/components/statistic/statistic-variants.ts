import { cva } from 'class-variance-authority'

export const statisticVariants = cva(
    'inline-flex flex-col text-brutal-fg',
    {
        variants: {
            variant: {
                default: '',
                card: 'border-3 border-brutal bg-brutal-bg shadow-brutal p-4 rounded-brutal',
                bordered: 'border-3 border-brutal bg-brutal-bg p-4 rounded-brutal',
                subtle: 'border-3 border-brutal bg-brutal-primary-subtle shadow-brutal p-4 rounded-brutal',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const statisticTitleVariants = cva(
    'font-bold tracking-wider uppercase text-brutal-muted-foreground select-none',
    {
        variants: {
            size: {
                sm: 'text-xs mb-0.5',
                default: 'text-sm mb-1',
                lg: 'text-base mb-1.5',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const statisticContentVariants = cva(
    'inline-flex items-baseline gap-1.5 font-bold',
    {
        variants: {
            size: {
                sm: 'text-lg',
                default: 'text-2xl',
                lg: 'text-4xl',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const statisticValueVariants = cva(
    'font-black font-mono tracking-tight text-brutal-fg',
    {
        variants: {
            size: {
                sm: 'text-2xl',
                default: 'text-3xl sm:text-4xl',
                lg: 'text-4xl sm:text-5xl',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const statisticTrendVariants = cva(
    'inline-flex items-center gap-0.5 font-bold',
    {
        variants: {
            trend: {
                up: 'text-brutal-success',
                down: 'text-brutal-destructive',
            },
            size: {
                sm: 'text-xs',
                default: 'text-sm',
                lg: 'text-base',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)
