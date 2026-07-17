<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import { computed, shallowRef, watch, watchEffect, markRaw, useSlots } from 'vue'
import { cn } from '@/lib/utils'
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS, DATA_TABLE_COLUMN_WIDTH_FALLBACK_PX, DATA_TABLE_EXPAND_COLUMN_WIDTH_PX, DATA_TABLE_SELECT_COLUMN_WIDTH_PX, DATA_TABLE_ROW_HEIGHT_FALLBACK_PX, DATA_TABLE_FIXED_COLUMN_Z_INDEX } from '@/lib/defaults'
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
    dataTableRowVariants,
    dataTableCellVariants,
    dataTableToolbarVariants,
    dataTablePaginationVariants,
    dataTableEmptyVariants,
    dataTableLoadingVariants,
} from './data-table-variants'
import type { DataTableColumn, DataTableProps, DataTableFilterState } from './types'
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
    ChevronDown,
    ChevronRight as ChevronRightIcon,
} from '@lucide/vue'
import VirtualScroll from '../virtual-scroll/VirtualScroll.vue'
import DataTableColumnFilter from './DataTableColumnFilter.vue'

const slots = useSlots()
const { t } = useLocale()

const props = withDefaults(defineProps<DataTableProps<T>>(), {
    sortable: false,
    filterable: false,
    filterPlaceholder: undefined,
    selectable: false,
    paginated: false,
    pageSize: DEFAULT_PAGE_SIZE,
    pageSizeOptions: () => [...DEFAULT_PAGE_SIZE_OPTIONS],
    loading: false,
    size: 'default',
    dense: false,
    striped: true,
    stickyHeader: false,
    expandable: false,
    rowClickable: false,
    title: undefined,
    description: undefined,
    section: false,
    framed: true,
    expandRowKeys: undefined,
    spanMethod: undefined,
})

const emit = defineEmits<{
    sort: [column: string, direction: 'asc' | 'desc' | null]
    filter: [filters: DataTableFilterState]
    select: [rows: T[]]
    'page-change': [page: number]
    'page-size-change': [size: number]
    'expand-change': [row: T, expanded: boolean]
    'row-click': [row: T]
    export: [format: 'csv' | 'json', selectedRows?: T[]]
}>()

// 展开行状态 - 使用 shallowRef 避免对 Set 进行深层响应式转换
const expandedRowKeys = shallowRef<Set<string | number>>(new Set())

// 同步外部 expandRowKeys
if (props.expandRowKeys) {
    expandedRowKeys.value = new Set(props.expandRowKeys)
}

watch(() => props.expandRowKeys, (newKeys) => {
    expandedRowKeys.value = newKeys ? new Set(newKeys) : new Set()
}, { deep: true })

// 获取行的唯一 key（复用 selection.getRowKey 的兜底逻辑）
function getRowKeyValue(row: T): string | number {
    return selection.getRowKey(row)
}

// 切换展开行
function toggleExpandRow(row: T) {
    const key = getRowKeyValue(row)
    const isExpanded = expandedRowKeys.value.has(key)
    if (isExpanded) {
        expandedRowKeys.value.delete(key)
    } else {
        expandedRowKeys.value.add(key)
    }
    // 触发响应式
    expandedRowKeys.value = new Set(expandedRowKeys.value)
    emit('expand-change', row, !isExpanded)
}

// 检查行是否展开
function isRowExpanded(row: T): boolean {
    return expandedRowKeys.value.has(getRowKeyValue(row))
}

// 计算固定列的偏移量
function getFixedColumnOffset(column: DataTableColumn<T>, side: 'left' | 'right'): number {
    const cols = visibleColumns.value.filter(c => c.fixed === side)
    const index = cols.findIndex(c => c.id === column.id)
    if (index === -1) return 0

    let offset = 0
    for (let i = 0; i < index; i++) {
        const w = cols[i].width
        offset += typeof w === 'number' ? w : DATA_TABLE_COLUMN_WIDTH_FALLBACK_PX
    }
    return offset
}

