import { readonly, ref, computed, toValue, type DeepReadonly, type MaybeRefOrGetter, type Ref } from 'vue'
import type { DataTableColumn, DataTableSortState } from '@/types/data-table'
import { getCellValue } from '@/lib/data-table-utils'

export interface UseDataTableSortOptions<T extends object> {
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    sortable: MaybeRefOrGetter<boolean | undefined>
}

export interface UseDataTableSortReturn<T> {
    /** 只读视图：修改请经 toggleSort */
    sortState: DeepReadonly<Ref<DataTableSortState>>
    toggleSort: (columnId: string) => void
    sortedData: (data: T[]) => T[]
}

export function useDataTableSort<T extends object>(
    options: UseDataTableSortOptions<T>,
): UseDataTableSortReturn<T> {
    const { sortState, toggleSort, sortedData } = useDataTableSortModel(options)
    return { sortState, toggleSort, sortedData }
}

export function useDataTableSortModel<T extends object>(options: UseDataTableSortOptions<T>) {
    const sortState = ref<DataTableSortState>({ column: '', direction: null })
    const sortableColumns = computed(() => {
        const columns = new Map<string, DataTableColumn<T>>()
        if (toValue(options.sortable) === true) {
            for (const column of toValue(options.columns)) {
                if (!column.hidden && column.sortable !== false) columns.set(column.id, column)
            }
        }
        return columns
    })

    function canSortColumn(columnId: string): boolean {
        return sortableColumns.value.has(columnId)
    }

    const activeSort = computed(() => {
        const { column, direction } = sortState.value
        if (!column || !direction) return null
        const definition = sortableColumns.value.get(column)
        return definition ? { column: definition, direction } : null
    })

    function toggleSort(columnId: string) {
        if (!canSortColumn(columnId)) return

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

    // 把 number 取原值、Date 取 getTime()，其余类型（含字符串）返回 null，
    // 仅用于两侧都能直接数值化的比较路径
    const toComparableNumber = (value: unknown): number | null => {
        if (typeof value === 'number' && !Number.isNaN(value)) return value
        if (value instanceof Date) {
            const time = value.getTime()
            return Number.isNaN(time) ? null : time
        }
        return null
    }

    // 混合类型比较时把字符串侧解析为数值/时间戳（仅在另一侧是 number/Date 时使用），
    // 避免纯字符串比较被意外改写（如月份名等 Date.parse 可识别的文本）
    const parseStringToNumber = (text: string): number | null => {
        const trimmed = text.trim()
        if (!trimmed) return null
        const num = Number(trimmed)
        if (!Number.isNaN(num)) return num
        const time = Date.parse(trimmed)
        return Number.isNaN(time) ? null : time
    }

    function sortedData(data: T[]): T[] {
        if (!activeSort.value) return data
        const { column, direction } = activeSort.value
        const applyDirection = (comparison: number): number =>
            direction === 'asc' ? comparison : -comparison

        return [...data].sort((a, b) => {
            const valueA = getCellValue(a, column)
            const valueB = getCellValue(b, column)

            // 空值（null/undefined/NaN）统一视为缺失值：无论升序还是降序都排在最后
            // （NaN !== NaN，需先归一化，否则 sort 回调返回 NaN 会导致顺序不可预测）
            const isEmptyA = valueA === null || valueA === undefined
                || (typeof valueA === 'number' && Number.isNaN(valueA))
            const isEmptyB = valueB === null || valueB === undefined
                || (typeof valueB === 'number' && Number.isNaN(valueB))
            if (isEmptyA && isEmptyB) return 0
            if (isEmptyA) return 1
            if (isEmptyB) return -1
            if (valueA === valueB) return 0

            const numA = toComparableNumber(valueA)
            const numB = toComparableNumber(valueB)
            if (numA !== null && numB !== null) {
                return applyDirection(numA - numB)
            }

            // 混合类型（一侧为 number/Date、另一侧为字符串）：解析字符串为数值/时间戳后比较，
            // 避免退化为 String(Date) 的 localeCompare（结果无意义且随区域设置变化）
            if (numA !== null || numB !== null) {
                const strSide = numA === null ? valueA : valueB
                const numSide = numA !== null ? numA : numB
                // 此分支下 numSide 必不为 null
                if (numSide !== null && typeof strSide === 'string') {
                    const strNum = parseStringToNumber(strSide)
                    if (strNum !== null) {
                        const comparison = numA !== null ? numSide - strNum : strNum - numSide
                        return applyDirection(comparison)
                    }
                }
                // 字符串无法解析时的确定兜底：number/Date 恒排在纯字符串之前（方向不改变类别顺序）
                return numA !== null ? -1 : 1
            }

            // 纯字符串兜底
            const strA = String(valueA)
            const strB = String(valueB)
            return applyDirection(strA.localeCompare(strB, undefined, { numeric: true }))
        })
    }

    return { sortState: readonly(sortState), toggleSort, sortedData, canSortColumn, activeSort: readonly(activeSort) }
}
