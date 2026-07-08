<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue'
import { getCanvas2DContext, getDevicePixelRatio, hasDocument } from '@/lib/env'
import { cn } from '@/lib/utils'
import { FALLBACK_PRIMARY_COLOR, FALLBACK_SECONDARY_COLOR, FALLBACK_FG_COLOR } from '@/lib/theme-fallbacks'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useCanvasInteraction } from '@/composables/useCanvasInteraction'
import { useLocale } from '@/composables/useLocale'
import { scratchCardVariants } from './scratch-card-variants'

const DEFAULT_PERCENTAGE = 50
const DEFAULT_BRUSH_RADIUS = 20
const DEFAULT_FADE_DURATION = 300

const PRIMARY_STRIPE_WIDTH = 10
const SECONDARY_STRIPE_WIDTH = 2
const STRIPE_SPACING = 20
const SECONDARY_STRIPE_OFFSET = 5

interface ScratchCardProps {
    percentage?: number
    brushRadius?: number
    overlayColor?: string
    fadeDuration?: number
    class?: string
}

const props = withDefaults(defineProps<ScratchCardProps>(), {
    percentage: DEFAULT_PERCENTAGE,
    brushRadius: DEFAULT_BRUSH_RADIUS,
    overlayColor: undefined,
    fadeDuration: DEFAULT_FADE_DURATION,
    class: undefined,
})

const emit = defineEmits<{
    progress: [percent: number]
    completed: []
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasRemoved = ref(false)
const prefersReducedMotion = useReducedMotion()
const { t } = useLocale()

const drawOverlay = (ctxVal: CanvasRenderingContext2D, w: number, h: number) => {
    ctxVal.clearRect(0, 0, w, h)

    if (props.overlayColor) {
        ctxVal.fillStyle = props.overlayColor
        ctxVal.fillRect(0, 0, w, h)
    } else {
        let primary = FALLBACK_PRIMARY_COLOR
        let secondary = FALLBACK_SECONDARY_COLOR
        let fg = FALLBACK_FG_COLOR
        if (hasDocument) {
            const rootStyle = getComputedStyle(document.documentElement)
            primary = rootStyle.getPropertyValue('--brutal-primary').trim() || primary
            secondary = rootStyle.getPropertyValue('--brutal-secondary').trim() || secondary
            fg = rootStyle.getPropertyValue('--brutal-fg').trim() || fg
        }

        ctxVal.fillStyle = secondary
        ctxVal.fillRect(0, 0, w, h)

        ctxVal.strokeStyle = primary
        ctxVal.lineWidth = PRIMARY_STRIPE_WIDTH
        for (let i = -h; i < w + h; i += STRIPE_SPACING) {
            ctxVal.beginPath()
            ctxVal.moveTo(i, 0)
            ctxVal.lineTo(i + h, h)
            ctxVal.stroke()
        }

        ctxVal.strokeStyle = fg
        ctxVal.lineWidth = SECONDARY_STRIPE_WIDTH
        for (let i = -h; i < w + h; i += STRIPE_SPACING) {
            ctxVal.beginPath()
            ctxVal.moveTo(i + SECONDARY_STRIPE_OFFSET, 0)
            ctxVal.lineTo(i + SECONDARY_STRIPE_OFFSET + h, h)
            ctxVal.stroke()
        }
    }
}

const {
    isRevealed,
    revealAll,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    touchAction,
} = useCanvasInteraction({
    containerRef,
    canvasRef,
    brushRadius: toRef(props, 'brushRadius'),
    percentage: toRef(props, 'percentage'),
    fadeDuration: toRef(props, 'fadeDuration'),
    prefersReducedMotion,
    onProgress: (percent) => emit('progress', percent),
    onCompleted: () => emit('completed'),
    drawOverlay,
})

defineExpose({
    isRevealed,
    revealAll,
})

const containerClasses = computed(() =>
    cn(scratchCardVariants(), props.class)
)

const canvasStyle = computed(() => {
    const duration = prefersReducedMotion.value ? 0 : props.fadeDuration
    return {
        transition: `opacity ${duration}ms ease-out`,
        opacity: isRevealed.value ? 0 : 1,
    }
})

function resetCanvasOverlay() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctxVal = getCanvas2DContext(canvas)
    if (!ctxVal) return
    const dpr = getDevicePixelRatio()
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    drawOverlay(ctxVal, w, h)
}

watch(isRevealed, (revealed) => {
    if (!revealed) {
        canvasRemoved.value = false
        resetCanvasOverlay()
    }
})
</script>

<template>
    <div
        ref="containerRef"
        :class="containerClasses"
        role="region"
        :aria-label="t('scratchCard.ariaLabel')"
        tabindex="0"
        @keydown.enter="revealAll"
        @keydown.space.prevent="revealAll"
    >
        <div class="scratch-card-content w-full h-full">
            <slot />
        </div>
        <canvas
            v-show="!canvasRemoved"
            ref="canvasRef"
            class="absolute inset-0 cursor-crosshair select-none z-10"
            :style="{ ...canvasStyle, touchAction }"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
            @transitionend="canvasRemoved = true"
        />
    </div>
</template>
