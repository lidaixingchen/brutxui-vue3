import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
    [
        'inline-flex items-center',
        'border-3 border-brutal',
        'rounded-brutal',
        'font-bold tracking-wide',
        'transition-colors',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg shadow-brutal-sm',
                primary: 'bg-brutal-primary text-brutal-primary-foreground shadow-brutal-sm',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground shadow-brutal-sm',
                accent: 'bg-brutal-accent text-brutal-accent-foreground shadow-brutal-sm',
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground shadow-brutal-sm',
                success: 'bg-brutal-success text-brutal-success-foreground shadow-brutal-sm',
                outline: 'bg-transparent text-brutal-fg',
            },
            size: {
                sm: 'px-2 py-0.5 text-xs',
                default: 'px-3 py-1 text-sm',
                lg: 'px-4 py-1.5 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
