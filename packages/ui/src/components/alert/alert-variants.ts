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
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
                success: 'bg-brutal-success text-brutal-success-foreground',
                warning: 'bg-brutal-accent text-brutal-accent-foreground',
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground',
                info: 'bg-brutal-info text-brutal-info-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
