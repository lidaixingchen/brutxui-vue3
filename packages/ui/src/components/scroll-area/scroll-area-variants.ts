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
        /* 防滑凹槽抓取纹理：底色细线挖槽叠加在前景色滑块上；拖拽吸附高亮（内嵌黑环） */
        'bg-[image:repeating-linear-gradient(90deg,var(--brutal-bg,#ffffff)_0px,var(--brutal-bg,#ffffff)_2px,transparent_2px,transparent_5px)]',
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
