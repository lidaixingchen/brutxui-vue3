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
                    'bg-brutal-success text-brutal-success-foreground',
                    'shadow-brutal-lg',
                ],
                error: [
                    'bg-brutal-destructive text-brutal-destructive-foreground',
                    'shadow-brutal-lg',
                ],
                warning: [
                    'bg-brutal-accent text-brutal-accent-foreground',
                    'shadow-brutal-lg',
                ],
                info: [
                    'bg-brutal-secondary text-brutal-secondary-foreground',
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
