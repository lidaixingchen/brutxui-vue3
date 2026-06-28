import { cva } from 'class-variance-authority'

export const labelVariants = cva(
    [
        'font-bold tracking-wide',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    ],
    {
        variants: {
            variant: {
                default: 'text-brutal-fg',
                error: 'text-brutal-destructive',
                success: 'text-brutal-success',
                muted: 'text-brutal-muted-foreground',
            },
            size: {
                sm: 'text-xs leading-none',
                default: 'text-sm leading-none',
                lg: 'text-base leading-none',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
