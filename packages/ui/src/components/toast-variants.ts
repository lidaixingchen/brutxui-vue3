import { cva } from 'class-variance-authority'

export const toastVariants = cva(
    [
        'pointer-events-auto relative w-full overflow-hidden',
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
                    'bg-brutal-success text-black',
                    'shadow-brutal-lg',
                ],
                error: [
                    'bg-brutal-destructive text-white',
                    'shadow-brutal-lg',
                ],
                warning: [
                    'bg-brutal-accent text-black',
                    'shadow-brutal-lg',
                ],
                info: [
                    'bg-brutal-secondary text-black',
                    'shadow-brutal-lg',
                ],
            },
            size: {
                sm: 'max-w-xs',
                default: 'max-w-sm',
                lg: 'max-w-md',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
