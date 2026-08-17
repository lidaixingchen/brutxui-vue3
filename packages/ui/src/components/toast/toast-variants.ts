import { cva } from 'class-variance-authority'

export const toastVariants = cva(
    [
        'pointer-events-auto relative overflow-hidden',
        'border-3 border-brutal',
        'shadow-brutal-lg',
        'transition-all duration-300 ease-out',
        'animate-in slide-in-from-right-full fade-in-0',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg',
                success: 'bg-brutal-success text-brutal-success-foreground',
                error: 'bg-brutal-destructive text-brutal-destructive-foreground',
                warning: 'bg-brutal-accent text-brutal-accent-foreground',
                info: 'bg-brutal-secondary text-brutal-secondary-foreground',
            },
            size: {
                sm: 'w-72 max-w-[calc(100vw-2rem)]',
                default: 'w-80 max-w-[calc(100vw-2rem)]',
                lg: 'w-96 max-w-[calc(100vw-2rem)]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
