import { cva } from 'class-variance-authority'

export const alertVariants = cva(
    [
        'relative w-full p-4',
        'border-3 border-brutal',
        'shadow-brutal',
        '[&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
        '[&>svg]:h-5 [&>svg]:w-5 [&>svg]:stroke-[2.5]',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                primary: 'bg-brutal-primary text-black',
                secondary: 'bg-brutal-secondary text-black',
                success: 'bg-brutal-success text-black',
                warning: 'bg-brutal-accent text-black',
                danger: 'bg-brutal-destructive text-white',
                info: 'bg-[var(--brutal-info,#4A90D9)] text-white',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
