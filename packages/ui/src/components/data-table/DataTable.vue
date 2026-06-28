<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import { computed, watch, nextTick } from 'vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { getCellValue } from '@/lib/data-table-utils'
import { useDataTableSort } from '@/composables/useDataTableSort'
import { useDataTableFilter } from '@/composables/useDataTableFilter'
import { useDataTableSelection } from '@/composables/useDataTableSelection'
import { useDataTablePagination } from '@/composables/useDataTablePagination'
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
import type { DataTableColumn, DataTableVirtualScroll, DataTableFilterState } from './types'
import Input from '../input/Input.vue'
import Button from '../button/Button.vue'
import Checkbox from '../checkbox/Checkbox.vue'
import { SelectRoot, SelectValue } from 'reka-ui'
import SelectTrigger from '../select/SelectTrigger.vue'
import SelectContent from '../select/SelectContent.vue'
import SelectItem from '../select/SelectItem.vue'
import {
    Loader2,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Inbox,
} from '@lucide/vue'

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
    size?: 'sm' | 'default' | 'lg'
    dense?: boolean
    striped?: boolean
    stickyHeader?: boolean
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
    size: 'default',
    dense: false,
    striped: true,
    stickyHeader: false,
    class: undefined,
})

const emit = defineEmits<{
    sort: [column: string, direction: 'asc' | 'desc' | null]
    filter: [filters: DataTableFilterState]
    select: [rows: T[]]
    pageChange: [page: number]
    pageSizeChange: [size: number]
    export: [format: 'csv' | 'json', selectedRows: T[]]
}>()

const visibleColumns = computed(() =>
    props.columns.filter((col) => !col.hidden),
)

const filter = useDataTableFilter<T>({
    columns: () => props.columns,
    filterable: () => props.filterable,
})

const sort = useDataTableSort<T>({
    columns: () => props.columns,
    sortable: () => props.sortable,
})

const filtered = computed(() => filter.filteredData(props.data))
const sorted = computed(() => sort.sortedData(filtered.value))

const pagination = useDataTablePagination({
    paginated: () => props.paginated,
    pageSize: () => props.pageSize,
    totalItems: () => filtered.value.length,
})

const displayData = computed(() => pagination.paginatedData(sorted.value))

const selection = useDataTableSelection<T>({
    selectable: () => props.selectable,
    rowKey: () => props.rowKey,
    displayData: () => displayData.value,
    data: () => props.data,
})

const activeColumnId = computed(() => {
    const { column, direction } = sort.sortState.value
    return column && direction ? column : null
})

function getHeaderLabel(column: DataTableColumn<T>): string {
    if (typeof column.header === 'function') {
        return column.header({
            id: column.id,
            sortable: column.sortable,
            sortDirection: sort.sortState.value.column === column.id ? sort.sortState.value.direction : null,
            accessorKey: column.accessorKey,
            align: column.align,
        })
    }
    return column.header
}

async function handleSort(columnId: string) {
    if (!props.sortable) return
    const col = visibleColumns.value.find((c) => c.id === columnId)
    if (!col || col.sortable === false) return
    sort.toggleSort(columnId)
    await nextTick()
    emit('sort', sort.sortState.value.column, sort.sortState.value.direction)
}

function handleToggleRow(row: T) {
    selection.toggleRowSelection(row)
    emit('select', selection.getSelectedRows())
}

function handleToggleAll() {
    selection.toggleAllSelection()
    emit('select', selection.getSelectedRows())
}

function handleGoToPage(page: number) {
    if (pagination.goToPage(page)) {
        emit('pageChange', pagination.currentPage.value)
    }
}

function handleSetPageSize(size: number) {
    pagination.setPageSize(size)
    emit('pageSizeChange', size)
}

function exportData(format: 'csv' | 'json') {
    const selectedData = selection.getSelectedRows()
    emit('export', format, selectedData)
}

watch(() => props.data, () => {
    selection.clearSelection()
    pagination.goToPage(1)
}, { deep: true })

watch(() => filter.filterState.value, (newState) => {
    emit('filter', newState)
}, { deep: true })

