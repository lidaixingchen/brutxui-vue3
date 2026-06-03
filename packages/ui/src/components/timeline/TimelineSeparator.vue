<script setup lang="ts">
import { inject, computed } from 'vue'
import { cn } from '../../lib/utils'
import { timelineOrientationKey } from './timeline-key'

interface TimelineSeparatorProps {
    class?: string
}

const props = withDefaults(defineProps<TimelineSeparatorProps>(), {
    class: undefined,
})

const orientation = inject(timelineOrientationKey, computed(() => 'vertical' as const))

const classes = computed(() =>
    cn(
        'relative flex items-center shrink-0',
        orientation.value === 'vertical' ? 'flex-col' : 'flex-row w-full justify-center',
        props.class
    )
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
