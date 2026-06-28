import { cva } from 'class-variance-authority'

export const radioGroupItemVariants = cva(
    [
        'peer aspect-square',
        'border-3 border-brutal bg-brutal-bg text-brutal-fg',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=checked]:bg-brutal-primary',
                secondary: 'data-[state=checked]:bg-brutal-secondary',
                accent: 'data-[state=checked]:bg-brutal-accent',
                success: 'data-[state=checked]:bg-brutal-success',
                danger: 'data-[state=checked]:bg-brutal-destructive',
            },
            size: {
                sm: 'h-5 w-5',
                default: 'h-6 w-6',
                lg: 'h-7 w-7',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
