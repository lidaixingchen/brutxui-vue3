export interface ColumnDef<T extends object = Record<string, unknown>> {
    key: keyof T & string
    label: string
    sortable?: boolean
}

export interface DataTableSectionProps<T extends object = Record<string, unknown>> {
    title?: string
    columns?: ColumnDef<T>[]
    rows?: T[]
    searchable?: boolean
    pageSize?: number
    rowKey?: keyof T & string
    class?: string
}
