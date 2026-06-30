<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import { computed, ref } from 'vue'
import { ArrowUpDown, ArrowUp, ArrowDown } from '@lucide/vue'
import { useLocale } from '@/composables/useLocale'
import { DEFAULT_PAGE_SIZE } from '@/composables/useDataTablePagination'
import { cn } from '../../lib/utils'
import { iconSizeVariants } from '../../lib/icon-size-variants'
import Table from '../table/Table.vue'
import TableHeader from '../table/TableHeader.vue'
import TableBody from '../table/TableBody.vue'
import TableRow from '../table/TableRow.vue'
import TableHead from '../table/TableHead.vue'
import TableCell from '../table/TableCell.vue'
import Pagination from '../pagination/Pagination.vue'
import Input from '../input/Input.vue'
import type { ColumnDef, DataTableSectionProps } from './types'

export type { ColumnDef, DataTableSectionProps }

const props = withDefaults(defineProps<DataTableSectionProps>(), {
    title: undefined,
    columns: () => [],
    rows: () => [],
    searchable: true,
    pageSize: DEFAULT_PAGE_SIZE,
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<{
    'row-click': [row: T]
    'sort': [payload: { key: keyof T & string; direction: 'asc' | 'desc' }]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('dataTableSection.defaultTitle'))
const resolvedSearchPlaceholder = computed(() => t('dataTableSection.searchPlaceholder'))
const resolvedNoResults = computed(() => t('dataTableSection.noResults'))

const searchQuery = ref('')
const sortKey = ref<keyof T | ''>('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)

const filteredRows = computed(() => {
    if (!searchQuery.value) return props.rows
    const query = searchQuery.value.toLowerCase()
    return props.rows.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(query)
        )
    )
})

const sortedRows = computed(() => {
    if (!sortKey.value) return filteredRows.value
    const key = sortKey.value as keyof T & string
    const dir = sortDirection.value
    return [...filteredRows.value].sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return dir === 'asc' ? -1 : 1
        if (bVal == null) return dir === 'asc' ? 1 : -1
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        return dir === 'asc' ? cmp : -cmp
    })
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedRows.value.length / props.pageSize)))

const paginatedRows = computed(() => {
    const start = (currentPage.value - 1) * props.pageSize
    return sortedRows.value.slice(start, start + props.pageSize)
})

function handleSort(key: string) {
    if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = key as keyof T
        sortDirection.value = 'asc'
    }
    currentPage.value = 1
    emit('sort', { key: key as keyof T & string, direction: sortDirection.value })
}

function handleRowClick(row: unknown) {
    // Vue 泛型组件模板中，T 类型通过 computed 链会退化为默认约束类型 Record<string, unknown>
    // 此处 row 运行时实际为 T，但 TypeScript 无法从模板推断，需断言
    if (row !== null && typeof row === 'object') {
        emit('row-click', row as T)
    }
}

function handleSearch() {
    currentPage.value = 1
}

const rootClasses = computed(() => cn(
    'w-full max-w-5xl mx-auto',
    'border-3 border-brutal rounded-brutal shadow-brutal-lg bg-brutal-bg overflow-hidden',
    props.class,
))

const sortIconClasses = computed(() =>
    cn(iconSizeVariants({ size: props.iconSize }), 'stroke-[3]')
)

const columnClasses = computed(() =>
    props.columns.map(col =>
        cn(col.sortable && 'cursor-pointer select-none active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all')
    )
)

function sortIcon(key: string) {
    if (sortKey.value !== key) return ArrowUpDown
    return sortDirection.value === 'asc' ? ArrowUp : ArrowDown
}
</script>

<template>
    <div :class="rootClasses">
        <slot name="header">
            <div class="border-b-3 border-brutal px-6 py-4">
                <h2 class="text-3xl font-black tracking-tight">
                    {{ resolvedTitle }}
                </h2>
            </div>
        </slot>

        <slot>
            <div class="p-6">
                <div v-if="searchable" class="mb-4">
                    <Input
                        v-model="searchQuery"
                        :placeholder="resolvedSearchPlaceholder"
                        @update:model-value="handleSearch"
                    />
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                v-for="(col, index) in columns"
                                :key="col.key"
                                :class="columnClasses[index]"
                                @click="col.sortable && handleSort(col.key)"
                            >
                                <span class="inline-flex items-center gap-1">
                                    {{ col.label }}
                                    <component
                                        :is="sortIcon(col.key)"
                                        v-if="col.sortable"
                                        :class="sortIconClasses"
                                    />
                                </span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <template v-if="paginatedRows.length > 0">
                            <TableRow
                                v-for="(row, rowIndex) in paginatedRows"
                                :key="rowKey ? String(row[rowKey]) : rowIndex"
                                class="cursor-pointer active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all"
                                tabindex="0"
                                @click="handleRowClick(row)"
                                @keydown.enter="handleRowClick(row)"
                            >
                                <TableCell v-for="col in columns" :key="col.key">
                                    {{ row[col.key] }}
                                </TableCell>
                            </TableRow>
                        </template>
                        <TableRow v-else>
                            <TableCell :colspan="columns.length || 1" class="text-center text-brutal-fg font-black py-8">
                                {{ resolvedNoResults }}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                <div v-if="totalPages > 1" class="mt-4 flex justify-center">
                    <Pagination
                        v-model="currentPage"
                        :total-pages="totalPages"
                    />
                </div>
            </div>
        </slot>

        <slot name="footer" />
    </div>
</template>
