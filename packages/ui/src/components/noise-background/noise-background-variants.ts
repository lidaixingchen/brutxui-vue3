import { cva } from 'class-variance-authority'

export const noiseBackgroundVariants = cva(
    [
        'relative overflow-hidden',
    ],
    {
        variants: {
            rounded: {
                none: 'rounded-none',
                default: 'rounded-brutal',
                lg: 'rounded-brutal-lg',
                full: 'rounded-full',
            },
        },
        defaultVariants: {
            rounded: 'none',
        },
    }
)
