<script setup lang="ts">
import { computed } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import {
    SliderRoot as SliderRootPrimitive,
    SliderTrack as SliderTrackPrimitive,
    SliderRange as SliderRangePrimitive,
    SliderThumb as SliderThumbPrimitive,
} from 'reka-ui'
import { cn } from '../../lib/utils'
import { sliderTrackVariants, sliderThumbVariants, sliderRangeVariants } from './slider-variants'

type SliderTrackVariantProps = VariantProps<typeof sliderTrackVariants>
type SliderThumbVariantProps = VariantProps<typeof sliderThumbVariants>

interface SliderProps {
    defaultValue?: number[]
    modelValue?: number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    ariaLabel?: string
    size?: NonNullable<SliderTrackVariantProps['size']>
    variant?: NonNullable<SliderThumbVariantProps['variant']>
    class?: string
}

const props = withDefaults(defineProps<SliderProps>(), {
    defaultValue: undefined,
    modelValue: undefined,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    ariaLabel: undefined,
    size: 'default',
    variant: 'default',
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()

const rootClasses = computed(() =>
    cn('relative flex w-full touch-none select-none items-center', props.class)
)

const trackClasses = computed(() =>
    cn(sliderTrackVariants({ size: props.size }))
)

const thumbClasses = computed(() =>
    cn(sliderThumbVariants({ size: props.size, variant: props.variant }))
)

const rangeClasses = computed(() =>
    cn(sliderRangeVariants({ variant: props.variant }))
)

const thumbCount = computed(() => {
    if (props.modelValue) return props.modelValue.length
    if (props.defaultValue) return props.defaultValue.length
    return 1
})
</script>

<template>
    <SliderRootPrimitive
        :default-value="defaultValue"
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="ariaLabel"
        :class="rootClasses"
        @update:model-value="emit('update:modelValue', $event ?? [0])"
    >
        <SliderTrackPrimitive :class="trackClasses">
            <SliderRangePrimitive :class="rangeClasses" />
        </SliderTrackPrimitive>
        <SliderThumbPrimitive
            v-for="(_, index) in thumbCount"
            :key="index"
            :class="thumbClasses"
        />
    </SliderRootPrimitive>
</template>
