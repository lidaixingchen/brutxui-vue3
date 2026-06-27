import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types'

export interface UseDataTableSortOptions<T extends Record<string, unknown>> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    sortable: MaybeRefOrGetter<boolean | undefined>
}

export function useDataTableSort<T extends Record<string, unknown>>(
    options: UseDataTableSortOptions<T>,
) {
    const sortState = ref<DataTableSortState>({ column: '', direction: null })

    const visibleColumns = computed(() =>
        toValue(options.columns).filter((col) => !col.hidden),
    )
    const isSortable = computed(() => toValue(options.sortable) === true)

    function toggleSort(columnId: string) {
        if (!isSortable.value) return
        const col = visibleColumns.value.find((c) => c.id === columnId)
        if (!col || col.sortable === false) return

        if (sortState.value.column === columnId) {
            if (sortState.value.direction === 'asc') {
                sortState.value = { column: columnId, direction: 'desc' }
            } else if (sortState.value.direction === 'desc') {
                sortState.value = { column: '', direction: null }
            } else {
                sortState.value = { column: columnId, direction: 'asc' }
            }
        } else {
            sortState.value = { column: columnId, direction: 'asc' }
        }
    }

    function getCellValue(row: T, column: DataTableColumn<T>): unknown {
        if (column.accessorFn) return column.accessorFn(row)
        if (column.accessorKey) return row[column.accessorKey]
        return ''
    }

    function sortedData(data: T[]): T[] {
        if (!sortState.value.column || !sortState.value.direction) return data
        const col = visibleColumns.value.find((c) => c.id === sortState.value.column)
        if (!col) return data

        return [...data].sort((a, b) => {
            const valueA = getCellValue(a, col)
            const valueB = getCellValue(b, col)
            if (valueA === valueB) return 0
            if (valueA === null || valueA === undefined) return 1
            if (valueB === null || valueB === undefined) return -1

            if (valueA instanceof Date && valueB instanceof Date) {
                const comparison = valueA.getTime() - valueB.getTime()
                return sortState.value.direction === 'asc' ? comparison : -comparison
            }

            const comparison = valueA < valueB ? -1 : 1
            return sortState.value.direction === 'asc' ? comparison : -comparison
        })
    }

    return { sortState, toggleSort, sortedData }
}
