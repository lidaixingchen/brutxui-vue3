<script setup lang="ts" generic="T extends Record<string, unknown>">
import { ref, computed, watch } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import {
    dataTableRootVariants,
    dataTableHeaderVariants,
    dataTableHeadVariants,
    dataTableBodyVariants,
    dataTableRowVariants,
    dataTableCellVariants,
    dataTableToolbarVariants,
    dataTablePaginationVariants,
    dataTableEmptyVariants,
    dataTableLoadingVariants,
} from './data-table-variants'
import type { DataTableColumn, DataTableSortState, DataTableFilterState, DataTableVirtualScroll } from './types'
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'

const { t } = useLocale()

const props = withDefaults(defineProps<{
    data: T[]
    columns: DataTableColumn<T>[]
    sortable?: boolean
    filterable?: boolean
    selectable?: boolean
    resizable?: boolean
    paginated?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
    loading?: boolean
    emptyMessage?: string
    rowKey: keyof T | ((row: T) => string | number)
    virtualScroll?: DataTableVirtualScroll
    class?: string
}>(), {
    sortable: false,
    filterable: false,
    selectable: false,
    resizable: false,
    paginated: false,
    pageSize: 10,
    pageSizeOptions: () => [10, 20, 50, 100],
    loading: false,
    emptyMessage: undefined,
    virtualScroll: undefined,
    class: undefined,
})

const emit = defineEmits<{
    sort: [column: string, direction: 'asc' | 'desc' | null]
    filter: [filters: DataTableFilterState]
    select: [rows: T[]]
    pageChange: [page: number]
    pageSizeChange: [size: number]
    export: [format: 'csv' | 'json']
}>()

const sortState = ref<DataTableSortState>({ column: '', direction: null })
const filterState = ref<DataTableFilterState>({ global: '', columns: {} })
const selectedRows = ref<Set<string | number>>(new Set())
const currentPage = ref(1)
const currentPageSize = ref(props.pageSize)

function getRowKey(row: T): string | number {
    if (typeof props.rowKey === 'function') {
        return props.rowKey(row)
    }
    return row[props.rowKey] as string | number
}

const visibleColumns = computed(() =>
    props.columns.filter((col) => !col.hidden)
)

const filteredData = computed(() => {
    let result = [...props.data]

    if (filterState.value.global) {
        const search = filterState.value.global.toLowerCase()
        result = result.filter((row) =>
            visibleColumns.value.some((col) => {
                const value = col.accessorFn
                    ? col.accessorFn(row)
                    : col.accessorKey
                        ? row[col.accessorKey]
                        : ''
                return String(value).toLowerCase().includes(search)
            })
        )
    }

    Object.entries(filterState.value.columns).forEach(([columnId, filterValue]) => {
        if (filterValue === undefined || filterValue === null || filterValue === '') return
        const col = visibleColumns.value.find((c) => c.id === columnId)
        if (!col) return
        result = result.filter((row) => {
            const value = col.accessorFn
                ? col.accessorFn(row)
                : col.accessorKey
                    ? row[col.accessorKey]
                    : ''
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
        })
    })

    return result
})

const sortedData = computed(() => {
    if (!sortState.value.column || !sortState.value.direction) {
        return filteredData.value
    }

    const col = visibleColumns.value.find((c) => c.id === sortState.value.column)
    if (!col) return filteredData.value

    return [...filteredData.value].sort((a, b) => {
        const valueA = col.accessorFn
            ? col.accessorFn(a)
            : col.accessorKey
                ? a[col.accessorKey]
                : ''
        const valueB = col.accessorFn
            ? col.accessorFn(b)
            : col.accessorKey
                ? b[col.accessorKey]
                : ''

        if (valueA === valueB) return 0
        if (valueA === null || valueA === undefined) return 1
        if (valueB === null || valueB === undefined) return -1

        const comparison = valueA < valueB ? -1 : 1
        return sortState.value.direction === 'asc' ? comparison : -comparison
    })
})

const totalItems = computed(() => filteredData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / currentPageSize.value))

const paginatedData = computed(() => {
    if (!props.paginated) return sortedData.value
    const start = (currentPage.value - 1) * currentPageSize.value
    return sortedData.value.slice(start, start + currentPageSize.value)
})

const displayData = computed(() => paginatedData.value)

const isAllSelected = computed(() => {
    if (displayData.value.length === 0) return false
    return displayData.value.every((row) => selectedRows.value.has(getRowKey(row)))
})

const isIndeterminate = computed(() => {
    if (isAllSelected.value) return false
    return displayData.value.some((row) => selectedRows.value.has(getRowKey(row)))
})

