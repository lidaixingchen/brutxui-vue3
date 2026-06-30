<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import {
    SliderRoot as SliderRootPrimitive,
    SliderTrack as SliderTrackPrimitive,
    SliderRange as SliderRangePrimitive,
    SliderThumb as SliderThumbPrimitive,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import {
    sliderRootVariants,
    sliderTrackVariants,
    sliderThumbVariants,
    sliderRangeVariants,
    sliderMarkVariants,
    sliderTooltipVariants,
} from './slider-variants'

type SliderRootVariantProps = VariantProps<typeof sliderRootVariants>
type SliderTrackVariantProps = VariantProps<typeof sliderTrackVariants>
type SliderThumbVariantProps = VariantProps<typeof sliderThumbVariants>

interface SliderProps {
    modelValue?: number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    ariaLabel?: string
    size?: NonNullable<SliderTrackVariantProps['size']>
    variant?: NonNullable<SliderThumbVariantProps['variant']>
    orientation?: NonNullable<SliderRootVariantProps['orientation']>
    marks?: number[]
    showTooltip?: boolean
    class?: string
}

const props = withDefaults(defineProps<SliderProps>(), {
    modelValue: undefined,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    ariaLabel: undefined,
    size: 'default',
    variant: 'default',
    orientation: 'horizontal',
    marks: undefined,
    showTooltip: false,
    class: undefined,
})

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()

const activeThumb = ref(-1)
const tooltipId = `slider-tooltip-${useId()}`

const rootClasses = computed(() =>
    cn(sliderRootVariants({ orientation: props.orientation }), props.class)
)

const trackClasses = computed(() =>
    cn(sliderTrackVariants({ size: props.size, orientation: props.orientation }))
)

const thumbClasses = computed(() =>
    cn(sliderThumbVariants({ size: props.size, variant: props.variant }))
)

const rangeClasses = computed(() =>
    cn(sliderRangeVariants({ variant: props.variant, orientation: props.orientation }))
)

const markClasses = computed(() =>
    cn(sliderMarkVariants({ orientation: props.orientation }))
)

const tooltipClasses = computed(() =>
    cn(sliderTooltipVariants())
)

const thumbCount = computed(() => {
    if (props.modelValue && props.modelValue.length > 0) return props.modelValue.length
    return 1
})

function valueToPercentage(value: number): number {
    const range = props.max - props.min
    if (range <= 0) return 0
    return ((value - props.min) / range) * 100
}

function markStyle(mark: number): Record<string, string> {
    const pct = valueToPercentage(mark)
    if (props.orientation === 'vertical') {
        return {
            bottom: `${pct}%`,
            left: '50%',
            transform: 'translate(-50%, 50%)',
        }
    }
    return {
        left: `${pct}%`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
    }
}

function tooltipTextFor(values: number[] | null | undefined): string {
    if (activeThumb.value < 0 || !values || values.length === 0) return ''
    const value = values[activeThumb.value]
    return value === undefined ? '' : String(value)
}

function tooltipStyleFor(values: number[] | null | undefined): Record<string, string> | undefined {
    if (activeThumb.value < 0 || !values || values.length === 0) return undefined
    const value = values[activeThumb.value]
    if (value === undefined) return undefined
    const pct = valueToPercentage(value)
    const style: Record<string, string> = { transform: '' }
    if (props.orientation === 'vertical') {
        style.bottom = `${pct}%`
        style.left = '0'
        style.transform = 'translate(-100%, 50%)'
    } else {
        style.left = `${pct}%`
        style.top = '0'
        style.transform = 'translate(-50%, -100%)'
    }
    return style
}

function handleThumbFocus(index: number) {
    activeThumb.value = index
}
function handleThumbBlur(index: number) {
    Promise.resolve().then(() => {
        if (activeThumb.value === index) {
            activeThumb.value = -1
        }
    })
}
</script>

<template>
    <SliderRootPrimitive
        :model-value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :orientation="orientation"
        :aria-label="ariaLabel"
        :class="rootClasses"
        @update:model-value="emit('update:modelValue', $event ?? [0])"
    >
        <template #default="{ modelValue: slotValues }">
            <SliderTrackPrimitive :class="trackClasses">
                <SliderRangePrimitive :class="rangeClasses" />
                <span
                    v-for="(mark, index) in marks"
                    :key="`mark-${index}`"
                    :class="markClasses"
                    :style="markStyle(mark)"
                    aria-hidden="true"
                />
            </SliderTrackPrimitive>
            <SliderThumbPrimitive
                v-for="(_, index) in thumbCount"
                :key="index"
                :class="thumbClasses"
                :aria-describedby="showTooltip && activeThumb === index ? tooltipId : undefined"
                @focus="handleThumbFocus(index)"
                @blur="handleThumbBlur(index)"
                @pointerenter="handleThumbFocus(index)"
                @pointerleave="handleThumbBlur(index)"
            />
            <span
                v-if="showTooltip && activeThumb >= 0"
                :id="tooltipId"
                :class="tooltipClasses"
                :style="tooltipStyleFor(slotValues)"
                role="tooltip"
            >{{ tooltipTextFor(slotValues) }}</span>
        </template>
    </SliderRootPrimitive>
</template>
