<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '../../lib/utils'
import { ProgressRoot, ProgressIndicator } from 'reka-ui'

interface ProgressProps {
    class?: string
    modelValue?: number
    max?: number
}

const props = withDefaults(defineProps<ProgressProps>(), {
    class: undefined,
    modelValue: 0,
    max: 100,
})

const classes = computed(() =>
    cn(
        'relative h-6 w-full overflow-hidden rounded-brutal',
        'border-3 border-brutal bg-brutal-bg',
        'shadow-brutal-sm',
        props.class
    )
)

const percentage = computed(() => {
    const max = props.max ?? 100
    const value = props.modelValue ?? 0
    const raw = max > 0 ? (value / max) * 100 : 0
    return Math.min(100, Math.max(0, raw))
})
</script>

<template>
    <ProgressRoot :class="classes" :model-value="modelValue" :max="max">
        <ProgressIndicator
            class="h-full w-full flex-1 bg-brutal-primary transition-all duration-300 ease-out"
            :style="{ transform: `translateX(-${100 - percentage}%)` }"
        />
    </ProgressRoot>
</template>
