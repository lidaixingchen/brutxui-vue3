<script setup lang="ts" generic="T extends object = Record<string, unknown>">
import { computed, ref } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { DEFAULT_PAGE_SIZE } from '@/composables/useDataTablePagination'
import { cn } from '@/lib/utils'
import DataTable from '../data-table/DataTable.vue'
import type { DataTableColumn } from '../data-table/types'
import type { ColumnDef, DataTableSectionProps } from './types'

export type { ColumnDef, DataTableSectionProps }

const props = withDefaults(defineProps<DataTableSectionProps<T>>(), {
    title: undefined,
    columns: () => [],
    rows: () => [],
    searchable: true,
    pageSize: DEFAULT_PAGE_SIZE,
    rowKey: undefined,
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<{
    'row-click': [row: T]
    'sort': [payload: { key: keyof T & string; direction: 'asc' | 'desc' | null }]
}>()

const { t } = useLocale()

const resolvedTitle = computed(() => props.title ?? t('dataTableSection.defaultTitle'))
const resolvedSearchPlaceholder = computed(() => t('dataTableSection.searchPlaceholder'))
const resolvedNoResults = computed(() => t('dataTableSection.noResults'))

const dataTableColumns = computed<DataTableColumn<T>[]>(() =>
    props.columns.map((column) => ({
        id: column.key,
        header: column.label,
        accessorKey: column.key as keyof T & string,
        sortable: column.sortable === true,
    }))
)

const hasSortableColumns = computed(() => props.columns.some((column) => column.sortable === true))
const hasPagination = computed(() => props.rows.length > props.pageSize)

const resolvedRowKey = computed<keyof T | ((row: T) => string | number)>(() => {
    if (props.rowKey) return props.rowKey as keyof T
    return (row: T) => props.rows.indexOf(row)
})

const rootClasses = computed(() => cn('w-full max-w-5xl mx-auto overflow-hidden', props.class))
const lastSortColumn = ref<keyof T & string | null>(null)

function handleSort(column: string, direction: 'asc' | 'desc' | null) {
    const key = column ? column as keyof T & string : lastSortColumn.value
    if (!key) return
    lastSortColumn.value = direction ? key : null
    emit('sort', { key, direction })
}
</script>

<template>
    <div v-if="$slots.default" :class="cn('border-3 border-brutal rounded-brutal shadow-brutal-lg bg-brutal-bg', rootClasses)">
        <slot name="header">
            <div class="border-b-3 border-brutal px-6 py-4">
                <h2 class="text-3xl font-black tracking-tight">
                    {{ resolvedTitle }}
                </h2>
            </div>
        </slot>
        <div class="p-6">
            <slot />
        </div>
        <slot name="footer" />
    </div>

    <DataTable
        v-else
        :data="rows"
        :columns="dataTableColumns"
        :row-key="resolvedRowKey"
        :sortable="hasSortableColumns"
        :filterable="searchable"
        :paginated="hasPagination"
        :page-size="pageSize"
        :empty-message="resolvedNoResults"
        :filter-placeholder="resolvedSearchPlaceholder"
        :title="resolvedTitle"
        :class="rootClasses"
        row-clickable
        section
        @sort="handleSort"
        @row-click="emit('row-click', $event)"
    >
        <template v-if="$slots.header" #header>
            <slot name="header" />
        </template>

        <template v-if="$slots.footer" #footer>
            <slot name="footer" />
        </template>
    </DataTable>
</template>
