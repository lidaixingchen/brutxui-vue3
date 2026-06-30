<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '@/lib/utils'
import { timelineOrientationKey, timelineAlternateKey } from './timeline-key'

interface TimelineItemProps {
    index?: number
    class?: string
}

const props = withDefaults(defineProps<TimelineItemProps>(), {
    index: undefined,
    class: undefined,
})

const orientation = inject(timelineOrientationKey, computed(() => 'vertical' as const))
const alternate = inject(timelineAlternateKey, computed(() => false))

const isAlternateLeft = computed(() =>
    alternate.value &&
    props.index !== undefined &&
    props.index % 2 === 0
)

const classes = computed(() =>
    cn(
        'relative flex',
        orientation.value === 'vertical'
            ? isAlternateLeft.value
                ? 'flex-row-reverse gap-4 items-stretch'
                : 'flex-row gap-4 items-stretch'
            : 'flex-col gap-4 items-center min-w-48 flex-1',
        props.class
    )
)
</script>

<template>
    <div :class="classes" role="listitem">
        <slot />
    </div>
</template>