// 预计算所有单元格的合并结果，避免模板中重复调用 spanMethod
const cellSpanInfo = computed(() => {
    if (!props.spanMethod) return null
    const map = new Map<string, [number, number] | undefined>()
    const rows = displayData.value
    const cols = visibleColumns.value
    for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length; c++) {
            map.set(`${r}-${c}`, props.spanMethod({ row: rows[r]!, column: cols[c]!, rowIndex: r, columnIndex: c }) ?? undefined)
        }
    }
    return map
})

function getCellSpan(rowIndex: number, columnIndex: number): [number, number] | undefined {
    return cellSpanInfo.value?.get(`${rowIndex}-${columnIndex}`)
}

function isCellVisible(rowIndex: number, columnIndex: number): boolean {
    const span = getCellSpan(rowIndex, columnIndex)
    return !span || (span[0] !== 0 && span[1] !== 0)
}

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
            direction: sort.sortState.value.column === column.id ? sort.sortState.value.direction : null,
            accessorKey: column.accessorKey,
            align: column.align,
        })
    }
    return column.header
}

function handleSort(columnId: string) {
    if (!props.sortable) return
    const col = visibleColumns.value.find((c) => c.id === columnId)
    if (!col || col.sortable === false) return
    sort.toggleSort(columnId)
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
        emit('page-change', pagination.currentPage.value)
    }
}

function handleSetPageSize(size: number) {
    pagination.setPageSize(size)
    emit('page-size-change', size)
}

function exportData(format: 'csv' | 'json') {
    const selectedData = selection.getSelectedRows()
    emit('export', format, selectedData)
}

function isInteractiveEvent(event: Event): boolean {
    const target = event.target
    if (!(target instanceof HTMLElement)) return false
    return Boolean(target.closest('button, input, [role="checkbox"], [role="button"], a'))
}

function handleRowClick(row: T, event: Event) {
    if (!props.rowClickable || isInteractiveEvent(event)) return
    emit('row-click', row)
}

watch(() => props.data, (newData, oldData) => {
    if (newData !== oldData) {
        selection.clearSelection()
        pagination.goToPage(1)
    }
})

watch(filter.filterState, (newState) => {
    emit('filter', newState)
}, { deep: true })

const warnedColumns = new Set<string>()

watchEffect(() => {
    if (!props.virtualScroll?.enabled) return
    // 清除已移除列的警告记录：列被动态移除再添加后，警告应重新触发，
    // 否则开发者无法察觉配置问题（warnedColumns 只增不减导致警告永久静默）
    const currentIds = new Set(visibleColumns.value.map(c => c.id))
    for (const id of warnedColumns) {
        if (!currentIds.has(id)) warnedColumns.delete(id)
    }
    visibleColumns.value.forEach((col) => {
        if (!col.width && !warnedColumns.has(col.id)) {
            console.warn(`[BrutxUI] Column "${col.id}" must have an explicit width when virtualScroll is enabled.`)
            warnedColumns.add(col.id)
        }
    })
})

const gridTemplateColumns = computed(() => {
    const parts: string[] = []
    if (props.expandable) parts.push(`${DATA_TABLE_EXPAND_COLUMN_WIDTH_PX}px`)
    if (props.selectable) parts.push(`${DATA_TABLE_SELECT_COLUMN_WIDTH_PX}px`)

    visibleColumns.value.forEach((col) => {
        if (!col.width) {
            parts.push('1fr')
        } else if (typeof col.width === 'number') {
            parts.push(`${col.width}px`)
        } else if (col.width === 'auto') {
            parts.push('1fr')
        } else {
            parts.push(col.width)
        }
    })
    return parts.join(' ')
})



const rootClasses = computed(() =>
    cn(
        dataTableRootVariants({ size: props.size }),
        props.section && 'max-w-5xl mx-auto overflow-hidden',
        props.framed === false && 'border-0 shadow-none rounded-none',
        props.class,
    ),
)

const rootStyle = computed(() => {
    if (!props.virtualScroll?.enabled) return undefined
    return {
        '--row-height': `${props.virtualScroll.rowHeight ?? DATA_TABLE_ROW_HEIGHT_FALLBACK_PX}px`,
    }
})