const rootClasses = computed(() =>
    cn(dataTableRootVariants({ size: props.size }), props.class),
)

const rootStyle = computed(() => {
    if (!props.virtualScroll?.enabled) return undefined
    return {
        '--row-height': `${props.virtualScroll.rowHeight ?? 48}px`,
    }
})

const toolbarClasses = computed(() => cn(dataTableToolbarVariants()))
const headerClasses = computed(() => cn(dataTableHeaderVariants(), props.stickyHeader && 'sticky top-0 z-10'))
const bodyClasses = computed(() => cn(dataTableBodyVariants()))
const emptyClasses = computed(() => cn(dataTableEmptyVariants()))
const paginationClasses = computed(() => cn(dataTablePaginationVariants()))
const loadingClasses = computed(() => cn(dataTableLoadingVariants()))

function getHeadClasses(column: DataTableColumn<T>): string {
    return cn(
        dataTableHeadVariants({
            sortable: props.sortable && column.sortable !== false,
            align: column.align,
            active: activeColumnId.value === column.id,
        }),
    )
}

function getRowClasses(row: T): string {
    return cn(
        dataTableRowVariants({
            selected: selection.selectedRows.value.has(selection.getRowKey(row)),
            striped: props.striped,
        }),
    )
}

function CellRenderer(props: { cellFn: (ctx: { row: T; value: unknown }) => ReturnType<NonNullable<DataTableColumn<T>['cell']>>; row: T; value: unknown }) {
    return props.cellFn({ row: props.row, value: props.value })
}

function getCellClasses(column: DataTableColumn<T>): string {
    return cn(
        dataTableCellVariants({
            align: column.align,
            size: props.size,
            dense: props.dense,
            active: activeColumnId.value === column.id,
        }),
    )
}
</script>

