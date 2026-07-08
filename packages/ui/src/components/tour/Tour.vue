<script setup lang="ts">
/* global ScrollIntoViewOptions */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useThrottle } from '@/composables/useThrottle'
import { getCanvas2DContext, getDevicePixelRatio, getResizeObserverCtor, getViewportSize, hasDocument } from '@/lib/env'
import { Z_INDEX } from '@/lib/z-index'

export interface TourStep {
    target: string | HTMLElement
    title?: string
    description?: string
    placement?: 'top' | 'bottom' | 'left' | 'right'
    mask?: boolean
}

export interface TourProps {
    steps: TourStep[]
    mask?: boolean
    scrollIntoViewOptions?: ScrollIntoViewOptions
}

const props = withDefaults(defineProps<TourProps>(), {
    mask: true,
    scrollIntoViewOptions: undefined,
})

const emit = defineEmits<{
    (e: 'skip'): void
    (e: 'finish'): void
    (e: 'close'): void
}>()

const currentStep = defineModel<number>('current', { default: 0 })
const isOpen = defineModel<boolean>('open', { default: true })

const BORDER_WIDTH = 2
const POPOVER_GAP = 12
const VIEWPORT_MARGIN = 8
const BORDER_FALLBACK_COLOR = '#000000'
const CANVAS_ALPHA_FILL = 'rgba(0, 0, 0, 0.5)'
const SCROLL_THROTTLE_MS = 100

const canvasRef = ref<HTMLCanvasElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const highlightRect = ref<{ left: number; top: number; width: number; height: number } | null>(null)

const popoverStyle = ref<CSSProperties>({
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: 'translate3d(0px, 0px, 0)',
    visibility: 'hidden',
    zIndex: Z_INDEX.TOUR_POPOVER,
})

const { t } = useLocale()

const texts = computed<{ prev: string; next: string; finish: string; skip: string }>(() => {
    return {
        prev: t('tour.prev'),
        next: t('tour.next'),
        finish: t('tour.finish'),
        skip: t('tour.skip'),
    }
})

const currentStepVal = computed<TourStep | undefined>(() => {
    return props.steps[currentStep.value]
})

const getTargetElement = (target: string | HTMLElement | undefined): HTMLElement | null => {
    if (!target) {
        return null
    }
    if (typeof target === 'string') {
        if (!hasDocument) return null
        return document.querySelector(target)
    }
    return target
}

const drawCanvas = (): void => {
    const canvas = canvasRef.value
    if (!canvas) {
        return
    }
    const ctx = getCanvas2DContext(canvas)
    if (!ctx) {
        return
    }

    const dpr = getDevicePixelRatio()
    const { width, height } = getViewportSize()

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const step = props.steps[currentStep.value]
    const showMask = (step?.mask ?? props.mask) ?? true

    if (showMask) {
        ctx.fillStyle = CANVAS_ALPHA_FILL
        ctx.fillRect(0, 0, width, height)
    }

    if (highlightRect.value) {
        const { left, top, width: rectW, height: rectH } = highlightRect.value

        if (showMask) {
            ctx.clearRect(left, top, rectW, rectH)
        }

        let strokeColor = BORDER_FALLBACK_COLOR
        if (hasDocument) {
            const style = getComputedStyle(document.documentElement)
            strokeColor = style.getPropertyValue('--brutal-black').trim() || BORDER_FALLBACK_COLOR
        }

        ctx.strokeStyle = strokeColor
        ctx.lineWidth = BORDER_WIDTH
        ctx.lineJoin = 'miter'

        const drawL = Math.round(left)
        const drawT = Math.round(top)
        const drawW = Math.round(rectW)
        const drawH = Math.round(rectH)

        ctx.strokeRect(drawL, drawT, drawW, drawH)
    }
}