const toolbarClasses = computed(() => cn(dataTableToolbarVariants()))
const headerClasses = computed(() => cn(dataTableHeaderVariants(), props.stickyHeader && 'sticky top-0 z-10'))
const emptyClasses = computed(() => cn(dataTableEmptyVariants()))
const paginationClasses = computed(() => cn(dataTablePaginationVariants()))
const loadingClasses = computed(() => cn(dataTableLoadingVariants()))

defineExpose({
    sort: {
        toggleSort: sort.toggleSort,
        sortState: sort.sortState,
    },
    filter: {
        filterState: filter.filterState,
        setGlobalFilter: (value: string) => {
            filter.filterState.value = { ...filter.filterState.value, global: value }
        },
    },
    selection: {
        toggleRow: selection.toggleRowSelection,
        toggleAllRows: selection.toggleAllSelection,
        clearSelection: selection.clearSelection,
        getSelectedRows: selection.getSelectedRows,
        selectedRows: selection.selectedRows,
        isAllSelected: selection.isAllSelected,
    },
    pagination: {
        goToPage: pagination.goToPage,
        nextPage: () => pagination.goToPage(pagination.currentPage.value + 1),
        previousPage: () => pagination.goToPage(pagination.currentPage.value - 1),
        setPageSize: pagination.setPageSize,
        pageIndex: pagination.currentPage,
        pageCount: pagination.totalPages,
    },
    expand: {
        toggleRow: toggleExpandRow,
        isRowExpanded,
        expandedRowKeys,
    },
})

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
        props.rowClickable && 'cursor-pointer',
    )
}

