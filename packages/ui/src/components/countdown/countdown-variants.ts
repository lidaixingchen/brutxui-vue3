import { cva } from 'class-variance-authority'

export const countdownVariants = cva(
    'inline-flex flex-col text-brutal-fg',
    {
        variants: {
            variant: {
                default: '',
                card: 'border-3 border-brutal bg-brutal-bg shadow-brutal p-4 rounded-brutal',
                bordered: 'border-3 border-brutal bg-brutal-bg p-4 rounded-brutal',
                subtle: 'border-3 border-brutal bg-brutal-primary-subtle shadow-brutal p-4 rounded-brutal',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
