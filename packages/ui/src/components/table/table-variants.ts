import { cva } from 'class-variance-authority'

const headerColorVariants = {
    default: 'bg-brutal-accent text-brutal-accent-foreground',
    primary: 'bg-brutal-primary text-brutal-primary-foreground',
    secondary: 'bg-brutal-secondary text-brutal-secondary-foreground',
} as const

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
            variant: headerColorVariants,
            /* 表头底纹：工程制图剖面线 / 报刊点阵（叠加在配色之上） */
            texture: {
                none: '',
                hatch: 'bg-pattern-hatch',
                dots: 'bg-pattern-dots',
            },
        },
        defaultVariants: {
            variant: 'default',
            texture: 'none',
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
            variant: headerColorVariants,
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tableBodyVariants = cva(
    [
        '[&>tr:last-child]:border-0',
        '[&>tr:nth-child(even)]:bg-brutal-muted',
    ]
)

export const tableFooterVariants = cva(
    [
        'border-t-3 border-brutal font-bold [&>tr:last-child]:border-b-0',
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
        'hover:bg-brutal-muted',
        /* 选中行：荧光色块 + 粗黑框选（ring-inset 黑环），accent 黄底黑字对比度满足 AA */
        'data-[state=selected]:bg-brutal-accent data-[state=selected]:text-brutal-fg',
        'data-[state=selected]:ring-2 data-[state=selected]:ring-brutal-ring data-[state=selected]:ring-inset',
    ]
)

export const tableCellVariants = cva(
    [
        'p-4 align-middle font-medium',
        '[&:has([role=checkbox])]:pr-0',
        'border-r-3 border-brutal last:border-r-0',
    ]
)

export const tableCaptionVariants = cva(
    [
        'mt-4 text-sm font-bold text-brutal-muted-foreground',
    ]
)
