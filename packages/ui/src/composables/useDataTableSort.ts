import { ref, computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types'
import { getCellValue } from '@/lib/data-table-utils'

export interface UseDataTableSortOptions<T extends object> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    sortable: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDataTableSortReturn<T> {
    sortState: Ref<DataTableSortState>
    toggleSort: (columnId: string) => void
    sortedData: (data: T[]) => T[]
}

export function useDataTableSort<T extends object>(
    options: UseDataTableSortOptions<T>,
): UseDataTableSortReturn<T> {
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

            const numericA = typeof valueA === 'number' ? valueA
                : (valueA instanceof Date ? valueA.getTime() : null)
            const numericB = typeof valueB === 'number' ? valueB
                : (valueB instanceof Date ? valueB.getTime() : null)

            if (numericA !== null && numericB !== null) {
                const comparison = numericA - numericB
                return sortState.value.direction === 'asc' ? comparison : -comparison
            }

            const strA = String(valueA)
            const strB = String(valueB)
            const comparison = strA.localeCompare(strB, undefined, { numeric: true })
            return sortState.value.direction === 'asc' ? comparison : -comparison
        })
    }

    return { sortState, toggleSort, sortedData }
}
