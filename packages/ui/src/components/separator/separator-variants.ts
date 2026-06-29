import { cva } from 'class-variance-authority'

/** CSS variable `--sep-thickness` 的默认 fallback 值 */
export const DEFAULT_THICKNESS = '3px'

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
            horizontal: `h-[var(--sep-thickness,${DEFAULT_THICKNESS})] w-full`,
            vertical: `h-full w-[var(--sep-thickness,${DEFAULT_THICKNESS})]`,
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        orientation: 'horizontal',
    },
})

export const separatorLineVariants = cva(`flex-1 h-[var(--sep-thickness,${DEFAULT_THICKNESS})]`, {
    variants: {
        variant: separatorColorVariants,
        size: separatorSizeVariants,
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})
