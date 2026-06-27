import { cva } from 'class-variance-authority'

export const typewriterTextVariants = cva(
    [
        'inline-block',
    ],
    {
        variants: {
            size: {
                sm: 'text-sm',
                default: 'text-base',
                lg: 'text-lg',
                xl: 'text-xl',
                '2xl': 'text-2xl',
            },
            weight: {
                normal: 'font-normal',
                medium: 'font-medium',
                bold: 'font-bold',
                black: 'font-black',
            },
        },
        defaultVariants: {
            size: 'default',
            weight: 'normal',
        },
    }
)
