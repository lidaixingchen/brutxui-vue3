import { cva } from 'class-variance-authority'

export const scrollAreaRootVariants = cva(
    [
        'relative overflow-hidden',
    ],
)

export const scrollAreaViewportVariants = cva(
    [
        'h-full w-full rounded-[inherit]',
    ],
)

const scrollBarColorVariants = {
    default: 'border-brutal',
    primary: 'border-brutal-primary',
    accent: 'border-brutal-accent',
}

const scrollBarSizeVariants = {
    sm: '[--scroll-thickness:0.5rem]',
    default: '[--scroll-thickness:0.75rem]',
    lg: '[--scroll-thickness:1rem]',
}

export const scrollAreaScrollbarVariants = cva(
    [
        'flex touch-none select-none transition-colors',
    ],
    {
        variants: {
            variant: scrollBarColorVariants,
            size: scrollBarSizeVariants,
            orientation: {
                vertical: 'h-full w-[var(--scroll-thickness,0.75rem)] border-l-3 p-[1px]',
                horizontal: 'h-[var(--scroll-thickness,0.75rem)] flex-col border-t-3 p-[1px]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            orientation: 'vertical',
        },
    },
)

const scrollBarThumbColorVariants = {
    default: 'bg-brutal-fg',
    primary: 'bg-brutal-primary',
    accent: 'bg-brutal-accent',
}

export const scrollAreaThumbVariants = cva(
    [
        'relative flex-1',
    ],
    {
        variants: {
            variant: scrollBarThumbColorVariants,
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)
