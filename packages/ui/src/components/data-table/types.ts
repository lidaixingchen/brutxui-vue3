import type { VNode, Component } from 'vue'

export interface DataTableVirtualScroll {
    enabled?: boolean
    rowHeight?: number
    overscan?: number
    threshold?: number
}

export interface DataTableColumn<T> {
    id: string
    header: string | ((column: DataTableColumn<T>) => string)
    accessorKey?: keyof T
    accessorFn?: (row: T) => unknown
    cell?: (props: { row: T; value: unknown }) => VNode | string
    sortable?: boolean
    filterable?: boolean
    resizable?: boolean
    hidden?: boolean
    width?: number | 'auto'
    minWidth?: number
    maxWidth?: number
    align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T extends Record<string, unknown>> {
    data: T[]
    columns: DataTableColumn<T>[]
    sortable?: boolean
    filterable?: boolean
    selectable?: boolean
    resizable?: boolean
    paginated?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
    loading?: boolean
    emptyMessage?: string
    rowKey: keyof T | ((row: T) => string | number)
    virtualScroll?: DataTableVirtualScroll
    class?: string
}

export interface DataTableSortState {
    column: string
    direction: 'asc' | 'desc' | null
}

export interface DataTableFilterState {
    global?: string
    columns: Record<string, unknown>
}

export interface DataTablePaginationState {
    page: number
    pageSize: number
    total: number
}
