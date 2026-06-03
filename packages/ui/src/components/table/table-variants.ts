import { cva } from 'class-variance-authority'

export const tableVariants = cva(
    [
        'w-full caption-bottom text-sm',
        'border-3 border-brutal',
    ]
)

export const tableHeaderVariants = cva(
    [
        'text-brutal-fg [&_tr]:border-b-3 [&_tr]:border-brutal',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-accent',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableHeadVariants = cva(
    [
        'h-12 px-4 text-left align-middle font-black tracking-wide text-brutal-fg',
        '[&:has([role=checkbox])]:pr-0',
        'border-r-3 border-brutal last:border-r-0',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-accent',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableFooterVariants = cva(
    [
        'border-t-3 border-brutal font-bold [&>tr]:last:border-b-0',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-secondary',
                primary: 'bg-brutal-primary',
                accent: 'bg-brutal-accent',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableRowVariants = cva(
    [
        'border-b-3 border-brutal transition-colors',
        'hover:bg-brutal-accent/30',
        'data-[state=selected]:bg-brutal-accent',
    ]
)

export const tableCellVariants = cva(
    [
        'p-4 align-middle font-medium',
        '[&:has([role=checkbox])]:pr-0',
        'border-r-3 border-brutal last:border-r-0',
    ]
)
