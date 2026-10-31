import { cva } from 'class-variance-authority'

export const menuLayoutVariants = cva('', {
    variants: {
        mode: {
            horizontal: 'flex-row flex-wrap items-center gap-2 w-full',
            vertical: 'flex-col gap-1.5 w-64',
        },
    },
})

export const menuItemLayoutVariants = cva('', {
    variants: {
        horizontal: {
            true: 'min-w-0 max-w-full shrink-0 [overflow-wrap:anywhere]',
            false: '',
        },
    },
})

export const subMenuLayoutVariants = cva('list-none', {
    variants: {
        vertical: {
            true: '',
            false: 'relative max-w-full shrink-0',
        },
    },
})

export const subMenuTitleVariants = cva('flex items-center gap-2', {
    variants: {
        vertical: {
            true: 'truncate',
            false: 'min-w-0 [overflow-wrap:anywhere]',
        },
    },
})

export const subMenuTriggerLayoutVariants = cva('', {
    variants: {
        vertical: {
            true: '',
            false: 'min-w-0 max-w-full [overflow-wrap:anywhere]',
        },
    },
})
