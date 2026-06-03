import { cva } from 'class-variance-authority'

export const card3dVariants = cva(
    [
        'relative',
        'border-3 border-brutal',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'transition-transform duration-200 ease-out',
    ],
    {
        variants: {
            shadow: {
                default: '',
                lg: '',
                xl: '',
            },
        },
        defaultVariants: {
            shadow: 'default',
        },
    }
)

export const card3dShadowVariants = cva(
    [
        'absolute inset-0',
        'border-3 border-brutal',
        'rounded-brutal',
        'bg-brutal-fg',
        'transition-transform duration-200 ease-out',
        '-z-10',
    ]
)
