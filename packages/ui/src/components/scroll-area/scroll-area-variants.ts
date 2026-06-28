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

export const scrollAreaScrollbarVariants = cva(
    [
        'flex touch-none select-none transition-colors',
    ],
    {
        variants: {
            orientation: {
                vertical: 'h-full w-3 border-l-3 border-brutal p-[1px]',
                horizontal: 'h-3 flex-col border-t-3 border-brutal p-[1px]',
            },
        },
        defaultVariants: {
            orientation: 'vertical',
        },
    },
)

export const scrollAreaThumbVariants = cva(
    [
        'relative flex-1 bg-brutal-fg',
    ],
)
