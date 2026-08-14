import { ref, readonly, watch, onUnmounted, type Ref } from 'vue'
import { CANVAS_SAMPLE_GRID_SIZE, CANVAS_PROGRESS_CHECK_FRAME_INTERVAL, CANVAS_PROGRESS_THROTTLE_MS, CANVAS_PROGRESS_SAMPLE_WIDTH, CANVAS_PROGRESS_SAMPLE_MAX_HEIGHT, CANVAS_ALPHA_CLEARED_THRESHOLD } from '../lib/defaults'
import { createCanvasElement, getCanvas2DContext, getDevicePixelRatio, getResizeObserverCtor } from '../lib/env'

const REVEAL_COMPLETED_FALLBACK_DURATION = 0

interface UseCanvasInteractionOptions {
    containerRef: Ref<HTMLDivElement | null>
    canvasRef: Ref<HTMLCanvasElement | null>
    brushRadius: Ref<number>
    percentage: Ref<number>
    fadeDuration: Ref<number>
    prefersReducedMotion: Ref<boolean>
    onProgress: (percent: number) => void
    onCompleted: () => void
    drawOverlay: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
}

export interface UseCanvasInteractionReturn {
    /** 画布 2D 上下文（能力引用，外部可能设置绘制属性，保持可写） */
    ctx: Ref<CanvasRenderingContext2D | null>
    /** 只读视图：完成态由 revealAll / 内部进度判定维护 */
    isRevealed: Readonly<Ref<boolean>>
    revealAll: () => void
    syncCanvasSize: () => void
    handlePointerDown: (e: PointerEvent) => void
    handlePointerMove: (e: PointerEvent) => void
    handlePointerUp: (e: PointerEvent) => void
    touchAction: 'none'
}

