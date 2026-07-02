import { cva } from 'class-variance-authority'
import { inputVariantClasses } from '../input/shared-input-variants'
import { brutalPress } from '@/lib/brutal-interaction-variants'

export const textareaVariants = cva(
    [
        'flex min-h-[100px] w-full',
        'border-3',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'font-medium',
        'placeholder:text-brutal-placeholder placeholder:font-normal',
        'transition-all duration-150',
        'focus:outline-none focus:shadow-brutal',
        'focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        brutalPress,
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brutal-muted',
        'resize-none',
    ],
    {
        variants: {
            variant: inputVariantClasses,
            size: {
                sm: 'px-3 py-2 text-sm',
                default: 'px-4 py-3 text-base',
                lg: 'px-5 py-4 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
