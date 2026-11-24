import { cva } from 'class-variance-authority'
import { validationBorderColors } from '../input/shared-input-variants'

export const numberInputRootVariants = cva(
    [
        'flex items-stretch border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal overflow-hidden',
        'transition-all duration-150',
        'focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 focus-within:ring-offset-brutal-bg focus-within:outline-hidden focus-within:shadow-brutal-lg',
    ],
    {
        variants: {
            layout: {
                split: '',
                stacked: '',
            },
            variant: {
                default: '',
                error: `${validationBorderColors.error} focus-within:ring-brutal-destructive`,
                success: `${validationBorderColors.success} focus-within:ring-brutal-success`,
            },
        },
        defaultVariants: {
            layout: 'split',
            variant: 'default',
        },
    }
)

export const numberInputButtonVariants = cva(
    [
        'flex items-center justify-center',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
        'hover:bg-brutal-fg hover:text-brutal-bg',
        'active:scale-95 transition-transform',
    ],
    {
        variants: {
            position: {
                decrement: 'bg-brutal-accent text-brutal-accent-foreground',
                increment: 'bg-brutal-primary text-brutal-primary-foreground',
            },
            layout: {
                split: 'shrink-0 border-brutal px-4 @max-3xs/number-input:px-2',
                stacked: 'flex-1 border-brutal',
            },
        },
        compoundVariants: [
            { position: 'decrement', layout: 'split', class: 'border-r-3' },
            { position: 'increment', layout: 'split', class: 'border-l-3' },
            { position: 'decrement', layout: 'stacked', class: 'border-t-3' },
        ],
        defaultVariants: {
            position: 'decrement',
            layout: 'split',
        },
    }
)

export const numberInputFieldVariants = cva(
    [
        'bg-transparent font-black placeholder:text-brutal-placeholder placeholder:font-normal focus:outline-none',
    ],
    {
        variants: {
            layout: {
                split: 'min-w-0 flex-1 px-3 py-2 text-center text-base @max-3xs/number-input:px-1',
                stacked: 'flex-1 min-w-0 py-2 px-4 text-base',
            },
        },
        defaultVariants: {
            layout: 'split',
        },
    }
)
