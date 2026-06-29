import { cva } from 'class-variance-authority'

export const scrollAreaRootVariants = cva(
    [
        'relative overflow-hidden',
    ],
)

const scrollBarColorVariants = {
    default: 'border-brutal',
    primary: 'border-brutal-primary',
    accent: 'border-brutal-accent',
}

const SCROLL_THICKNESS = {
    sm: '0.5rem',
    default: '0.75rem',
    lg: '1rem',
} as const

const scrollBarSizeVariants = {
    sm: `[--scroll-thickness:${SCROLL_THICKNESS.sm}]`,
    default: `[--scroll-thickness:${SCROLL_THICKNESS.default}]`,
    lg: `[--scroll-thickness:${SCROLL_THICKNESS.lg}]`,
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
                vertical: `h-full w-[var(--scroll-thickness,${SCROLL_THICKNESS.default})] border-l-3 p-[1px]`,
                horizontal: `h-[var(--scroll-thickness,${SCROLL_THICKNESS.default})] flex-col border-t-3 p-[1px]`,
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
