<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'

interface TimelineContentProps {
    class?: string
}

const props = withDefaults(defineProps<TimelineContentProps>(), {
    class: undefined,
})

const classes = computed(() =>
    cn('flex-1 min-w-0 pb-4 text-sm font-bold text-brutal-fg', props.class)
)
</script>

<template>
    <div :class="classes">
        <slot />
    </div>
</template>
