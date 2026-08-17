<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { type SkeletonVariantProps } from './skeleton-variants'
import Skeleton from './Skeleton.vue'

interface SkeletonTextProps {
    variant?: NonNullable<SkeletonVariantProps['variant']>
    lines?: number
    lastLineWidth?: string
    class?: string
}

const props = withDefaults(defineProps<SkeletonTextProps>(), {
    variant: 'default',
    lines: 3,
    lastLineWidth: '60%',
    class: undefined,
})

const MAX_LINES = 100
const safeLines = computed(() => Math.min(Math.max(Math.trunc(props.lines), 0), MAX_LINES))

const classes = computed(() => cn('space-y-2', props.class))
</script>

<template>
    <div :class="classes">
        <Skeleton
            v-for="index in safeLines"
            :key="index"
            :variant="variant"
            class="h-4"
            :style="{ width: index === safeLines ? props.lastLineWidth : '100%' }"
        />
    </div>
</template>
