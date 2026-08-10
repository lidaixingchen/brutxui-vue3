import { ref, readonly, computed, toValue, type DeepReadonly, type MaybeRefOrGetter, type Ref } from 'vue'
import type { DataTableColumn, DataTableFilterState, DataTableFilterValue } from '@/components/data-table/types'
import { getCellValue } from '@/lib/data-table-utils'
import { parseFormattedDate } from '@/lib/date'

export interface UseDataTableFilterOptions<T extends object> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    filterable: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDataTableFilterReturn<T> {
    /** 只读视图：修改请经 setGlobalFilter / setColumnFilter / setFilterState / clearFilters */
    filterState: DeepReadonly<Ref<DataTableFilterState>>
    setGlobalFilter: (value: string) => void
    setColumnFilter: (columnId: string, value: DataTableFilterValue) => void
    setFilterState: (state: DataTableFilterState) => void
    clearFilters: () => void
    filteredData: (data: T[]) => T[]
}

// 把绝对时刻归一化为本地时区"当天 00:00"（endOfDay 时取 23:59:59.999），
// 与 parseFormattedDate('YYYY-MM-DD') 按本地时区解析的边界保持一致，
// 避免非零 UTC 偏移（尤其负偏移）环境下同一日历日被换算成不同绝对时刻导致边界日误排除
function toLocalDayBoundary(ms: number, endOfDay: boolean): number {
    const d = new Date(ms)
    return endOfDay
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime()
        : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime()
}

function parseDateValue(value: string | number | Date, endOfDay = false): number | null {
    // Date/时间戳单元格：归一化为本地当天起点/终点，与字符串边界统一比较
    if (value instanceof Date || typeof value === 'number') {
        const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
        if (Number.isNaN(time)) return null
        return toLocalDayBoundary(time, endOfDay)
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

    // 带时间的字符串（如 2026-01-02T12:00:00）：同样归一化为本地当天，保证同日判定一致
    const time = new Date(text).getTime()
    if (Number.isNaN(time)) return null
    return toLocalDayBoundary(time, endOfDay)
}

export function useDataTableFilter<T extends object>(
    options: UseDataTableFilterOptions<T>,
): UseDataTableFilterReturn<T> {
    const filterState = ref<DataTableFilterState>({ global: '', columns: {} })

    function setGlobalFilter(value: string): void {
        filterState.value = { ...filterState.value, global: value }
    }

    function setColumnFilter(columnId: string, value: DataTableFilterValue): void {
        filterState.value = {
            ...filterState.value,
            columns: { ...filterState.value.columns, [columnId]: value },
        }
    }

    function setFilterState(state: DataTableFilterState): void {
        filterState.value = state
    }

    function clearFilters(): void {
        filterState.value = { global: '', columns: {} }
    }

    const visibleColumns = computed(() =>
        toValue(options.columns).filter((col) => !col.hidden),
    )
    const isFilterable = computed(() => toValue(options.filterable) === true)

    /**
     * 对数据应用全局与列级过滤。
     * 内部不做结果缓存：调用方应通过 computed 包裹复用（如 DataTable.vue），
     * 避免在模板或事件处理器中直接调用造成大数据集下的重复计算。
     */
    function filteredData(data: T[]): T[] {
        if (!isFilterable.value) return data

        let result = [...data]

        // 全局搜索先 trim：纯空白不是有效搜索词，首尾空格也不应导致无法命中
        const global = filterState.value.global?.trim() ?? ''
        if (global) {
            const search = global.toLowerCase()
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
            if (!col) {
                // 列已隐藏/移除：清理残留过滤状态，避免界面过滤指示与实际数据不一致
                delete filterState.value.columns[columnId]
                return
            }

            if (col.filterType === 'select') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    // 单元格值可能是数组（如标签列表），统一归一化为数组做交集判断
                    const cellArr = Array.isArray(val) ? val : [val]
                    return cellArr.some((cell) => String(cell) === String(filterValue))
                })
            } else if (col.filterType === 'multi-select') {
                result = result.filter((row) => {
                    const val = getCellValue(row, col)
                    // filterValue 非数组（异常输入）时视为空过滤条件，直接放行，避免误滤整表
                    const filterArr = Array.isArray(filterValue) ? filterValue : []
                    if (filterArr.length === 0) return true
                    const cellArr = Array.isArray(val) ? val : [val]
                    return filterArr.some((item) =>
                        cellArr.some((cell) => String(cell) === String(item)),
                    )
                })
            } else if (col.filterType === 'date-range') {
                result = result.filter((row) => {
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

                    // start/end 均为空（如用户清空两个日期输入）时空过滤条件直接放行，
                    // 避免"空的过滤条件"反而排除无日期单元格的行
                    if (start === null && end === null) return true

                    const val = getCellValue(row, col)
                    if (!val) return false
                    const cellDate = parseDateValue(val as string | number | Date)
                    if (cellDate === null) return false

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

    return {
        filterState: readonly(filterState),
        setGlobalFilter,
        setColumnFilter,
        setFilterState,
        clearFilters,
        filteredData,
    }
}
