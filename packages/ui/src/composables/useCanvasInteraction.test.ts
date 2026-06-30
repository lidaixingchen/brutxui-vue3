import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useCanvasInteraction } from './useCanvasInteraction'

// Mock canvas context
const mockCtx = {
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(100 * 100 * 4),
    })),
    globalCompositeOperation: '',
}

// Mock HTMLCanvasElement
const mockCanvas = {
    width: 100,
    height: 100,
    style: { width: '', height: '' },
    getContext: vi.fn(() => mockCtx),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
} as unknown as HTMLCanvasElement

// Mock HTMLDivElement
const mockContainer = {
    clientWidth: 100,
    clientHeight: 100,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
} as unknown as HTMLDivElement

describe('useCanvasInteraction', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.stubGlobal('window', {
            devicePixelRatio: 1,
            ResizeObserver: vi.fn(() => ({
                observe: vi.fn(),
                disconnect: vi.fn(),
            })),
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('initializes with isRevealed as false', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(false)

        const { isRevealed } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted: vi.fn(),
            drawOverlay: vi.fn(),
        })

        expect(isRevealed.value).toBe(false)
    })

    it('revealAll sets isRevealed to true', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(false)
        const onCompleted = vi.fn()

        const { isRevealed, revealAll } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted,
            drawOverlay: vi.fn(),
        })

        revealAll()
        expect(isRevealed.value).toBe(true)
    })

    it('revealAll calls onCompleted after fade duration', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(false)
        const onCompleted = vi.fn()

        const { revealAll } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted,
            drawOverlay: vi.fn(),
        })

        revealAll()
        vi.advanceTimersByTime(500)
        expect(onCompleted).toHaveBeenCalled()
    })

    it('revealAll calls onCompleted immediately when prefersReducedMotion is true', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(true)
        const onCompleted = vi.fn()

        const { revealAll } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted,
            drawOverlay: vi.fn(),
        })

        revealAll()
        expect(onCompleted).toHaveBeenCalled()
    })

    it('revealAll does nothing when already revealed', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(false)
        const onCompleted = vi.fn()

        const { revealAll } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted,
            drawOverlay: vi.fn(),
        })

        revealAll()
        revealAll() // Second call should be no-op
        vi.advanceTimersByTime(500)
        expect(onCompleted).toHaveBeenCalledTimes(1)
    })

    it('syncCanvasSize initializes canvas', () => {
        const containerRef = ref(mockContainer)
        const canvasRef = ref(mockCanvas)
        const brushRadius = ref(20)
        const percentage = ref(50)
        const fadeDuration = ref(500)
        const prefersReducedMotion = ref(false)
        const drawOverlay = vi.fn()

        const { syncCanvasSize } = useCanvasInteraction({
            containerRef,
            canvasRef,
            brushRadius,
            percentage,
            fadeDuration,
            prefersReducedMotion,
            onProgress: vi.fn(),
            onCompleted: vi.fn(),
            drawOverlay,
        })

        syncCanvasSize()
        expect(mockCanvas.getContext).toHaveBeenCalledWith('2d')
    })
})
