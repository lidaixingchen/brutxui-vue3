import { ref, computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { DataTableColumn, DataTableFilterState } from '@/components/data-table/types'
import { getCellValue } from '@/lib/data-table-utils'

export interface UseDataTableFilterOptions<T extends object> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    filterable: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDataTableFilterReturn<T> {
    filterState: Ref<DataTableFilterState>
    filteredData: (data: T[]) => T[]
}

export function useDataTableFilter<T extends object>(
    options: UseDataTableFilterOptions<T>,
): UseDataTableFilterReturn<T> {
    const filterState = ref<DataTableFilterState>({ global: '', columns: {} })

    const visibleColumns = computed(() =>
        toValue(options.columns).filter((col) => !col.hidden),
    )
    const isFilterable = computed(() => toValue(options.filterable) === true)

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
            if (Array.isArray(filterValue) && filterValue.length === 0) return

            const col = visibleColumns.value.find((c) => c.id === columnId)
            if (!col) return

            if (col.filterType === 'select') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    return String(val) === String(filterValue)
                })
            } else if (col.filterType === 'multi-select') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const filterArr = filterValue as any[]
                    return filterArr.some((item) => String(item) === String(val))
                })
            } else if (col.filterType === 'date-range') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    if (!val) return false
                    const cellDate = new Date(val as string | number | Date).getTime()
                    if (isNaN(cellDate)) return false

                    let start: number | null = null
                    let end: number | null = null

                    if (Array.isArray(filterValue)) {
                        start = filterValue[0] ? new Date(filterValue[0]).getTime() : null
                        end = filterValue[1] ? new Date(filterValue[1]).getTime() : null
                    } else if (filterValue && typeof filterValue === 'object') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const obj = filterValue as any
                        start = obj.start ? new Date(obj.start).getTime() : null
                        end = obj.end ? new Date(obj.end).getTime() : null
                    }

                    if (start !== null && !isNaN(start) && cellDate < start) return false
                    if (end !== null && !isNaN(end) && cellDate > end) return false
                    return true
                })
            } else {
                result = result.filter((row) =>
                    String(getCellValue(row, col)).toLowerCase().includes(String(filterValue).toLowerCase()),
                )
            }
        })

        return result
    }

    return { filterState, filteredData }
}
