import { cva } from 'class-variance-authority'

export const dataTableRootVariants = cva(
    [
        'w-full border-3 border-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal-lg',
    ],
    {
        variants: {
            size: {
                sm: 'text-sm',
                default: 'text-base',
                lg: 'text-lg',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const dataTableHeaderVariants = cva(
    [
        'border-b-3 border-brutal',
        'bg-brutal-muted',
        'font-black',
    ]
)

export const dataTableHeadVariants = cva(
    [
        'px-4 py-3 text-left',
        'border-r-2 border-brutal/20',
        'last:border-r-0',
    ],
    {
        variants: {
            sortable: {
                true: 'cursor-pointer select-none hover:bg-brutal-muted/80',
                false: '',
            },
            align: {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right',
            },
        },
        defaultVariants: {
            sortable: false,
            align: 'left',
        },
    }
)

export const dataTableBodyVariants = cva(
    ['divide-y-2 divide-brutal/10']
)

export const dataTableRowVariants = cva(
    [
        'transition-colors duration-150',
        'hover:bg-brutal-muted/50',
    ],
    {
        variants: {
            selected: {
                true: 'bg-brutal-primary/10',
                false: '',
            },
            striped: {
                true: 'even:bg-brutal-muted/30',
                false: '',
            },
        },
        defaultVariants: {
            selected: false,
            striped: false,
        },
    }
)

export const dataTableCellVariants = cva(
    [
        'px-4 py-3',
        'border-r-2 border-brutal/10',
        'last:border-r-0',
    ],
    {
        variants: {
            align: {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right',
            },
        },
        defaultVariants: {
            align: 'left',
        },
    }
)

export const dataTableFooterVariants = cva(
    [
        'border-t-3 border-brutal',
        'bg-brutal-muted',
        'px-4 py-3',
    ]
)

export const dataTableToolbarVariants = cva(
    [
        'flex items-center justify-between gap-4 p-4',
        'border-b-3 border-brutal',
        'bg-brutal-bg',
    ]
)

export const dataTablePaginationVariants = cva(
    [
        'flex items-center justify-between gap-4 p-4',
        'border-t-3 border-brutal',
        'bg-brutal-muted',
    ]
)

export const dataTableFilterVariants = cva(
    [
        'flex items-center gap-2',
    ]
)

export const dataTableEmptyVariants = cva(
    [
        'flex flex-col items-center justify-center',
        'py-12 text-brutal-fg/50',
    ]
)

export const dataTableLoadingVariants = cva(
    [
        'absolute inset-0 flex items-center justify-center',
        'bg-brutal-bg/80 backdrop-blur-sm',
        'z-10',
    ]
)
