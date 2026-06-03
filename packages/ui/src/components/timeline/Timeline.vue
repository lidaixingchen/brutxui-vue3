<script setup lang="ts">
import { provide, computed } from 'vue'
import { cn } from '../../lib/utils'
import { timelineOrientationKey, type TimelineOrientation } from './timeline-key'

interface TimelineProps {
    orientation?: TimelineOrientation
    class?: string
}

const props = withDefaults(defineProps<TimelineProps>(), {
    orientation: 'vertical',
    class: undefined,
})

provide(timelineOrientationKey, computed(() => props.orientation))

const classes = computed(() =>
    cn(
        'flex w-full',
        props.orientation === 'vertical' ? 'flex-col gap-6' : 'flex-row gap-6 items-start overflow-x-auto',
        props.class
    )
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
