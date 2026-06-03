<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import { progressRootVariants, progressIndicatorVariants } from './progress-variants'

type ProgressRootVariantProps = VariantProps<typeof progressRootVariants>
type ProgressIndicatorVariantProps = VariantProps<typeof progressIndicatorVariants>

interface ProgressProps {
    class?: string
    modelValue?: number
    max?: number
    size?: NonNullable<ProgressRootVariantProps['size']>
    variant?: NonNullable<ProgressIndicatorVariantProps['variant']>
}

const props = withDefaults(defineProps<ProgressProps>(), {
    class: undefined,
    modelValue: 0,
    max: 100,
    size: 'default',
    variant: 'default',
})

const classes = computed(() =>
    cn(progressRootVariants({ size: props.size }), props.class)
)

const indicatorClasses = computed(() =>
    cn(progressIndicatorVariants({ variant: props.variant }))
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
            :class="indicatorClasses"
            :style="{ transform: `translateX(-${100 - percentage}%)` }"
        />
    </ProgressRoot>
</template>
