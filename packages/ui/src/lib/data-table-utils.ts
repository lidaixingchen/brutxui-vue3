import type { DataTableColumn } from '@/components/data-table/types'

export function getCellValue<T extends object>(row: T, column: DataTableColumn<T>): unknown {
    if (column.accessorFn) return column.accessorFn(row)
    if (column.accessorKey) return row[column.accessorKey]
    return ''
}
