import { ref, computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import type { DataTableColumn, DataTableFilterState } from '@/components/data-table/types'
import { getCellValue } from '@/lib/data-table-utils'
import { parseFormattedDate } from '@/lib/date'

export interface UseDataTableFilterOptions<T extends object> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    filterable: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDataTableFilterReturn<T> {
    filterState: Ref<DataTableFilterState>
    filteredData: (data: T[]) => T[]
}

function parseDateValue(value: string | number | Date, endOfDay = false): number | null {
    if (value instanceof Date) {
        const time = value.getTime()
        return Number.isNaN(time) ? null : time
    }

    if (typeof value === 'number') {
        const time = new Date(value).getTime()
        return Number.isNaN(time) ? null : time
    }

    if (typeof value !== 'string') return null

    const text = value.trim()
    if (!text) return null

    const localDate = parseFormattedDate(text, 'YYYY-MM-DD')
    if (localDate) {
        if (endOfDay) {
            localDate.setHours(23, 59, 59, 999)
        }
        return localDate.getTime()
    }

    const time = new Date(text).getTime()
    return Number.isNaN(time) ? null : time
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
                    const filterArr = Array.isArray(filterValue) ? filterValue : []
                    return filterArr.some((item) => String(item) === String(val))
                })
            } else if (col.filterType === 'date-range') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    if (!val) return false
                    const cellDate = parseDateValue(val as string | number | Date)
                    if (cellDate === null) return false

                    let start: number | null = null
                    let end: number | null = null

                    if (Array.isArray(filterValue)) {
                        const s = filterValue[0] as string | null
                        const e = filterValue[1] as string | null
                        start = s ? parseDateValue(s) : null
                        end = e ? parseDateValue(e, true) : null
                    } else if (filterValue && typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                        const obj = filterValue as { start: string | null; end: string | null }
                        start = obj.start ? parseDateValue(obj.start) : null
                        end = obj.end ? parseDateValue(obj.end, true) : null
                    }

                    if (start !== null && cellDate < start) return false
                    if (end !== null && cellDate > end) return false
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
