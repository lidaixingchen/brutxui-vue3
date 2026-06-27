import { cva } from 'class-variance-authority'

export const dataTableRootVariants = cva(
    [
        'w-full border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal-lg relative',
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
    },
)

export const dataTableHeaderVariants = cva(
    [
        'border-b-3 border-brutal',
        'bg-brutal-muted',
        'font-black',
    ],
)

export const dataTableHeadVariants = cva(
    [
        'px-4 py-3 text-left',
        'first:border-l-0',
    ],
    {
        variants: {
            sortable: {
                true: 'cursor-pointer select-none hover:bg-brutal-accent/40 active:translate-y-[var(--brutal-pressed-offset,2px)] active:bg-brutal-accent',
                false: '',
            },
            align: {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right',
            },
            active: {
                true: 'bg-brutal-accent',
                false: '',
            },
        },
        defaultVariants: {
            sortable: false,
            align: 'left',
            active: false,
        },
    },
)

export const dataTableBodyVariants = cva([])

export const dataTableRowVariants = cva(
    [
        'transition-colors duration-150',
        'hover:bg-brutal-muted',
    ],
    {
        variants: {
            selected: {
                true: 'bg-brutal-primary text-brutal-primary-foreground',
                false: '',
            },
            striped: {
                true: 'even:bg-brutal-muted/50',
                false: '',
            },
        },
        defaultVariants: {
            selected: false,
            striped: true,
        },
    },
)

export const dataTableCellVariants = cva(
    [
        'px-4 py-3',
    ],
    {
        variants: {
            align: {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right',
            },
            size: {
                sm: 'py-2',
                default: 'py-3',
                lg: 'py-4',
            },
            dense: {
                true: 'py-1.5',
                false: '',
            },
            active: {
                true: 'bg-brutal-accent/20',
                false: '',
            },
        },
        defaultVariants: {
            align: 'left',
            size: 'default',
            dense: false,
            active: false,
        },
    },
)

export const dataTableFooterVariants = cva(
    [
        'border-t-3 border-brutal',
        'bg-brutal-muted',
        'px-4 py-3',
    ],
)

export const dataTableToolbarVariants = cva(
    [
        'flex items-center justify-between gap-4 p-4',
        'border-b-3 border-brutal',
        'bg-brutal-bg',
    ],
)

export const dataTablePaginationVariants = cva(
    [
        'flex items-center justify-between gap-4 p-4',
        'border-t-3 border-brutal',
        'bg-brutal-muted',
    ],
)

export const dataTableFilterVariants = cva(
    [
        'flex items-center gap-2',
    ],
)

export const dataTableEmptyVariants = cva(
    [
        'flex flex-col items-center justify-center gap-3',
        'py-12 px-4',
        'text-brutal-fg',
        'border-t-3 border-brutal',
    ],
)

export const dataTableLoadingVariants = cva(
    [
        'absolute inset-0 flex items-center justify-center',
        'bg-brutal-bg',
        'z-10',
    ],
)
