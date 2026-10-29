import { cva } from 'class-variance-authority'
import { brutalDestructiveTextClasses, brutalSuccessTextClasses } from '@/lib/semantic-text-variants'

export const labelVariants = cva(
    [
        'font-bold tracking-wide',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    ],
    {
        variants: {
            variant: {
                default: 'text-brutal-fg',
                error: brutalDestructiveTextClasses,
                success: brutalSuccessTextClasses,
                muted: 'text-brutal-muted-foreground',
            },
            size: {
                sm: 'text-xs leading-none',
                default: 'text-sm leading-none',
                lg: 'text-base leading-none',
            },
            disabled: {
                true: 'cursor-not-allowed opacity-70',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            disabled: false,
        },
    }
)
