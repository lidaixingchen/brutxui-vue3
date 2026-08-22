<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '@/lib/utils'
import { timelineOrientationKey } from './timeline-key'

interface TimelineConnectorProps {
    class?: string
}

const props = withDefaults(defineProps<TimelineConnectorProps>(), {
    class: undefined,
})

const orientation = inject(timelineOrientationKey, computed(() => 'vertical' as const))

const classes = computed(() =>
    cn(
        // PCB 双平行总线：双线中缝透出底色（电路板走线隐喻），取代单实线条
        'shrink-0 transition-colors',
        orientation.value === 'vertical'
            ? 'w-[9px] border-l-3 border-r-3 border-brutal flex-1 min-h-8'
            : 'absolute inset-x-0 top-1/2 -translate-y-1/2 h-[9px] border-t-3 border-b-3 border-brutal',
        props.class
    )
)
</script>

<template>
    <div :class="classes" />
</template>
