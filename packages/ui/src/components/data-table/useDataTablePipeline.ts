import { computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { DataTableColumn, DataTableFilterState, DataTableFilterValue } from '@/types/data-table'
import { useDataTableFilter, type UseDataTableFilterReturn } from '@/composables/useDataTableFilter'
import { useDataTableSort, type UseDataTableSortReturn } from '@/composables/useDataTableSort'
import { useDataTablePagination, type UseDataTablePaginationReturn } from '@/composables/useDataTablePagination'
import { useDataTableSelection, type UseDataTableSelectionReturn } from '@/composables/useDataTableSelection'

export interface UseDataTablePipelineOptions<T extends object> {
    data: MaybeRefOrGetter<T[]>
    columns: MaybeRefOrGetter<DataTableColumn<T>[]>
    rowKey: MaybeRefOrGetter<keyof T | ((row: T) => string | number)>
    sortable?: MaybeRefOrGetter<boolean | undefined>
    filterable?: MaybeRefOrGetter<boolean | undefined>
    selectable?: MaybeRefOrGetter<boolean | undefined>
    paginated?: MaybeRefOrGetter<boolean | undefined>
    pageSize?: MaybeRefOrGetter<number | undefined>
}

export interface UseDataTablePipelineReturn<T extends object> {
    displayData: ComputedRef<T[]>
    filteredData: ComputedRef<T[]>
    sortedData: ComputedRef<T[]>
    totalFilteredItems: ComputedRef<number>
    activeColumnId: ComputedRef<string | null>
    filter: UseDataTableFilterReturn<T>
    sort: UseDataTableSortReturn<T>
    pagination: UseDataTablePaginationReturn
    selection: UseDataTableSelectionReturn<T>
    applyColumnFilterPatch: (patch: DataTableFilterState) => void
}

function isFilterValueEmpty(value: DataTableFilterValue): boolean {
    if (value === null || value === undefined || value === '') return true
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') {
        const range = value as { start?: string | null; end?: string | null }
        return !range.start && !range.end
    }
    return false
}

export function useDataTablePipeline<T extends object>(
    options: UseDataTablePipelineOptions<T>,
): UseDataTablePipelineReturn<T> {
    const rawData = computed(() => toValue(options.data) ?? [])

    const filter = useDataTableFilter<T>({
        columns: () => toValue(options.columns),
        filterable: () => toValue(options.filterable),
    })

    const filteredData = computed(() => filter.filteredData(rawData.value))
    const totalFilteredItems = computed(() => filteredData.value.length)

    const sort = useDataTableSort<T>({
        columns: () => toValue(options.columns),
        sortable: () => toValue(options.sortable),
    })

    const sortedData = computed(() => sort.sortedData(filteredData.value))

    const pagination = useDataTablePagination({
        paginated: () => toValue(options.paginated),
        pageSize: () => toValue(options.pageSize),
        totalItems: () => totalFilteredItems.value,
    })

    const displayData = computed(() => pagination.paginatedData(sortedData.value))

    const selection = useDataTableSelection<T>({
        selectable: () => toValue(options.selectable),
        rowKey: options.rowKey,
        displayData: () => displayData.value,
        data: () => rawData.value,
    })

    const activeColumnId = computed(() => {
        const { column, direction } = sort.sortState.value
        return column && direction ? column : null
    })

    function applyColumnFilterPatch(patch: DataTableFilterState) {
        const currentGlobal = patch.global !== undefined ? patch.global : filter.filterState.value.global
        const nextColumns = { ...filter.filterState.value.columns } as Record<string, DataTableFilterValue>
        if (patch.columns) {
            for (const [columnId, value] of Object.entries(patch.columns)) {
                if (isFilterValueEmpty(value)) {
                    delete nextColumns[columnId]
                } else {
                    nextColumns[columnId] = value
                }
            }
        }
        filter.setFilterState({
            global: currentGlobal,
            columns: nextColumns,
        })
    }

    watch(
        () => toValue(options.data),
        (newData, oldData) => {
            if (!oldData || newData === oldData) return
            const newCount = newData?.length ?? 0
            const oldCount = oldData?.length ?? 0
            const getRowKey = selection.getRowKey
            const keySetOf = (rows: T[]): Set<string | number> =>
                new Set(rows.map((row) => getRowKey(row)))
            const newKeys = keySetOf(newData ?? [])
            const oldKeys = keySetOf(oldData ?? [])
            if (
                newCount !== oldCount
                || newKeys.size !== oldKeys.size
                || [...newKeys].some((key) => !oldKeys.has(key))
            ) {
                selection.clearSelection()
                pagination.goToPage(1)
            }
        },
    )

    return {
        displayData,
        filteredData,
        sortedData,
        totalFilteredItems,
        activeColumnId,
        filter,
        sort,
        pagination,
        selection,
        applyColumnFilterPatch,
    }
}
