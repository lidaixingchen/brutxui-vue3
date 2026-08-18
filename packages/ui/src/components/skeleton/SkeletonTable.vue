<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { type SkeletonVariantProps } from './skeleton-variants'
import Skeleton from './Skeleton.vue'

interface SkeletonTableProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    rows?: number
    columns?: number
    class?: string
}

const props = withDefaults(defineProps<SkeletonTableProps>(), {
    variant: 'default',
    rows: 5,
    columns: 4,
    class: undefined,
})

const MAX_ROWS = 100
const MAX_COLUMNS = 20
const safeRows = computed(() => {
    const r = Number.isFinite(props.rows) ? Math.trunc(props.rows) : 5
    return Math.min(Math.max(r, 0), MAX_ROWS)
})
const safeColumns = computed(() => {
    const c = Number.isFinite(props.columns) ? Math.trunc(props.columns) : 4
    return Math.min(Math.max(c, 0), MAX_COLUMNS)
})

const DEFAULT_CELL_WIDTH_RATIOS = [0.85, 0.7, 0.9, 0.65]

const containerClasses = computed(() =>
    cn('border-3 border-brutal overflow-hidden', props.class)
)

const rowClasses = computed(() =>
    Array.from({ length: safeRows.value }, (_, i) =>
        cn('flex', i < safeRows.value - 1 && 'border-b-3 border-brutal', i % 2 === 0 && 'bg-brutal-muted')
    )
)

const cellClasses = computed(() =>
    Array.from({ length: safeColumns.value }, (_, i) =>
        cn('flex-1 p-3', i < safeColumns.value - 1 && 'border-r-3 border-brutal')
    )
)

function getCellWidth(colIndex: number): string {
    const ratio = DEFAULT_CELL_WIDTH_RATIOS[colIndex % DEFAULT_CELL_WIDTH_RATIOS.length] ?? 0.75
    return `${ratio * 100}%`
}
</script>

<template>
    <div :class="containerClasses" role="table" aria-busy="true">
        <div v-if="safeColumns > 0" class="flex bg-brutal-accent border-b-3 border-brutal" role="row">
            <div
                v-for="(cellClass, colIndex) in cellClasses"
                :key="`header-${colIndex}`"
                :class="cellClass"
                role="columnheader"
            >
                <Skeleton :variant="variant" class="h-5 w-3/4 bg-brutal-fg/20" />
            </div>
        </div>
        <div
            v-for="(rowClass, rowIndex) in rowClasses"
            :key="`row-${rowIndex}`"
            :class="rowClass"
            role="row"
        >
            <div
                v-for="(cellClass, colIndex) in cellClasses"
                :key="`cell-${rowIndex}-${colIndex}`"
                :class="cellClass"
                role="cell"
            >
                <Skeleton
                    :variant="variant"
                    class="h-4"
                    :style="{ width: getCellWidth(colIndex) }"
                />
            </div>
        </div>
    </div>
</template>
