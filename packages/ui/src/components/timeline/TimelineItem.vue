<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '../../lib/utils'
import { timelineOrientationKey } from './timeline-key'

interface TimelineItemProps {
    class?: string
}

const props = withDefaults(defineProps<TimelineItemProps>(), {
    class: undefined,
})

const orientation = inject(timelineOrientationKey, computed(() => 'vertical' as const))

const classes = computed(() =>
    cn(
        'relative flex',
        orientation.value === 'vertical' ? 'flex-row gap-4 items-stretch' : 'flex-col gap-4 items-center min-w-48 flex-1',
        props.class
    )
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
