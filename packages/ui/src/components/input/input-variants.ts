import { cva } from 'class-variance-authority'
import { inputVariantClasses } from './shared-input-variants'
import { brutalPress } from '@/lib/brutal-interaction-variants'

export const inputVariants = cva(
    [
        'flex w-full',
        'border-3',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'font-medium',
        'placeholder:text-brutal-placeholder placeholder:font-normal',
        'transition-all duration-150',
        'focus:outline-none focus:shadow-brutal',
        'focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2 focus-visible:shadow-brutal-lg',
        brutalPress,
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brutal-muted',
    ],
    {
        variants: {
            variant: inputVariantClasses,
            size: {
                sm: 'h-9 px-3 py-1 text-sm',
                default: 'h-11 px-4 py-2 text-base',
                lg: 'h-14 px-5 py-3 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