export function useCanvasInteraction(options: UseCanvasInteractionOptions): UseCanvasInteractionReturn {
    const {
        containerRef,
        canvasRef,
        brushRadius,
        percentage,
        fadeDuration,
        prefersReducedMotion,
        onProgress,
        onCompleted,
        drawOverlay,
    } = options

    const ctx = ref<CanvasRenderingContext2D | null>(null)
    const isRevealed = ref(false)

    let isScratching = false
    let resizeObserver: ResizeObserver | null = null
    let drawFrameCount = 0
    let lastProgressTime = 0
    let revealTimerId: ReturnType<typeof setTimeout> | null = null
    let initialized = false
    let baselineMask: Uint8ClampedArray | null = null

    const syncCanvasSize = () => {
        const container = containerRef.value
        const canvas = canvasRef.value
        if (!container || !canvas) return

        // 用内部 initialized 标志判断是否已初始化，而不是依赖 canvas.style 是否被显式设置：
        // 模板/外部若给 canvas 预设了内联宽高（如 style="width:100%;height:100%"），
        // style 判断会把首次调用的空画布误当作"旧内容"，导致 drawOverlay 永远不被调用。
        let tempCanvas: HTMLCanvasElement | null = null
        let hasOldContent = false
        let oldDpr = getDevicePixelRatio()
        if (initialized) {
            const oldCtx = getCanvas2DContext(canvas)
            const parsedStyleWidth = parseFloat(canvas.style.width)
            oldDpr = (oldCtx && canvas.width > 0 && Number.isFinite(parsedStyleWidth) && parsedStyleWidth > 0)
                ? canvas.width / parsedStyleWidth
                : getDevicePixelRatio()
            if (oldCtx && canvas.width > 0 && canvas.height > 0) {
                try {
                    tempCanvas = createCanvasElement()
                    if (!tempCanvas) {
                        throw new Error('Canvas is unavailable')
                    }
                    tempCanvas.width = canvas.width
                    tempCanvas.height = canvas.height
                    const tempCtx = getCanvas2DContext(tempCanvas)
                    if (tempCtx && typeof tempCtx.drawImage === 'function') {
                        tempCtx.drawImage(canvas, 0, 0)
                        hasOldContent = true
                    } else {
                        tempCanvas = null
                    }
                } catch {
                    tempCanvas = null
                }
            }
        }

        const rect = container.getBoundingClientRect()
        const dpr = getDevicePixelRatio()

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        ctx.value = getCanvas2DContext(canvas)
        if (ctx.value) {
            ctx.value.scale(dpr, dpr)
            const w = canvas.width / dpr
            const h = canvas.height / dpr

            if (hasOldContent && tempCanvas) {
                // 恢复之前保存的内容，保留用户已刮除的进度
                ctx.value.drawImage(tempCanvas, 0, 0, tempCanvas.width / oldDpr, tempCanvas.height / oldDpr, 0, 0, w, h)
            } else {
                // 首次初始化或画布尚未实际绘制过覆盖层时，绘制覆盖层
                drawOverlay(ctx.value, w, h)
                // 每次实际重绘覆盖层后都以当前 alpha 掩码作为相对刮除基准：
                // 避免首次 0 尺寸/未完成布局时基准永久缺失，或 resize 宽高比变化后尺寸失配。
                // 若覆盖层初始即全透明（无有效 opaque 区域），则不建立基准，
                // 进度判定回退为按当前 alpha 阈值直接统计。
                const sampled = sampleAlphaGrid()
                baselineMask = sampled && sampled.alphas.some((a) => a >= CANVAS_ALPHA_CLEARED_THRESHOLD)
                    ? sampled.alphas
                    : null
            }

            initialized = true
        }
    }

    const sampleAlphaGrid = (): { alphas: Uint8ClampedArray; w: number; h: number } | null => {
        const canvas = canvasRef.value
        const ctxVal = ctx.value
        if (!canvas || !ctxVal) return null
        const w = canvas.width
        const h = canvas.height
        if (w === 0 || h === 0) return null

        // 先缩放到固定小尺寸的临时 canvas 再读取像素，
        // 避免高分屏/大画布下全量 getImageData(0,0,w,h) 的像素缓冲分配与拷贝造成明显卡顿
        const sw = CANVAS_PROGRESS_SAMPLE_WIDTH
        const sh = Math.max(1, Math.min(Math.round((h / w) * sw), CANVAS_PROGRESS_SAMPLE_MAX_HEIGHT))
        const thumb = createCanvasElement()
        if (!thumb) return null
        thumb.width = sw
        thumb.height = sh
        const thumbCtx = getCanvas2DContext(thumb)
        if (!thumbCtx) return null
        thumbCtx.drawImage(canvas, 0, 0, sw, sh)
        const data = thumbCtx.getImageData(0, 0, sw, sh).data
        const alphas = new Uint8ClampedArray(sw * sh)
        for (let i = 0; i < sw * sh; i++) {
            alphas[i] = data[i * 4 + 3]
        }
        return { alphas, w: sw, h: sh }
    }

    const calculateProgress = () => {
        const sample = sampleAlphaGrid()
        if (!sample) return 0
        const { alphas, w, h } = sample

        let totalSampled = 0
        let cleared = 0

        // 以初始覆盖层 alpha 掩码为基准计算相对刮除比例：初始就透明的点不参与统计，
        // 避免覆盖层本身含透明/半透明区域（PNG 素材、圆角、渐隐遮罩）时初始进度即非 0，
        // 进而导致无需刮擦就触发 revealAll/onCompleted。
        // alpha 用阈值判定而非严格 ===0：缩略图 drawImage 缩放会产生抗锯齿中间值，
        // 严格等 0 会漏掉细刮痕导致进度系统性偏低
        const baseline = baselineMask !== null && baselineMask.length === alphas.length ? baselineMask : null
        for (let y = 0; y < h; y += CANVAS_SAMPLE_GRID_SIZE) {
            for (let x = 0; x < w; x += CANVAS_SAMPLE_GRID_SIZE) {
                const idx = y * w + x
                if (baseline && baseline[idx] < CANVAS_ALPHA_CLEARED_THRESHOLD) {
                    continue
                }
                totalSampled++
                if (alphas[idx] < CANVAS_ALPHA_CLEARED_THRESHOLD) {
                    cleared++
                }
            }
        }

        if (totalSampled === 0) return 0
        return Math.round((cleared / totalSampled) * 100)
    }

    const checkProgress = () => {
        // 已揭晓后不再上报进度：避免 onCompleted（经 setTimeout 延迟触发）与
        // 后续进度上报的时序混淆，调用方难以判断"已完成"与"进度上报"的顺序
        if (isRevealed.value) return
        const percent = calculateProgress()
        onProgress(percent)

        // percentage <= 0 时跳过自动完成判定：任意一次轻触（首次 checkProgress）都会立即 revealAll 是误判
        if (percentage.value > 0 && percent >= percentage.value) {
            revealAll()
        }
    }

    const scratch = (clientX: number, clientY: number) => {
        const canvas = canvasRef.value
        const ctxVal = ctx.value
        if (!canvas || !ctxVal || isRevealed.value) return

        const rect = canvas.getBoundingClientRect()
        const x = clientX - rect.left
        const y = clientY - rect.top

        ctxVal.save()
        ctxVal.globalCompositeOperation = 'destination-out'
        ctxVal.beginPath()
        ctxVal.arc(x, y, brushRadius.value, 0, Math.PI * 2)
        ctxVal.fill()
        ctxVal.restore()

        drawFrameCount++
        if (drawFrameCount % CANVAS_PROGRESS_CHECK_FRAME_INTERVAL === 0) {
            const now = Date.now()
            if (now - lastProgressTime > CANVAS_PROGRESS_THROTTLE_MS) {
                checkProgress()
                lastProgressTime = now
            }
        }
    }

    const revealAll = () => {
        if (isRevealed.value) return
        isRevealed.value = true

        const duration = prefersReducedMotion.value ? REVEAL_COMPLETED_FALLBACK_DURATION : fadeDuration.value
        revealTimerId = setTimeout(() => {
            onCompleted()
            revealTimerId = null
        }, duration)
    }

    const handlePointerDown = (e: PointerEvent) => {
        if (!(e.target instanceof Element)) return
        isScratching = true
        try {
            e.target.setPointerCapture(e.pointerId)
        } catch {
            // 捕获失败（如 pointerId 已失效、部分触控/异常环境）时降级继续：
            // 仅放弃指针捕获，后续 pointermove 依赖常规事件流（元素内移动）继续工作，
            // 避免本次 pointerdown 的首笔刮擦被丢弃导致用户首笔操作无响应
        }
        scratch(e.clientX, e.clientY)
    }

    const handlePointerMove = (e: PointerEvent) => {
        if (!isScratching) return
        // buttons === 0 表示指针未按下：捕获失败降级（无指针捕获）时 pointerup
        // 若发生在元素外可能未送达，此处兜底结束刮擦，避免 isScratching 泄漏
        // 导致后续未按下的移动持续刮擦覆盖层
        if (e.buttons === 0) {
            isScratching = false
            return
        }
        scratch(e.clientX, e.clientY)
    }

    const handlePointerUp = (e: PointerEvent) => {
        if (isScratching) {
            if (e.target instanceof Element) {
                try {
                    e.target.releasePointerCapture(e.pointerId)
                } catch {
                    // Pointer may not be captured
                }
            }
            isScratching = false
            checkProgress()
        }
    }

    watch(
        [containerRef, canvasRef],
        ([newContainer, newCanvas], [oldContainer]) => {
            if (oldContainer && resizeObserver && oldContainer !== newContainer) {
                resizeObserver.unobserve(oldContainer)
            }
            if (newContainer && newCanvas) {
                syncCanvasSize()
                const ResizeObserverCtor = getResizeObserverCtor()
                if (ResizeObserverCtor) {
                    if (!resizeObserver) {
                        resizeObserver = new ResizeObserverCtor(syncCanvasSize)
                    }
                    if (oldContainer !== newContainer) {
                        resizeObserver.observe(newContainer)
                    }
                }
            }
        },
        { immediate: true, flush: 'post' }
    )

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = null
        }
        if (revealTimerId) {
            clearTimeout(revealTimerId)
            revealTimerId = null
        }
    })

    return {
        ctx,
        isRevealed: readonly(isRevealed),
        revealAll,
        syncCanvasSize,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        touchAction: 'none' as const,
    }
}