function toggleSort(columnId: string) {
    if (!props.sortable) return
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
    emit('sort', sortState.value.column, sortState.value.direction)
}

function toggleRowSelection(row: T) {
    if (!props.selectable) return
    const key = getRowKey(row)
    const newSelection = new Set(selectedRows.value)
    if (newSelection.has(key)) {
        newSelection.delete(key)
    } else {
        newSelection.add(key)
    }
    selectedRows.value = newSelection
    emitSelectEvent()
}

function toggleAllSelection() {
    if (!props.selectable) return
    if (isAllSelected.value) {
        selectedRows.value = new Set()
    } else {
        const newSelection = new Set(selectedRows.value)
        displayData.value.forEach((row) => newSelection.add(getRowKey(row)))
        selectedRows.value = newSelection
    }
    emitSelectEvent()
}

function emitSelectEvent() {
    const selected = props.data.filter((row) => selectedRows.value.has(getRowKey(row)))
    emit('select', selected)
}

function goToPage(page: number) {
    const newPage = Math.max(1, Math.min(page, totalPages.value))
    if (newPage !== currentPage.value) {
        currentPage.value = newPage
        emit('pageChange', currentPage.value)
    }
}

function setPageSize(size: number) {
    currentPageSize.value = size
    currentPage.value = 1
    emit('pageSizeChange', size)
}

function exportData(format: 'csv' | 'json') {
    emit('export', format)
}

function getCellValue(row: T, column: DataTableColumn<T>): unknown {
    if (column.accessorFn) {
        return column.accessorFn(row)
    }
    if (column.accessorKey) {
        return row[column.accessorKey]
    }
    return undefined
}

function getHeaderLabel(column: DataTableColumn<T>): string {
    if (typeof column.header === 'function') {
        return column.header(column)
    }
    return column.header
}

watch(() => props.data, () => {
    selectedRows.value = new Set()
    currentPage.value = 1
}, { deep: true })

watch(() => props.pageSize, (newSize) => {
    currentPageSize.value = newSize
})

watch(totalPages, (newTotal) => {
    if (currentPage.value > newTotal) {
        currentPage.value = Math.max(1, newTotal)
    }
})

const rootClasses = computed(() =>
    cn(dataTableRootVariants({}), props.class)
)

const rootStyle = computed(() => {
    if (!props.virtualScroll?.enabled) return undefined
    return {
        '--row-height': `${props.virtualScroll.rowHeight ?? 48}px`,
    }
})
</script>

