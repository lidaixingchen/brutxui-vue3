import { ref, computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { DataTableColumn, DataTableFilterState } from '@/components/data-table/types'

export interface UseDataTableFilterOptions<T extends Record<string, unknown>> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    filterable: MaybeRefOrGetter<boolean | undefined>
}

export function useDataTableFilter<T extends Record<string, unknown>>(
    options: UseDataTableFilterOptions<T>,
) {
    const filterState = ref<DataTableFilterState>({ global: '', columns: {} })

    const visibleColumns = computed(() =>
        toValue(options.columns).filter((col) => !col.hidden),
    )
    const isFilterable = computed(() => toValue(options.filterable) === true)

    function getCellValue(row: T, column: DataTableColumn<T>): unknown {
        if (column.accessorFn) return column.accessorFn(row)
        if (column.accessorKey) return row[column.accessorKey]
        return ''
    }

    function filteredData(data: T[]): T[] {
        if (!isFilterable.value) return data

        let result = [...data]

        if (filterState.value.global) {
            const search = filterState.value.global.toLowerCase()
            result = result.filter((row) =>
                visibleColumns.value.some((col) =>
                    String(getCellValue(row, col)).toLowerCase().includes(search),
                ),
            )
        }

        Object.entries(filterState.value.columns).forEach(([columnId, filterValue]) => {
            if (filterValue === undefined || filterValue === null || filterValue === '') return
            const col = visibleColumns.value.find((c) => c.id === columnId)
            if (!col) return
            result = result.filter((row) =>
                String(getCellValue(row, col)).toLowerCase().includes(String(filterValue).toLowerCase()),
            )
        })

        return result
    }

    return { filterState, filteredData }
}
