<script setup lang="ts">
import { ref, computed, toRef, watch, onMounted, onUnmounted } from 'vue'
import { createCanvasElement, getCanvas2DContext, getDevicePixelRatio, getComputedStyle, getMutationObserverCtor } from '@/lib/env'
import { cn, FOCUS_RING_CLASSES } from '@/lib/utils'
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

type OverlayColors = readonly [primary: string, secondary: string, foreground: string]
let paintedColors: OverlayColors | undefined
let themeObserver: MutationObserver | undefined

function readOverlayColors(): OverlayColors {
    const styles = containerRef.value ? getComputedStyle(containerRef.value) : undefined
    return [
        styles?.getPropertyValue('--brutal-primary').trim() || FALLBACK_PRIMARY_COLOR,
        styles?.getPropertyValue('--brutal-secondary').trim() || FALLBACK_SECONDARY_COLOR,
        styles?.getPropertyValue('--brutal-fg').trim() || FALLBACK_FG_COLOR,
    ]
}

const drawOverlay = (ctxVal: CanvasRenderingContext2D, w: number, h: number, colors?: OverlayColors) => {
    ctxVal.clearRect(0, 0, w, h)

    if (props.overlayColor) {
        ctxVal.fillStyle = props.overlayColor
        ctxVal.fillRect(0, 0, w, h)
    } else {
        paintedColors = colors ?? readOverlayColors()
        const [primary, secondary, fg] = paintedColors

        ctxVal.fillStyle = secondary
        ctxVal.fillRect(0, 0, w, h)

        ctxVal.strokeStyle = primary
        ctxVal.lineWidth = PRIMARY_STRIPE_WIDTH
        for (let i = -h; i < w + h + STRIPE_SPACING; i += STRIPE_SPACING) {
            ctxVal.beginPath()
            ctxVal.moveTo(i, 0)
            ctxVal.lineTo(i + h, h)
            ctxVal.stroke()
        }

        ctxVal.strokeStyle = fg
        ctxVal.lineWidth = SECONDARY_STRIPE_WIDTH
        for (let i = -h; i < w + h + STRIPE_SPACING; i += STRIPE_SPACING) {
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

function refreshOverlayTheme() {
    const canvas = canvasRef.value
    if (!canvas?.width || !canvas.height || props.overlayColor || isRevealed.value) return
    const colors = readOverlayColors()
    if (paintedColors?.every((value, index) => value === colors[index])) return

    const mask = createCanvasElement()
    const ctx = getCanvas2DContext(canvas)
    if (!mask || !ctx) return
    mask.width = canvas.width
    mask.height = canvas.height
    const maskCtx = getCanvas2DContext(mask)
    if (!maskCtx) return
    maskCtx.drawImage(canvas, 0, 0)

    const dpr = getDevicePixelRatio()
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawOverlay(ctx, canvas.width / dpr, canvas.height / dpr, colors)
    // 新涂层沿用原有透明度，保留已经刮开的区域及其边缘。
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(mask, 0, 0)
    ctx.restore()
}

onMounted(() => {
    const Observer = getMutationObserverCtor()
    if (!Observer) return
    themeObserver = new Observer(refreshOverlayTheme)
    for (let scope: HTMLElement | null = containerRef.value; scope; scope = scope.parentElement) {
        themeObserver.observe(scope, { attributes: true, attributeFilter: ['class', 'style'] })
    }
})

defineExpose({
    isRevealed,
    revealAll,
})

const containerClasses = computed(() =>
    cn(scratchCardVariants(), FOCUS_RING_CLASSES, props.class)
)

const canvasClasses = computed(() =>
    cn('absolute inset-0 cursor-crosshair select-none z-10', isRevealed.value && 'pointer-events-none')
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
    ctxVal.setTransform(dpr, 0, 0, dpr, 0, 0)
    const w = canvas.width / dpr
    const h = canvas.height / dpr
    drawOverlay(ctxVal, w, h)
}

// 移除画布的定时器：不依赖 @transitionend（duration=0 时部分浏览器不派发该事件，
// 且重置场景下 0→1 过渡同样触发 transitionend 会把刚恢复的覆盖层再次隐藏），
// 改为按淡出时长定时移除
let removeTimer: ReturnType<typeof setTimeout> | null = null

function clearRemoveTimer() {
    if (removeTimer) {
        clearTimeout(removeTimer)
        removeTimer = null
    }
}

watch(isRevealed, (revealed) => {
    clearRemoveTimer()
    if (revealed) {
        // 已揭示：等淡出动画结束后移除透明画布，避免其以 z-10 + cursor-crosshair 悬浮拦截指针事件
        const duration = prefersReducedMotion.value ? 0 : props.fadeDuration
        removeTimer = setTimeout(() => {
            canvasRemoved.value = true
            removeTimer = null
        }, duration)
    } else {
        canvasRemoved.value = false
        resetCanvasOverlay()
    }
})

onUnmounted(() => {
    clearRemoveTimer()
    themeObserver?.disconnect()
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
            :class="canvasClasses"
            :style="{ ...canvasStyle, touchAction }"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointercancel="handlePointerUp"
        />
    </div>
</template>
