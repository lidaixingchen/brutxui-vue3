<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { spinnerVariants, spinnerAsciiVariants, SPINNER_ASCII_FRAMES } from './spinner-variants'

type SpinnerVariantProps = VariantProps<typeof spinnerVariants>

interface SpinnerProps {
    size?: NonNullable<SpinnerVariantProps['size']>
    variant?: NonNullable<SpinnerVariantProps['variant']> | 'ascii'
    label?: string
    class?: string
}

const props = withDefaults(defineProps<SpinnerProps>(), {
    size: 'default',
    variant: 'default',
    label: undefined,
    class: undefined,
})

const { t } = useLocale()

const resolvedLabel = computed(() => props.label?.trim() || t('spinner.loading'))

const isAscii = computed(() => props.variant === 'ascii')

const classes = computed(() =>
    // ascii 为渲染分支形态而非圆环配色，传入 CVA 前剥离（回落 default 兜底值即可，ascii 分支不消费此输出）
    cn(spinnerVariants({ size: props.size, variant: props.variant === 'ascii' ? undefined : props.variant }), props.class)
)

const asciiClasses = computed(() =>
    cn(spinnerAsciiVariants({ size: props.size }), props.class)
)

/* ASCII 帧轮换：reduced-motion 环境静止在首帧（瞬时降级） */
const prefersReducedMotion = useReducedMotion()
const frameIndex = ref(0)
let frameTimer: ReturnType<typeof setInterval> | null = null

function stopFrameTimer(): void {
    if (frameTimer !== null) {
        clearInterval(frameTimer)
        frameTimer = null
    }
}

function startFrameTimer(): void {
    if (frameTimer === null) {
        frameTimer = setInterval(() => {
            frameIndex.value = (frameIndex.value + 1) % SPINNER_ASCII_FRAMES.length
        }, 80)
    }
}

watch(
    () => ({ ascii: isAscii.value, reduced: prefersReducedMotion.value }),
    ({ ascii, reduced }) => {
        if (ascii && !reduced) startFrameTimer()
        else stopFrameTimer()
    },
    { immediate: false, deep: false },
)

onMounted(() => {
    if (isAscii.value && !prefersReducedMotion.value) startFrameTimer()
})

onUnmounted(stopFrameTimer)
</script>

<template>
    <div
        v-if="isAscii"
        :class="asciiClasses"
        role="status"
        :aria-label="resolvedLabel"
    >
        <span aria-hidden="true" class="font-mono font-black text-brutal-fg select-none">{{ SPINNER_ASCII_FRAMES[frameIndex] }}</span>
        <span class="sr-only">{{ resolvedLabel }}</span>
    </div>
    <div v-else :class="classes" role="status" :aria-label="resolvedLabel">
        <span class="sr-only">{{ resolvedLabel }}</span>
    </div>
</template>
