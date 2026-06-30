import type { VNode } from 'vue'

/**
 * header 回调的上下文类型（不含 T，打破递归逆变）
 */
export interface DataTableColumnHeaderContext {
    /** 当前列的 ID */
    id: string
    /** 当前列是否可排序 */
    sortable?: boolean
    /** 当前列的排序方向（null 表示未排序） */
    direction?: 'asc' | 'desc' | null
    /** 当前列的 accessorKey（如果有） */
    accessorKey?: PropertyKey
    /** 当前列的对齐方式 */
    align?: 'left' | 'center' | 'right'
}

export interface DataTableVirtualScroll {
    enabled?: boolean
    rowHeight?: number
}

export interface DataTableColumn<T extends object = Record<string, unknown>> {
    id: string
    /** 函数签名已更新：回调参数从 DataTableColumn<T> 改为 DataTableColumnHeaderContext */
    header: string | ((ctx: DataTableColumnHeaderContext) => string)
    accessorKey?: keyof T & string
    accessorFn?: (row: T) => unknown
    cell?: (props: { row: T; value: unknown }) => VNode | string
    sortable?: boolean
    hidden?: boolean
    width?: number | 'auto'
    minWidth?: number
    maxWidth?: number
    align?: 'left' | 'center' | 'right'
    /** 固定列方向 */
    fixed?: 'left' | 'right'
    /** 列类型 */
    type?: 'default' | 'expand'
}

export interface DataTableSpanMethodParams<T extends object = Record<string, unknown>> {
    row: T
    column: DataTableColumn<T>
    rowIndex: number
    columnIndex: number
}

export interface DataTableProps<T extends object> {
    data: T[]
    columns: DataTableColumn<T>[]
    sortable?: boolean
    filterable?: boolean
    selectable?: boolean
    paginated?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
    loading?: boolean
    emptyMessage?: string
    rowKey: keyof T | ((row: T) => string | number)
    virtualScroll?: DataTableVirtualScroll
    size?: 'sm' | 'default' | 'lg'
    dense?: boolean
    striped?: boolean
    stickyHeader?: boolean
    /** 是否启用展开行 */
    expandable?: boolean
    /** 控制展开的行 */
    expandRowKeys?: Set<string | number>
    /** 合并单元格方法 */
    spanMethod?: (params: DataTableSpanMethodParams<T>) => [number, number] | void
    class?: string
}

export interface DataTableSortState {
    column: string
    direction: 'asc' | 'desc' | null
}

export interface DataTableFilterState {
    global?: string
    columns: Record<string, string>
}

export interface DataTablePaginationState {
    page: number
    pageSize: number
    total: number
}
