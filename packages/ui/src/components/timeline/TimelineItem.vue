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
        'relative flex gap-4',
        orientation.value === 'vertical'
            ? [isAlternateLeft.value ? 'flex-row-reverse' : 'flex-row', 'items-stretch last:[&_[data-timeline-connector]]:mb-0']
            : 'flex-col items-center min-w-48 flex-1 last:[&_[data-timeline-connector]]:end-0',
        alternate.value && 'has-[>[data-timeline-separator]]:grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] [&>[data-timeline-separator]]:col-start-2 [&>[data-timeline-separator]]:row-start-1 [&>[data-timeline-content]]:row-start-1',
        isAlternateLeft.value && '[&>[data-timeline-content]]:col-start-1 [&>[data-timeline-content]]:text-end',
        alternate.value && !isAlternateLeft.value && '[&>[data-timeline-content]]:col-start-3',
        props.class
    )
)
</script>

<template>
    <div :class="classes" role="listitem">
        <slot />
    </div>
</template>
