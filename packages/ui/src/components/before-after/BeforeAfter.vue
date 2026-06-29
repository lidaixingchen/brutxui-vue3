<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MoveHorizontal } from '@lucide/vue'
import { cn } from '../../lib/utils'
import { useLocale } from '@/composables/useLocale'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { beforeAfterRootVariants, beforeAfterHandleVariants } from './before-after-variants'
import { iconSizeVariants, type IconSize } from '../../lib/icon-size-variants'

const DEFAULT_SLIDER_POSITION = 50

interface BeforeAfterProps {
    before: string
    after: string
    beforeAlt?: string
    afterAlt?: string
    defaultValue?: number
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
    class?: string
    iconSize?: IconSize
}

const props = withDefaults(defineProps<BeforeAfterProps>(), {
    beforeAlt: undefined,
    afterAlt: undefined,
    defaultValue: DEFAULT_SLIDER_POSITION,
    disabled: false,
    orientation: 'horizontal',
    class: undefined,
    iconSize: 'default',
})

const { t } = useLocale()
const prefersReducedMotion = useReducedMotion()

const resolvedBeforeAlt = computed(() => props.beforeAlt ?? t('beforeAfter.before'))
const resolvedAfterAlt = computed(() => props.afterAlt ?? t('beforeAfter.after'))

const sliderVal = ref(props.defaultValue)

watch(() => props.defaultValue, (val) => {
    sliderVal.value = val
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

const rootClasses = computed(() =>
    cn(beforeAfterRootVariants({ orientation: props.orientation }), props.class)
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
    <div :class="rootClasses">
        <img
            :src="before"
            :alt="resolvedBeforeAlt"
            class="absolute inset-0 w-full h-full object-cover pointer-events-none"
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
