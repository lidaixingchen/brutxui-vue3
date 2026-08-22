<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue'
import { useLocale } from '@/composables/useLocale'
import { useThrottle } from '@/composables/useThrottle'
import { getCanvas2DContext, getDevicePixelRatio, getResizeObserverCtor, getViewportSize, hasDocument, getWindow, getDocument, getComputedStyle } from '@/lib/env'
import { Z_INDEX } from '@/lib/z-index'
import { cn } from '@/lib/utils'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import Button from '../button/Button.vue'
import type { TourProps, TourStep } from './types'

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

const showMask = computed(() => {
    const step = props.steps[currentStep.value]
    return (step?.mask ?? props.mask) ?? true
})

const popoverClasses = computed(() =>
    cn(
        'fixed p-5 flex flex-col gap-4 max-w-sm min-w-[280px] select-none',
        brutalFloatingSurfaceClasses
    )
)

const getTargetElement = (target: string | HTMLElement | undefined): HTMLElement | null => {
    if (!target) {
        return null
    }
    if (typeof target === 'string') {
        if (!hasDocument) return null
        return getDocument()!.querySelector(target)
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

    const nextW = Math.round(width * dpr)
    const nextH = Math.round(height * dpr)
    if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
    }
    if (canvas.style.width !== `${width}px`) canvas.style.width = `${width}px`
    if (canvas.style.height !== `${height}px`) canvas.style.height = `${height}px`

    if (ctx.setTransform) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    } else if (ctx.resetTransform) {
        ctx.resetTransform()
        ctx.scale?.(dpr, dpr)
    } else {
        canvas.width = nextW
        ctx.scale?.(dpr, dpr)
    }
    ctx.clearRect(0, 0, width, height)

    if (showMask.value) {
        ctx.fillStyle = CANVAS_ALPHA_FILL
        ctx.fillRect(0, 0, width, height)
    }

    if (highlightRect.value) {
        const { left, top, width: rectW, height: rectH } = highlightRect.value

        if (showMask.value) {
            ctx.clearRect(left, top, rectW, rectH)
        }

        let strokeColor = BORDER_FALLBACK_COLOR
        if (hasDocument) {
            const style = getComputedStyle(getDocument()!.documentElement)
            strokeColor = style?.getPropertyValue('--brutal-black').trim() || BORDER_FALLBACK_COLOR
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

let positionRequestId = 0
let isUnmounted = false

const updatePosition = async (): Promise<void> => {
    const requestId = ++positionRequestId
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

    if (requestId !== positionRequestId || isUnmounted || !isOpen.value) return

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
    if (resizeObserver && hasDocument) {
        const body = getDocument()?.body
        if (body) {
            resizeObserver.observe(body)
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
    const target = e.target as HTMLElement
    if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || tag === 'SELECT' || target.isContentEditable) {
            return
        }
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
    [isOpen, currentStep, () => props.steps],
    async ([newOpen]): Promise<void> => {
        if (!newOpen) {
            cleanupResizeObserver()
            return
        }
        // steps 缩短时钳制 currentStep，避免越界后既不能前进也不能完成（卡死）
        if (props.steps.length > 0 && currentStep.value > props.steps.length - 1) {
            currentStep.value = props.steps.length - 1
            return
        }
        await nextTick()
        if (isUnmounted) return
        await updatePosition()
        if (isUnmounted) return
        setupResizeObserver()
    },
    { immediate: true }
)

onMounted((): void => {
    const win = getWindow()
    win?.addEventListener('resize', handleScrollOrResize, { passive: true })
    win?.addEventListener('scroll', handleScrollOrResize, { passive: true })
    win?.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount((): void => {
    isUnmounted = true
    const win = getWindow()
    win?.removeEventListener('resize', handleScrollOrResize)
    win?.removeEventListener('scroll', handleScrollOrResize)
    win?.removeEventListener('keydown', handleKeyDown)
    cleanupResizeObserver()
})
</script>

<template>
    <div v-if="isOpen && steps.length > 0" class="brutx-tour">
        <canvas
            ref="canvasRef"
            class="fixed inset-0"
            :class="showMask ? 'pointer-events-auto' : 'pointer-events-none'"
            :style="{ zIndex: Z_INDEX.TOUR_CANVAS }"
        />
        <div
            ref="popoverRef"
            role="dialog"
            :aria-modal="showMask ? 'true' : undefined"
            :aria-label="currentStepVal?.title || t('tour.dialog')"
            :style="[popoverStyle, { zIndex: Z_INDEX.TOUR_POPOVER }]"
            :class="[popoverClasses, 'hud-crosshairs']"
        >
            <!-- 取景瞄准框顶栏：等宽步骤指示（纯装饰，读屏语义由 role=dialog + aria-label 承担） -->
            <div
                v-if="steps.length > 0"
                aria-hidden="true"
                class="flex items-center justify-end border-b-2 border-brutal pb-1 font-mono text-xs font-black uppercase tracking-widest text-brutal-muted-foreground select-none"
            >
                STEP [{{ String(currentStep + 1).padStart(2, '0') }}/{{ String(steps.length).padStart(2, '0') }}]
            </div>
            <div v-if="currentStepVal?.title" class="text-lg font-black tracking-wide border-b-2 border-brutal pb-2">
                {{ currentStepVal.title }}
            </div>
            <div v-if="currentStepVal?.description" class="text-sm font-medium leading-relaxed">
                {{ currentStepVal.description }}
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t-2 border-brutal-dashed">
                <div>
                    <Button
                        variant="default"
                        size="sm"
                        class="px-2.5 py-1 text-xs uppercase"
                        @click="handleSkip"
                    >
                        {{ texts.skip }}
                    </Button>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        v-if="currentStep > 0"
                        variant="default"
                        size="sm"
                        class="px-2.5 py-1 text-xs uppercase"
                        @click="handlePrev"
                    >
                        {{ texts.prev }}
                    </Button>
                    <Button
                        variant="accent"
                        size="sm"
                        class="px-2.5 py-1 text-xs uppercase"
                        @click="handleNextOrFinish"
                    >
                        {{ currentStep === steps.length - 1 ? texts.finish : texts.next }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
