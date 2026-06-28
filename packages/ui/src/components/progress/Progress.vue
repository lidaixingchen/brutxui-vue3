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
    indeterminate?: boolean
    showLabel?: boolean
}

const props = withDefaults(defineProps<ProgressProps>(), {
    class: undefined,
    modelValue: 0,
    max: 100,
    size: 'default',
    variant: 'default',
    indeterminate: false,
    showLabel: false,
})

const classes = computed(() =>
    cn(progressRootVariants({ size: props.size }), props.class)
)

const indicatorClasses = computed(() =>
    cn(
        progressIndicatorVariants({ variant: props.variant }),
        props.indeterminate && 'w-1/2 animate-indeterminate',
    )
)

const indicatorStyle = computed(() => {
    if (props.indeterminate) return undefined
    return { transform: `translateX(-${100 - percentage.value}%)` }
})

const percentage = computed(() => {
    const max = props.max ?? 100
    const value = props.modelValue ?? 0
    const raw = max > 0 ? (value / max) * 100 : 0
    return Math.min(100, Math.max(0, raw))
})

const rootModelValue = computed(() => props.indeterminate ? null : props.modelValue)

const labelClasses = 'absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference pointer-events-none'
</script>

<template>
    <ProgressRoot :class="classes" :model-value="rootModelValue" :max="max">
        <ProgressIndicator
            :class="indicatorClasses"
            :style="indicatorStyle"
            aria-hidden="true"
        />
        <span v-if="showLabel && !indeterminate" :class="labelClasses">{{ Math.round(percentage) }}%</span>
    </ProgressRoot>
</template>
