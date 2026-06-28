export interface ColumnDef {
    key: string
    label: string
    sortable?: boolean
}

export interface DataTableSectionProps<T extends object = Record<string, unknown>> {
    title?: string
    columns?: ColumnDef[]
    rows?: T[]
    searchable?: boolean
    pageSize?: number
    rowKey?: string
    class?: string
}
