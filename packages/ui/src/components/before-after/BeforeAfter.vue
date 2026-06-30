<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MoveHorizontal } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { beforeAfterHandleVariants } from './before-after-variants'
import { iconSizeVariants, type IconSize } from '@/lib/icon-size-variants'

const DEFAULT_SLIDER_POSITION = 50

interface BeforeAfterProps {
    before: string
    after: string
    beforeAlt?: string
    afterAlt?: string
    modelValue?: number
    defaultValue?: number
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<BeforeAfterProps>(), {
    beforeAlt: undefined,
    afterAlt: undefined,
    modelValue: undefined,
    defaultValue: DEFAULT_SLIDER_POSITION,
    disabled: false,
    orientation: 'horizontal',
    class: undefined,
    iconSize: 'default',
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const { t } = useLocale()
const prefersReducedMotion = useReducedMotion()

const imageWidth = ref(0)
const imageHeight = ref(0)

function handleImageLoad(event: Event) {
    const img = event.target as HTMLImageElement
    if (img.naturalWidth && img.naturalHeight) {
        imageWidth.value = img.naturalWidth
        imageHeight.value = img.naturalHeight
    }
}

const aspectRatio = computed(() => {
    if (imageWidth.value && imageHeight.value) {
        return `${imageWidth.value} / ${imageHeight.value}`
    }
    return props.orientation === 'vertical' ? '9 / 16' : '16 / 9'
})

const resolvedBeforeAlt = computed(() => props.beforeAlt ?? t('beforeAfter.before'))
const resolvedAfterAlt = computed(() => props.afterAlt ?? t('beforeAfter.after'))

const internalSliderVal = ref(props.modelValue ?? props.defaultValue)

watch(() => props.modelValue ?? props.defaultValue, (val) => {
    if (val !== undefined) internalSliderVal.value = val
})

const sliderVal = computed<number>({
    get: () => internalSliderVal.value,
    set: (val) => {
        internalSliderVal.value = val
        emit('update:modelValue', val)
    },
})

const motionTransition = computed(() =>
    prefersReducedMotion.value ? '' : 'transition-[left,top,clip-path] duration-100 ease-out'
)

const clipStyle = computed(() => {
    if (props.orientation === 'vertical') {
        return { clipPath: `inset(0 0 ${100 - sliderVal.value}% 0)` }
    }
    return { clipPath: `inset(0 ${100 - sliderVal.value}% 0 0)` }
})

const sliderStyle = computed(() => {
    if (props.orientation === 'vertical') {
        return { top: `${sliderVal.value}%` }
    }
    return { left: `${sliderVal.value}%` }
})

const sliderLineClasses = computed(() =>
    cn(
        'absolute bg-brutal-fg pointer-events-none z-10',
        props.orientation === 'vertical'
            ? 'left-0 right-0 h-[4px] -translate-y-1/2'
            : 'top-0 bottom-0 w-[4px] -translate-x-1/2',
        motionTransition.value,
    )
)

const rootStyle = computed(() => ({
    aspectRatio: aspectRatio.value,
}))

const rootClasses = computed(() =>
    cn(
        'relative overflow-hidden w-full border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal select-none',
        props.class
    )
)

const handleClasses = computed(() =>
    cn(
        beforeAfterHandleVariants({ orientation: props.orientation }),
        motionTransition.value,
    )
)

const iconClasses = computed(() =>
    cn(
        iconSizeVariants({ size: props.iconSize }),
        'stroke-[3] text-brutal-primary-foreground',
        props.orientation === 'vertical' && 'rotate-90'
    )
)

const inputClasses = computed(() =>
    cn(
        'absolute inset-0 w-full h-full opacity-0 z-30 disabled:cursor-not-allowed',
        props.orientation === 'vertical' ? 'cursor-ns-resize' : 'cursor-ew-resize'
    )
)

const inputStyle = computed(() => {
    if (props.orientation === 'vertical') {
        return { writingMode: 'vertical-rl' as const }
    }
    return undefined
})
</script>

<template>
    <div :class="rootClasses" :style="rootStyle">
        <img
            :src="before"
            :alt="resolvedBeforeAlt"
            class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            @load="handleImageLoad"
        >

        <div
            class="absolute inset-0 w-full h-full pointer-events-none"
            :class="motionTransition"
            :style="clipStyle"
        >
            <img
                :src="after"
                :alt="resolvedAfterAlt"
                class="absolute inset-0 w-full h-full object-cover pointer-events-none"
            >
        </div>

        <div
            :class="sliderLineClasses"
            :style="sliderStyle"
        />

        <div
            :class="handleClasses"
            :style="sliderStyle"
        >
            <MoveHorizontal :class="iconClasses" />
        </div>

        <input
            v-model="sliderVal"
            type="range"
            min="0"
            max="100"
            :disabled="disabled"
            :aria-label="t('beforeAfter.comparisonSlider')"
            :class="inputClasses"
            :style="inputStyle"
            :orient="orientation === 'vertical' ? 'vertical' : undefined"
        >
    </div>
</template>