const updatePopoverPosition = (): void => {
    const popover = popoverRef.value
    if (!popover) {
        return
    }

    const step = props.steps[currentStep.value]
    const placement = step?.placement || 'bottom'

    const popoverW = popover.offsetWidth
    const popoverH = popover.offsetHeight
    const { width: viewportWidth, height: viewportHeight } = getViewportSize()

    if (!highlightRect.value) {
        const left = (viewportWidth - popoverW) / 2
        const top = (viewportHeight - popoverH) / 2
        popoverStyle.value = {
            position: 'fixed',
            left: '0px',
            top: '0px',
            transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`,
            visibility: 'visible',
            zIndex: Z_INDEX.TOUR_POPOVER,
        }
        return
    }

    const { left: targetL, top: targetT, width: targetW, height: targetH } = highlightRect.value

    let popoverLeft = 0
    let popoverTop = 0

    switch (placement) {
        case 'top':
            popoverLeft = targetL + (targetW - popoverW) / 2
            popoverTop = targetT - popoverH - POPOVER_GAP
            break
        case 'bottom':
            popoverLeft = targetL + (targetW - popoverW) / 2
            popoverTop = targetT + targetH + POPOVER_GAP
            break
        case 'left':
            popoverLeft = targetL - popoverW - POPOVER_GAP
            popoverTop = targetT + (targetH - popoverH) / 2
            break
        case 'right':
            popoverLeft = targetL + targetW + POPOVER_GAP
            popoverTop = targetT + (targetH - popoverH) / 2
            break
    }

    popoverLeft = Math.max(VIEWPORT_MARGIN, Math.min(viewportWidth - popoverW - VIEWPORT_MARGIN, popoverLeft))
    popoverTop = Math.max(VIEWPORT_MARGIN, Math.min(viewportHeight - popoverH - VIEWPORT_MARGIN, popoverTop))

    popoverStyle.value = {
        position: 'fixed',
        left: '0px',
        top: '0px',
        transform: `translate3d(${Math.round(popoverLeft)}px, ${Math.round(popoverTop)}px, 0)`,
        visibility: 'visible',
        zIndex: Z_INDEX.TOUR_POPOVER,
    }
}

const recalculatePosition = (): void => {
    const step = props.steps[currentStep.value]
    if (!step) {
        return
    }
    const el = getTargetElement(step.target)
    if (!el) {
        highlightRect.value = null
        drawCanvas()
        updatePopoverPosition()
        return
    }
    const rect = el.getBoundingClientRect()
    highlightRect.value = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
    }
    drawCanvas()
    updatePopoverPosition()
}

const updatePosition = async (): Promise<void> => {
    const step = props.steps[currentStep.value]
    if (!step) {
        return
    }

    const el = getTargetElement(step.target)
    if (!el) {
        highlightRect.value = null
        drawCanvas()
        updatePopoverPosition()
        return
    }

    el.scrollIntoView(props.scrollIntoViewOptions || { block: 'center', inline: 'nearest' })

    await nextTick()

    const rect = el.getBoundingClientRect()
    highlightRect.value = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
    }

    drawCanvas()
    updatePopoverPosition()
}

let resizeObserver: ResizeObserver | null = null
// 防止 async watch 在 await 期间组件卸载后继续创建新的 ResizeObserver
let isUnmounted = false

const initResizeObserver = (): void => {
    const ResizeObserverCtor = getResizeObserverCtor()
    if (!ResizeObserverCtor) {
        return
    }
    resizeObserver = new ResizeObserverCtor((): void => {
        recalculatePosition()
    })
}

const cleanupResizeObserver = (): void => {
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
}

const setupResizeObserver = (): void => {
    cleanupResizeObserver()
    if (!resizeObserver) {
        initResizeObserver()
    }
    const step = props.steps[currentStep.value]
    if (step) {
        const el = getTargetElement(step.target)
        if (el && resizeObserver) {
            resizeObserver.observe(el)
        }
    }
}

const handleSkip = (): void => {
    isOpen.value = false
    emit('skip')
    emit('close')
}

const handlePrev = (): void => {
    if (currentStep.value > 0) {
        currentStep.value -= 1
    }
}

const handleNext = (): void => {
    if (currentStep.value < props.steps.length - 1) {
        currentStep.value += 1
    }
}

const handleFinish = (): void => {
    isOpen.value = false
    emit('finish')
    emit('close')
}

const handleNextOrFinish = (): void => {
    if (currentStep.value === props.steps.length - 1) {
        handleFinish()
    } else {
        handleNext()
    }
}

const handleKeyDown = (e: KeyboardEvent): void => {
    if (!isOpen.value) {
        return
    }
    if (e.key === 'Escape') {
        e.preventDefault()
        handleSkip()
    } else if (e.key === 'Enter') {
        e.preventDefault()
        handleNextOrFinish()
    }
}

const onScrollOrResize = (): void => {
    if (!isOpen.value) {
        return
    }
    recalculatePosition()
}

const { throttled: handleScrollOrResize } = useThrottle(onScrollOrResize, SCROLL_THROTTLE_MS)

watch(
    [isOpen, currentStep],
    async ([newOpen]): Promise<void> => {
        if (!newOpen) {
            cleanupResizeObserver()
            return
        }
        await nextTick()
        // 卸载发生在 await 期间时停止后续操作，避免泄漏 ResizeObserver
        if (isUnmounted) return
        await updatePosition()
        if (isUnmounted) return
        setupResizeObserver()
    },
    { immediate: true }
)

onMounted((): void => {
    window.addEventListener('resize', handleScrollOrResize, { passive: true })
    window.addEventListener('scroll', handleScrollOrResize, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount((): void => {
    isUnmounted = true
    window.removeEventListener('resize', handleScrollOrResize)
    window.removeEventListener('scroll', handleScrollOrResize)
    window.removeEventListener('keydown', handleKeyDown)
    cleanupResizeObserver()
})
</script>

<template>
    <div v-if="isOpen && steps.length > 0" class="brutx-tour">
        <canvas
            ref="canvasRef"
            class="fixed inset-0 pointer-events-auto"
            :style="{ zIndex: Z_INDEX.TOUR_CANVAS }"
        />
        <div
            ref="popoverRef"
            :style="[popoverStyle, { zIndex: Z_INDEX.TOUR_POPOVER }]"
            class="fixed bg-brutal-bg text-brutal-fg border-3 border-brutal-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-5 flex flex-col gap-4 max-w-sm rounded-brutal min-w-[280px] select-none"
        >
            <div v-if="currentStepVal?.title" class="text-lg font-black tracking-wide border-b-2 border-brutal-black dark:border-white pb-2">
                {{ currentStepVal.title }}
            </div>
            <div v-if="currentStepVal?.description" class="text-sm font-medium leading-relaxed">
                {{ currentStepVal.description }}
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t-2 border-brutal-black dark:border-white border-dashed">
                <div>
                    <button
                        type="button"
                        class="px-2.5 py-1 text-xs font-black uppercase bg-brutal-bg text-brutal-fg border-2 border-brutal-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all cursor-pointer"
                        @click="handleSkip"
                    >
                        {{ texts.skip }}
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <button
                        v-if="currentStep > 0"
                        type="button"
                        class="px-2.5 py-1 text-xs font-black uppercase bg-brutal-bg text-brutal-fg border-2 border-brutal-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all cursor-pointer"
                        @click="handlePrev"
                    >
                        {{ texts.prev }}
                    </button>
                    <button
                        type="button"
                        class="px-2.5 py-1 text-xs font-black uppercase bg-brutal-accent text-brutal-accent-foreground border-2 border-brutal-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all cursor-pointer"
                        @click="handleNextOrFinish"
                    >
                        {{ currentStep === steps.length - 1 ? texts.finish : texts.next }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