<template>
    <div :class="rootClasses" :style="rootStyle" role="grid" :aria-label="t('dataTable.label')">
        <!-- Toolbar -->
        <div v-if="filterable || $slots.toolbar" :class="toolbarClasses">
            <div v-if="filterable" class="flex items-center gap-2">
                <Input
                    v-model="filter.filterState.value.global"
                    input-size="sm"
                    :placeholder="t('dataTable.filterPlaceholder')"
                    :aria-label="t('dataTable.filterPlaceholder')"
                />
            </div>
            <div class="flex items-center gap-2">
                <slot name="toolbar" />
                <Button
                    v-if="selectable && selection.selectedRows.value.size > 0"
                    variant="primary"
                    size="sm"
                    @click="exportData('csv')"
                >
                    {{ t('dataTable.exportCsv') }}
                </Button>
            </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <!-- Header -->
                <thead :class="headerClasses">
                    <tr>
                        <th v-if="selectable" class="w-12 px-4 py-3 text-center">
                            <Checkbox
                                :checked="selection.isIndeterminate.value ? 'indeterminate' : selection.isAllSelected.value"
                                size="sm"
                                class="cursor-pointer"
                                @update:checked="handleToggleAll"
                            />
                        </th>
                        <th
                            v-for="column in visibleColumns"
                            :key="column.id"
                            :class="getHeadClasses(column)"
                            :style="{
                                width: column.width ? (typeof column.width === 'number' ? `${column.width}px` : column.width) : undefined,
                                minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                                maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined,
                            }"
                            role="columnheader"
                            :tabindex="sortable && column.sortable !== false ? 0 : undefined"
                            :aria-sort="sort.sortState.value.column === column.id ? (sort.sortState.value.direction === 'asc' ? 'ascending' : 'descending') : 'none'"
                            @click="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                            @keydown.enter="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                        >
                            <div class="flex items-center gap-2" :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }">
                                <span>{{ getHeaderLabel(column) }}</span>
                                <span v-if="sortable && column.sortable !== false" class="inline-flex text-brutal-fg">
                                    <ArrowUp v-if="sort.sortState.value.column === column.id && sort.sortState.value.direction === 'asc'" class="w-4 h-4" />
                                    <ArrowDown v-else-if="sort.sortState.value.column === column.id && sort.sortState.value.direction === 'desc'" class="w-4 h-4" />
                                    <ArrowUpDown v-else class="w-4 h-4" />
                                </span>
                            </div>
                        </th>
                    </tr>
                </thead>

                <!-- Body -->
                <tbody :class="bodyClasses">
                    <template v-if="displayData.length > 0">
                        <tr
                            v-for="row in displayData"
                            :key="selection.getRowKey(row)"
                            :class="getRowClasses(row)"
                            role="row"
                            :aria-selected="selection.selectedRows.value.has(selection.getRowKey(row)) || undefined"
                        >
                            <td v-if="selectable" class="w-12 px-4 py-3 text-center" role="gridcell">
                                <Checkbox
                                    :checked="selection.selectedRows.value.has(selection.getRowKey(row))"
                                    size="sm"
                                    class="cursor-pointer"
                                    @update:checked="handleToggleRow(row)"
                                />
                            </td>
                            <td
                                v-for="column in visibleColumns"
                                :key="column.id"
                                :class="getCellClasses(column)"
                                role="gridcell"
                            >
                                <slot :name="`cell-${column.id}`" :row="row" :value="getCellValue(row, column)">
                                    <CellRenderer v-if="column.cell" :cell-fn="column.cell" :row="row" :value="getCellValue(row, column)" />
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
                                :class="emptyClasses"
                                role="gridcell"
                            >
                                <slot name="empty">
                                    <span class="inline-flex items-center justify-center border-3 border-brutal shadow-brutal p-3">
                                        <Inbox class="w-6 h-6" />
                                    </span>
                                    <p class="font-black">
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
        <div v-if="paginated" :class="paginationClasses">
            <div class="flex items-center gap-4">
                <span class="text-sm font-medium">
                    {{ t('dataTable.pageInfo', { current: pagination.currentPage.value, total: pagination.totalPages.value }) }}
                </span>
                <SelectRoot
                    :model-value="String(pagination.currentPageSize.value)"
                    @update:model-value="handleSetPageSize(Number($event))"
                >
                    <SelectTrigger
                        size="sm"
                        class="w-auto"
                        :aria-label="t('dataTable.perPage')"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="sizeOption in pageSizeOptions"
                            :key="sizeOption"
                            :value="String(sizeOption)"
                        >
                            {{ sizeOption }} {{ t('dataTable.perPage') }}
                        </SelectItem>
                    </SelectContent>
                </SelectRoot>
            </div>
            <div class="flex items-center gap-1">
                <Button
                    variant="default"
                    size="icon"
                    :disabled="pagination.currentPage.value === 1"
                    :aria-label="t('dataTable.firstPage')"
                    @click="handleGoToPage(1)"
                >
                    <ChevronsLeft class="w-4 h-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    :disabled="pagination.currentPage.value === 1"
                    :aria-label="t('dataTable.previousPage')"
                    @click="handleGoToPage(pagination.currentPage.value - 1)"
                >
                    <ChevronLeft class="w-4 h-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    :disabled="pagination.currentPage.value === pagination.totalPages.value"
                    :aria-label="t('dataTable.nextPage')"
                    @click="handleGoToPage(pagination.currentPage.value + 1)"
                >
                    <ChevronRight class="w-4 h-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    :disabled="pagination.currentPage.value === pagination.totalPages.value"
                    :aria-label="t('dataTable.lastPage')"
                    @click="handleGoToPage(pagination.totalPages.value)"
                >
                    <ChevronsRight class="w-4 h-4" />
                </Button>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div v-if="loading" :class="loadingClasses">
            <slot name="loading">
                <span class="inline-flex items-center justify-center border-3 border-brutal bg-brutal-bg p-2 shadow-brutal">
                    <Loader2 class="w-8 h-8 animate-spin text-brutal-primary" />
                </span>
            </slot>
        </div>

        <!-- Selection Info -->
        <div
            v-if="selectable && selection.selectedRows.value.size > 0"
            class="sticky bottom-0 px-4 py-2 border-t-3 border-brutal bg-brutal-primary text-brutal-primary-foreground text-sm font-black"
        >
            {{ t('dataTable.selectedRows', { count: selection.selectedRows.value.size }) }}
        </div>
    </div>
</template>
