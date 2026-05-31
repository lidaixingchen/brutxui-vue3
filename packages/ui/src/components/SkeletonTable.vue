<script setup lang="ts">
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/utils'
import { skeletonVariants } from './skeleton-variants'
import Skeleton from './Skeleton.vue'

type SkeletonVariantProps = VariantProps<typeof skeletonVariants>

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
})

const cellWidths = [0.85, 0.7, 0.9, 0.65]
</script>

<template>
    <div :class="cn('border-3 border-black dark:border-white overflow-hidden', props.class)">
        <div class="flex bg-[#FFE66D] border-b-3 border-black dark:border-white">
            <div
                v-for="colIndex in props.columns"
                :key="`header-${colIndex}`"
                :class="cn('flex-1 p-3', colIndex < props.columns && 'border-r-3 border-black dark:border-white')"
            >
                <Skeleton :variant="variant" class="h-5 w-3/4 bg-black/20" />
            </div>
        </div>
        <div
            v-for="rowIndex in props.rows"
            :key="`row-${rowIndex}`"
            :class="cn('flex', rowIndex < props.rows && 'border-b-3 border-black dark:border-white', rowIndex % 2 === 0 && 'bg-gray-50 dark:bg-gray-800')"
        >
            <div
                v-for="colIndex in props.columns"
                :key="`cell-${rowIndex}-${colIndex}`"
                :class="cn('flex-1 p-3', colIndex < props.columns && 'border-r-3 border-black dark:border-white')"
            >
                <Skeleton
                    :variant="variant"
                    class="h-4"
                    :style="{ width: `${(cellWidths[(colIndex - 1) % cellWidths.length] ?? 0.75) * 100}%` }"
                />
            </div>
        </div>
    </div>
</template>