const CellRenderer = markRaw({
    props: ['cellFn', 'row', 'value'],
    setup(props: { cellFn: (ctx: { row: T; value: unknown }) => ReturnType<NonNullable<DataTableColumn<T>['cell']>>; row: T; value: unknown }) {
        return () => props.cellFn({ row: props.row, value: props.value })
    },
})

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
        <slot name="header">
            <div v-if="title || description" class="border-b-3 border-brutal px-6 py-4">
                <h2 v-if="title" class="text-3xl font-black tracking-tight">
                    {{ title }}
                </h2>
                <p v-if="description" class="mt-1 text-sm font-medium text-brutal-muted-foreground">
                    {{ description }}
                </p>
            </div>
        </slot>

        <!-- Toolbar -->
        <div v-if="filterable || slots.toolbar" :class="toolbarClasses">
            <div v-if="filterable" class="flex items-center gap-2">
                <Input
                    v-model="filter.filterState.value.global"
                    size="sm"
                    :placeholder="filterPlaceholder ?? t('dataTable.filterPlaceholder')"
                    :aria-label="filterPlaceholder ?? t('dataTable.filterPlaceholder')"
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

        <!-- Table / Virtual Scroll -->
        <div class="overflow-x-auto">
            <!-- 虚拟滚动启用时的布局 -->
            <template v-if="props.virtualScroll?.enabled">
                <div class="w-full min-w-max border-collapse" role="presentation">
                    <!-- Header -->
                    <div :class="headerClasses" role="rowgroup">
                        <div
                            class="grid border-b-3 border-brutal"
                            :style="{ gridTemplateColumns }"
                            role="row"
                        >
                            <div v-if="expandable" class="w-10 px-2 py-3 text-center flex items-center justify-center font-bold" role="columnheader">
                                <span class="sr-only">Expand</span>
                            </div>
                            <div v-if="selectable" class="w-12 px-4 py-3 text-center flex items-center justify-center" role="columnheader">
                                <Checkbox
                                    :checked="selection.isIndeterminate.value ? 'indeterminate' : selection.isAllSelected.value"
                                    size="sm"
                                    class="cursor-pointer"
                                    @update:checked="handleToggleAll"
                                />
                            </div>
                            <div
                                v-for="column in visibleColumns"
                                :key="column.id"
                                :class="[getHeadClasses(column), 'flex items-center']"
                                :style="{
                                    position: column.fixed ? 'sticky' : undefined,
                                    left: column.fixed === 'left' ? `${getFixedColumnOffset(column, 'left')}px` : undefined,
                                    right: column.fixed === 'right' ? `${getFixedColumnOffset(column, 'right')}px` : undefined,
                                    zIndex: column.fixed ? DATA_TABLE_FIXED_COLUMN_Z_INDEX : undefined,
                                }"
                                role="columnheader"
                                :tabindex="sortable && column.sortable !== false ? 0 : undefined"
                                :aria-sort="sort.sortState.value.column === column.id ? (sort.sortState.value.direction === 'asc' ? 'ascending' : 'descending') : 'none'"
                                @click="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                                @keydown.enter="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                                @keydown.space.prevent="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                            >
                                <div class="flex items-center gap-2 w-full" :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }">
                                    <span>{{ getHeaderLabel(column) }}</span>
                                    
                                    <!-- Column Filter UI -->
                                    <DataTableColumnFilter
                                        v-if="props.filterable && column.filterType"
                                        v-model:filter-state="filter.filterState.value"
                                        :column="column"
                                        :header-label="getHeaderLabel(column)"
                                    />
                                    
                                    <span v-if="sortable && column.sortable !== false" class="inline-flex text-brutal-fg">
                                        <ArrowUp v-if="sort.sortState.value.column === column.id && sort.sortState.value.direction === 'asc'" class="w-4 h-4" />
                                        <ArrowDown v-else-if="sort.sortState.value.column === column.id && sort.sortState.value.direction === 'desc'" class="w-4 h-4" />
                                        <ArrowUpDown v-else class="w-4 h-4" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Body with Virtual Scroll -->
                    <VirtualScroll
                        v-if="displayData.length > 0"
                        :items="displayData"
                        :item-height="props.virtualScroll.rowHeight === 'auto' ? DATA_TABLE_ROW_HEIGHT_FALLBACK_PX : props.virtualScroll.rowHeight"
                        :dynamic-height="props.virtualScroll.rowHeight === 'auto'"
                        role="rowgroup"
                        item-role="none"
                        class="w-full max-h-[400px] overflow-y-auto border-3 border-t-0 border-brutal"
                    >
                        <template #default="{ index: rowIndex }">
                            <div v-if="displayData[rowIndex]" class="flex flex-col w-full border-b border-brutal/30 last:border-b-0">
                                <div
                                    class="grid"
                                    :style="{ gridTemplateColumns }"
                                    :class="getRowClasses(displayData[rowIndex])"
                                    role="row"
                                    :tabindex="rowClickable ? 0 : undefined"
                                    :aria-selected="selection.selectedRows.value.has(selection.getRowKey(displayData[rowIndex])) || undefined"
                                    :aria-expanded="expandable ? isRowExpanded(displayData[rowIndex]) : undefined"
                                    @click="handleRowClick(displayData[rowIndex], $event)"
                                    @keydown.enter="handleRowClick(displayData[rowIndex], $event)"
                                >
                                    <div v-if="expandable" class="w-10 px-2 py-3 text-center flex items-center justify-center" role="gridcell">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="p-1 h-auto w-auto"
                                            :aria-label="isRowExpanded(displayData[rowIndex]) ? 'Collapse row' : 'Expand row'"
                                            @click.stop="toggleExpandRow(displayData[rowIndex])"
                                        >
                                            <ChevronDown
                                                v-if="isRowExpanded(displayData[rowIndex])"
                                                class="w-4 h-4 transition-transform"
                                            />
                                            <ChevronRightIcon
                                                v-else
                                                class="w-4 h-4 transition-transform"
                                            />
                                        </Button>
                                    </div>
                                    <div v-if="selectable" class="w-12 px-4 py-3 text-center flex items-center justify-center" role="gridcell">
                                        <Checkbox
                                            :checked="selection.selectedRows.value.has(selection.getRowKey(displayData[rowIndex]))"
                                            size="sm"
                                            class="cursor-pointer"
                                            @update:checked="handleToggleRow(displayData[rowIndex])"
                                        />
                                    </div>
                                    <div
                                        v-for="column in visibleColumns"
                                        :key="column.id"
                                        :class="[getCellClasses(column), 'flex items-center']"
                                        :style="{
                                            position: column.fixed ? 'sticky' : undefined,
                                            left: column.fixed === 'left' ? `${getFixedColumnOffset(column, 'left')}px` : undefined,
                                            right: column.fixed === 'right' ? `${getFixedColumnOffset(column, 'right')}px` : undefined,
                                            zIndex: column.fixed ? DATA_TABLE_FIXED_COLUMN_Z_INDEX : undefined,
                                        }"
                                        role="gridcell"
                                    >
                                        <template v-if="column.type === 'expand'">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="p-1 h-auto w-auto"
                                                @click.stop="toggleExpandRow(displayData[rowIndex])"
                                            >
                                                <ChevronDown
                                                    v-if="isRowExpanded(displayData[rowIndex])"
                                                    class="w-4 h-4 transition-transform"
                                                />
                                                <ChevronRightIcon
                                                    v-else
                                                    class="w-4 h-4 transition-transform"
                                                />
                                            </Button>
                                        </template>
                                        <template v-else>
                                            <slot :name="`cell-${column.id}`" :row="displayData[rowIndex]" :value="getCellValue(displayData[rowIndex], column)">
                                                <CellRenderer v-if="column.cell" :cell-fn="column.cell" :row="displayData[rowIndex]" :value="getCellValue(displayData[rowIndex], column)" />
                                                <template v-else>
                                                    {{ getCellValue(displayData[rowIndex], column) }}
                                                </template>
                                            </slot>
                                        </template>
                                    </div>
                                </div>
                                <!-- Expanded Row -->
                                <div
                                    v-if="expandable && isRowExpanded(displayData[rowIndex])"
                                    class="bg-brutal-muted/30 p-4 border-t border-brutal/20"
                                    role="row"
                                >
                                    <div :style="{ width: '100%' }" role="gridcell">
                                        <slot name="expanded-row" :row="displayData[rowIndex]" :index="rowIndex" />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </VirtualScroll>
                    
                    <!-- Empty State for Virtual Scroll -->
                    <div v-else :class="emptyClasses" role="rowgroup">
                        <div role="row">
                            <div role="gridcell" class="w-full text-center py-8">
                                <slot name="empty">
                                    <span class="inline-flex items-center justify-center border-3 border-brutal shadow-brutal p-3 bg-brutal-bg">
                                        <Inbox class="w-6 h-6" />
                                    </span>
                                    <p class="font-black mt-2">
                                        {{ emptyMessage || t('dataTable.noData') }}
                                    </p>
                                </slot>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Native Table Layout -->
            <table v-else class="w-full border-collapse">
                <!-- Header -->
                <thead :class="headerClasses">
                    <tr>
                        <th v-if="expandable" class="w-10 px-2 py-3 text-center">
                            <span class="sr-only">Expand</span>
                        </th>
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
                                position: column.fixed ? 'sticky' : undefined,
                                left: column.fixed === 'left' ? `${getFixedColumnOffset(column, 'left')}px` : undefined,
                                right: column.fixed === 'right' ? `${getFixedColumnOffset(column, 'right')}px` : undefined,
                                zIndex: column.fixed ? DATA_TABLE_FIXED_COLUMN_Z_INDEX : undefined,
                            }"
                            role="columnheader"
                            :tabindex="sortable && column.sortable !== false ? 0 : undefined"
                            :aria-sort="sort.sortState.value.column === column.id ? (sort.sortState.value.direction === 'asc' ? 'ascending' : 'descending') : 'none'"
                            @click="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                            @keydown.enter="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                            @keydown.space.prevent="sortable && column.sortable !== false ? handleSort(column.id) : undefined"
                        >
                            <div class="flex items-center gap-2" :class="{ 'justify-center': column.align === 'center', 'justify-end': column.align === 'right' }">
                                <span>{{ getHeaderLabel(column) }}</span>
                                
                                <!-- Column Filter UI (Native Table) -->
                                <DataTableColumnFilter
                                    v-if="props.filterable && column.filterType"
                                    v-model:filter-state="filter.filterState.value"
                                    :column="column"
                                    :header-label="getHeaderLabel(column)"
                                />

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
                <tbody>
                    <template v-if="displayData.length > 0">
                        <template
                            v-for="(row, rowIndex) in displayData"
                            :key="selection.getRowKey(row)"
                        >
                            <!-- 主行 -->
                            <tr
                                :class="getRowClasses(row)"
                                role="row"
                                :tabindex="rowClickable ? 0 : undefined"
                                :aria-selected="selection.selectedRows.value.has(selection.getRowKey(row)) || undefined"
                                :aria-expanded="expandable ? isRowExpanded(row) : undefined"
                                @click="handleRowClick(row, $event)"
                                @keydown.enter="handleRowClick(row, $event)"
                            >
                                <td v-if="expandable" class="w-10 px-2 py-3 text-center" role="gridcell">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        class="p-1 h-auto w-auto"
                                        :aria-label="isRowExpanded(row) ? 'Collapse row' : 'Expand row'"
                                        @click.stop="toggleExpandRow(row)"
                                    >
                                        <ChevronDown
                                            v-if="isRowExpanded(row)"
                                            class="w-4 h-4 transition-transform"
                                        />
                                        <ChevronRightIcon
                                            v-else
                                            class="w-4 h-4 transition-transform"
                                        />
                                    </Button>
                                </td>
                                <td v-if="selectable" class="w-12 px-4 py-3 text-center" role="gridcell">
                                    <Checkbox
                                        :checked="selection.selectedRows.value.has(selection.getRowKey(row))"
                                        size="sm"
                                        class="cursor-pointer"
                                        @update:checked="handleToggleRow(row)"
                                    />
                                </td>
                                <td
                                    v-for="(column, columnIndex) in visibleColumns"
                                    v-show="isCellVisible(rowIndex, columnIndex)"
                                    :key="column.id"
                                    :class="getCellClasses(column)"
                                    :style="{
                                        position: column.fixed ? 'sticky' : undefined,
                                        left: column.fixed === 'left' ? `${getFixedColumnOffset(column, 'left')}px` : undefined,
                                        right: column.fixed === 'right' ? `${getFixedColumnOffset(column, 'right')}px` : undefined,
                                        zIndex: column.fixed ? DATA_TABLE_FIXED_COLUMN_Z_INDEX : undefined,
                                    }"
                                    :rowspan="getCellSpan(rowIndex, columnIndex)?.[0] || undefined"
                                    :colspan="getCellSpan(rowIndex, columnIndex)?.[1] || undefined"
                                    role="gridcell"
                                >
                                    <template v-if="column.type === 'expand'">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="p-1 h-auto w-auto"
                                            @click.stop="toggleExpandRow(row)"
                                        >
                                            <ChevronDown
                                                v-if="isRowExpanded(row)"
                                                class="w-4 h-4 transition-transform"
                                            />
                                            <ChevronRightIcon
                                                v-else
                                                class="w-4 h-4 transition-transform"
                                            />
                                        </Button>
                                    </template>
                                    <template v-else>
                                        <slot :name="`cell-${column.id}`" :row="row" :value="getCellValue(row, column)">
                                            <CellRenderer v-if="column.cell" :cell-fn="column.cell" :row="row" :value="getCellValue(row, column)" />
                                            <template v-else>
                                                {{ getCellValue(row, column) }}
                                            </template>
                                        </slot>
                                    </template>
                                </td>
                            </tr>
                            <!-- 展开行 -->
                            <tr
                                v-if="expandable && isRowExpanded(row)"
                                class="bg-brutal-muted/30"
                                role="row"
                            >
                                <td
                                    :colspan="visibleColumns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)"
                                    class="px-4 py-3"
                                    role="gridcell"
                                >
                                    <slot name="expanded-row" :row="row" :index="rowIndex" />
                                </td>
                            </tr>
                        </template>
                    </template>
                    <template v-else>
                        <tr>
                            <td
                                :colspan="visibleColumns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)"
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
        <nav v-if="paginated" :class="paginationClasses" :aria-label="t('dataTable.pagination')">
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
        </nav>

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

        <slot name="footer" />
    </div>
</template>
