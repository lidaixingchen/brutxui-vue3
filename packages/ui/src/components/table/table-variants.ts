import { cva } from 'class-variance-authority'

export const tableVariants = cva(
    [
        'w-full caption-bottom text-sm',
        'border-3 border-brutal',
    ]
)

export const tableHeaderVariants = cva(
    [
        '[&_tr]:border-b-3 [&_tr]:border-brutal',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-accent text-brutal-accent-foreground',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableHeadVariants = cva(
    [
        'h-12 px-4 text-left align-middle font-black tracking-wide',
        '[&:has([role=checkbox])]:pr-0',
        'border-r-3 border-brutal last:border-r-0',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-accent text-brutal-accent-foreground',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
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
                default: 'bg-brutal-secondary text-brutal-secondary-foreground',
                primary: 'bg-brutal-primary text-brutal-primary-foreground',
                accent: 'bg-brutal-accent text-brutal-accent-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableRowVariants = cva(
    [
        'border-b-3 border-brutal transition-colors text-brutal-fg',
        'hover:bg-brutal-accent/30',
        'data-[state=selected]:bg-brutal-accent data-[state=selected]:text-brutal-accent-foreground',
    ]
)

export const tableCellVariants = cva(
    [
        'p-4 align-middle font-medium',
        '[&:has([role=checkbox])]:pr-0',
        'border-r-3 border-brutal last:border-r-0',
    ]
)
