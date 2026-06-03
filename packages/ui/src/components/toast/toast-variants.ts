import { cva } from 'class-variance-authority'

export const toastVariants = cva(
    [
        'pointer-events-auto relative overflow-hidden',
        'border-3 border-brutal',
        'transition-all duration-300 ease-out',
        'animate-in slide-in-from-right-full fade-in-0',
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-brutal-bg text-brutal-fg',
                    'shadow-brutal-lg',
                ],
                success: [
                    'bg-brutal-success text-brutal-fg',
                    'shadow-brutal-lg',
                ],
                error: [
                    'bg-brutal-destructive text-brutal-fg',
                    'shadow-brutal-lg',
                ],
                warning: [
                    'bg-brutal-accent text-brutal-fg',
                    'shadow-brutal-lg',
                ],
                info: [
                    'bg-brutal-secondary text-brutal-fg',
                    'shadow-brutal-lg',
                ],
            },
            size: {
                sm: 'w-72',
                default: 'w-80',
                lg: 'w-96',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
