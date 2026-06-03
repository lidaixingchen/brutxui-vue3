import { ref, onMounted, onUnmounted, type Ref } from 'vue'

const SAMPLE_GRID_SIZE = 8
const PROGRESS_CHECK_INTERVAL = 10
const PROGRESS_THROTTLE_MS = 150
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

export function useCanvasInteraction(options: UseCanvasInteractionOptions) {
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

    const syncCanvasSize = () => {
        const container = containerRef.value
        const canvas = canvasRef.value
        if (!container || !canvas) return

        const rect = container.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1

        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`

        ctx.value = canvas.getContext('2d')
        if (ctx.value) {
            ctx.value.scale(dpr, dpr)
            const w = canvas.width / dpr
            const h = canvas.height / dpr
            drawOverlay(ctx.value, w, h)
        }
    }

    const calculateProgress = () => {
        const canvas = canvasRef.value
        const ctxVal = ctx.value
        if (!canvas || !ctxVal) return 0

        const w = canvas.width
        const h = canvas.height
        if (w === 0 || h === 0) return 0

        const imageData = ctxVal.getImageData(0, 0, w, h)
        const pixels = imageData.data

        let totalSampled = 0
        let cleared = 0

        for (let y = 0; y < h; y += SAMPLE_GRID_SIZE) {
            for (let x = 0; x < w; x += SAMPLE_GRID_SIZE) {
                const idx = (y * w + x) * 4 + 3
                totalSampled++
                if (pixels[idx] === 0) {
                    cleared++
                }
            }
        }

        if (totalSampled === 0) return 0
        return Math.round((cleared / totalSampled) * 100)
    }

    const checkProgress = () => {
        const percent = calculateProgress()
        onProgress(percent)

        if (percent >= percentage.value) {
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
        if (drawFrameCount % PROGRESS_CHECK_INTERVAL === 0) {
            const now = Date.now()
            if (now - lastProgressTime > PROGRESS_THROTTLE_MS) {
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
        isScratching = true
        scratch(e.clientX, e.clientY)
    }

    const handlePointerMove = (e: PointerEvent) => {
        if (!isScratching) return
        scratch(e.clientX, e.clientY)
    }

    const handlePointerUp = () => {
        if (isScratching) {
            isScratching = false
            checkProgress()
        }
    }

    onMounted(() => {
        syncCanvasSize()
        if (containerRef.value) {
            resizeObserver = new ResizeObserver(syncCanvasSize)
            resizeObserver.observe(containerRef.value)
        }
    })

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect()
        }
        if (revealTimerId) {
            clearTimeout(revealTimerId)
            revealTimerId = null
        }
    })

    return {
        ctx,
        isRevealed,
        revealAll,
        syncCanvasSize,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        touchAction: 'none' as const,
    }
}
