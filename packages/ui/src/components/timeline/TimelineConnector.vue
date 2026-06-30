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
        'bg-brutal-fg transition-all shrink-0',
        orientation.value === 'vertical' ? 'w-[3px] flex-1 min-h-8' : 'absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px]',
        props.class
    )
)
</script>

<template>
    <div :class="classes" />
</template>
