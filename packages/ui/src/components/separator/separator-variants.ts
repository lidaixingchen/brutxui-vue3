import { cva } from 'class-variance-authority'

export const separatorVariants = cva('shrink-0 bg-brutal-fg', {
    variants: {
        orientation: {
            horizontal: 'h-[var(--brutal-border-width,3px)] w-full',
            vertical: 'h-full w-[var(--brutal-border-width,3px)]',
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
})