<template>
    <div :class="rootClasses" :style="rootStyle" role="grid" :aria-label="t('dataTable.label')">
        <!-- Toolbar -->
        <div v-if="filterable || $slots.toolbar" :class="cn(dataTableToolbarVariants())">
            <div v-if="filterable" class="flex items-center gap-2">
                <input
                    v-model="filterState.global"
                    type="text"
                    :placeholder="t('dataTable.filterPlaceholder')"
                    class="px-3 py-2 border-3 border-brutal bg-brutal-bg text-brutal-fg placeholder-brutal-fg/50 focus:outline-none focus:ring-2 focus:ring-brutal-ring"
                >
            </div>
            <div class="flex items-center gap-2">
                <slot name="toolbar" />
                <button
                    v-if="selectable && selectedRows.size > 0"
                    class="px-3 py-2 border-3 border-brutal bg-brutal-primary text-brutal-fg font-bold hover:-translate-y-0.5 hover:shadow-brutal active:translate-y-0 active:shadow-none transition-all"
                    @click="exportData('csv')"
                >
                    {{ t('dataTable.exportCsv') }}
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <!-- Header -->
                <thead :class="cn(dataTableHeaderVariants())">
                    <tr>
                        <th v-if="selectable" class="w-12 px-4 py-3 text-center">
                            <input
                                type="checkbox"
                                :checked="isAllSelected"
                                :indeterminate="isIndeterminate"
                                class="w-4 h-4 border-2 border-brutal cursor-pointer"
                                @change="toggleAllSelection"
                            >
                        </th>
                        <th
                            v-for="column in visibleColumns"
                            :key="column.id"
                            :class="cn(
                                dataTableHeadVariants({
                                    sortable: sortable && column.sortable !== false,
                                    align: column.align,
                                })
                            )"
                            :style="{
                                width: column.width ? (typeof column.width === 'number' ? `${column.width}px` : column.width) : undefined,
                                minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                                maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
                            }"
                            role="columnheader"
                            :aria-sort="sortState.column === column.id ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : 'none'"
                            @click="sortable && column.sortable !== false ? toggleSort(column.id) : undefined"
                        >
                            <div class="flex items-center gap-2" :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }">
                                <span>{{ getHeaderLabel(column) }}</span>
                                <span v-if="sortable && column.sortable !== false" class="inline-flex">
                                    <ArrowUp v-if="sortState.column === column.id && sortState.direction === 'asc'" class="w-4 h-4" />
                                    <ArrowDown v-else-if="sortState.column === column.id && sortState.direction === 'desc'" class="w-4 h-4" />
                                    <ArrowUpDown v-else class="w-4 h-4 opacity-30" />
                                </span>
                            </div>
                        </th>
                    </tr>
                </thead>

                <!-- Body -->
                <tbody :class="cn(dataTableBodyVariants())">
                    <template v-if="displayData.length > 0">
                        <tr
                            v-for="row in displayData"
                            :key="getRowKey(row)"
                            :class="cn(dataTableRowVariants({ selected: selectedRows.has(getRowKey(row)) }))"
                            role="row"
                            :aria-selected="selectedRows.has(getRowKey(row)) || undefined"
                        >
                            <td v-if="selectable" class="w-12 px-4 py-3 text-center" role="gridcell">
                                <input
                                    type="checkbox"
                                    :checked="selectedRows.has(getRowKey(row))"
                                    class="w-4 h-4 border-2 border-brutal cursor-pointer"
                                    @change="toggleRowSelection(row)"
                                >
                            </td>
                            <td
                                v-for="column in visibleColumns"
                                :key="column.id"
                                :class="cn(dataTableCellVariants({ align: column.align }))"
                                role="gridcell"
                            >
                                <slot :name="`cell-${column.id}`" :row="row" :value="getCellValue(row, column)">
                                    <component :is="() => column.cell!({ row, value: getCellValue(row, column) })" v-if="column.cell" />
                                    <template v-else>
                                        {{ getCellValue(row, column) }}
                                    </template>
                                </slot>
                            </td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr>
                            <td
                                :colspan="visibleColumns.length + (selectable ? 1 : 0)"
                                :class="cn(dataTableEmptyVariants())"
                                role="gridcell"
                            >
                                <slot name="empty">
                                    <p class="font-bold">
                                        {{ emptyMessage || t('dataTable.noData') }}
                                    </p>
                                </slot>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="paginated && totalPages > 1" :class="cn(dataTablePaginationVariants())">
            <div class="flex items-center gap-4">
                <span class="text-sm font-medium">
                    {{ t('dataTable.pageInfo', { current: currentPage, total: totalPages }) }}
                </span>
                <select
                    :value="currentPageSize"
                    class="px-2 py-1 border-2 border-brutal bg-brutal-bg text-brutal-fg text-sm"
                    @change="setPageSize(Number(($event.target as HTMLSelectElement).value))"
                >
                    <option v-for="size in pageSizeOptions" :key="size" :value="size">
                        {{ size }} {{ t('dataTable.perPage') }}
                    </option>
                </select>
            </div>
            <div class="flex items-center gap-1">
                <button
                    class="p-2 border-2 border-brutal bg-brutal-bg hover:bg-brutal-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    :disabled="currentPage === 1"
                    :aria-label="t('dataTable.firstPage')"
                    @click="goToPage(1)"
                >
                    <ChevronsLeft class="w-4 h-4" />
                </button>
                <button
                    class="p-2 border-2 border-brutal bg-brutal-bg hover:bg-brutal-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    :disabled="currentPage === 1"
                    :aria-label="t('dataTable.previousPage')"
                    @click="goToPage(currentPage - 1)"
                >
                    <ChevronLeft class="w-4 h-4" />
                </button>
                <button
                    class="p-2 border-2 border-brutal bg-brutal-bg hover:bg-brutal-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    :disabled="currentPage === totalPages"
                    :aria-label="t('dataTable.nextPage')"
                    @click="goToPage(currentPage + 1)"
                >
                    <ChevronRight class="w-4 h-4" />
                </button>
                <button
                    class="p-2 border-2 border-brutal bg-brutal-bg hover:bg-brutal-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    :disabled="currentPage === totalPages"
                    :aria-label="t('dataTable.lastPage')"
                    @click="goToPage(totalPages)"
                >
                    <ChevronsRight class="w-4 h-4" />
                </button>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="loading" :class="cn(dataTableLoadingVariants())">
            <Loader2 class="w-8 h-8 animate-spin text-brutal-primary" />
        </div>

        <!-- Selection Info -->
        <div v-if="selectable && selectedRows.size > 0" class="px-4 py-2 border-t-2 border-brutal bg-brutal-primary/10 text-sm font-bold">
            {{ t('dataTable.selectedRows', { count: selectedRows.size }) }}
        </div>
    </div>
</template>
