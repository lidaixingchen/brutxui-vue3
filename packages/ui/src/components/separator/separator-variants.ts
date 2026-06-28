import { cva } from 'class-variance-authority'

const separatorColorVariants = {
    default: 'bg-brutal-fg',
    primary: 'bg-brutal-primary',
    muted: 'bg-brutal-muted',
}

const separatorSizeVariants = {
    sm: '[--sep-thickness:2px]',
    default: '[--sep-thickness:var(--brutal-border-width,3px)]',
    lg: '[--sep-thickness:5px]',
}

export const separatorVariants = cva('shrink-0', {
    variants: {
        variant: separatorColorVariants,
        size: separatorSizeVariants,
        orientation: {
            horizontal: 'h-[var(--sep-thickness,3px)] w-full',
            vertical: 'h-full w-[var(--sep-thickness,3px)]',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        orientation: 'horizontal',
    },
})

export const separatorLineVariants = cva('flex-1 h-[var(--sep-thickness,3px)]', {
    variants: {
        variant: separatorColorVariants,
        size: separatorSizeVariants,
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})
