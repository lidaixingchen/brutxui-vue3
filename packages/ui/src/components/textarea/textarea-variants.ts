import { cva } from 'class-variance-authority'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const textareaVariants = cva(
    [
        'flex min-h-[100px] w-full',
        'border-3',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'font-medium',
        'placeholder:text-brutal-placeholder placeholder:font-normal',
        'transition-all duration-150',
        FOCUS_RING_CLASSES,
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brutal-muted',
    ],
    {
        variants: {
            variant: {
                default: 'border-brutal focus:shadow-brutal',
                error: 'border-brutal-destructive focus:shadow-brutal-destructive',
                success: 'border-brutal-success focus:shadow-brutal-success',
            },
            size: {
                sm: 'px-3 py-2 text-sm',
                default: 'px-4 py-3 text-base',
                lg: 'px-5 py-4 text-lg',
            },
            resize: {
                none: 'resize-none',
                vertical: 'resize-y',
                horizontal: 'resize-x',
                both: 'resize',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            resize: 'none',
        },
    }
)
