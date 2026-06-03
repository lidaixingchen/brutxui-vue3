import { cva } from 'class-variance-authority'

export const sliderTrackVariants = cva(
    [
        'relative w-full grow overflow-hidden rounded-brutal',
        'border-3 border-brutal bg-brutal-bg',
        'shadow-brutal-sm',
    ],
    {
        variants: {
            size: {
                sm: 'h-3',
                default: 'h-5',
                lg: 'h-7',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const sliderThumbVariants = cva(
    [
        'block rounded-brutal',
        'border-3 border-brutal',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        'hover:shadow-brutal hover:-translate-y-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'cursor-grab active:cursor-grabbing',
    ],
    {
        variants: {
            size: {
                sm: 'h-4 w-4',
                default: 'h-6 w-6',
                lg: 'h-8 w-8',
            },
            variant: {
                default: 'bg-brutal-accent',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const sliderRangeVariants = cva(
    [
        'absolute h-full',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-secondary',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
