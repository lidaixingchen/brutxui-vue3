import { cva } from 'class-variance-authority'

export const SCROLL_THICKNESS = {
    sm: '0.5rem',
    default: '0.75rem',
    lg: '1rem',
} as const

const scrollBarSizeVariants = {
    sm: '[--scroll-thickness:0.5rem]',
    default: '[--scroll-thickness:0.75rem]',
    lg: '[--scroll-thickness:1rem]',
}

export const scrollAreaRootVariants = cva('relative overflow-hidden', {
    variants: { size: scrollBarSizeVariants },
    defaultVariants: { size: 'default' },
})

const scrollBarColorVariants = {
    default: 'border-brutal bg-brutal-bg',
    primary: 'border-brutal-primary bg-brutal-primary',
    accent: 'border-brutal-accent bg-brutal-accent',
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
                vertical: 'h-full w-[var(--scroll-thickness,0.75rem)] border-s-3 p-[1px]',
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
    primary: 'bg-brutal-primary-foreground',
    accent: 'bg-brutal-accent-foreground',
}

export const scrollAreaThumbVariants = cva(
    [
        'relative flex-1 rounded-brutal transition-opacity',
        'hover:opacity-80 active:opacity-100',
        'active:ring-2 active:ring-brutal-ring active:ring-inset',
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
