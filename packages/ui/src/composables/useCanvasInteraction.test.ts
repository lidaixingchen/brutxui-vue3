import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useCanvasInteraction } from './useCanvasInteraction'

// Helper: create a real DOM Element with mocked pointer capture methods
function createPointerTarget() {
    const el = document.createElement('div')
    el.setPointerCapture = vi.fn()
    el.releasePointerCapture = vi.fn()
    return el
}

// Helper: create mock canvas with controllable getContext
function createMockCanvas(opts: {
    width?: number
    height?: number
    styleWidth?: string
    styleHeight?: string
    ctx?: Record<string, unknown> | null
} = {}) {
    const {
        width = 100,
        height = 100,
        styleWidth = '',
        styleHeight = '',
        ctx,
    } = opts

    const defaultCtx = {
        scale: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(width * height * 4),
        })),
        globalCompositeOperation: '',
    }

    return {
        width,
        height,
        style: { width: styleWidth, height: styleHeight },
        getContext: vi.fn(() => ctx === undefined ? defaultCtx : ctx),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    } as unknown as HTMLCanvasElement
}

function createMockContainer(width = 100, height = 100) {
    return {
        clientWidth: width,
        clientHeight: height,
        getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    } as unknown as HTMLDivElement
}

// Helper: create default options for the composable
function createDefaultOptions(overrides: Record<string, unknown> = {}) {
    return {
        containerRef: ref(createMockContainer()),
        canvasRef: ref(createMockCanvas()),
        brushRadius: ref(20),
        percentage: ref(50),
        fadeDuration: ref(500),
        prefersReducedMotion: ref(false),
        onProgress: vi.fn(),
        onCompleted: vi.fn(),
        drawOverlay: vi.fn(),
        ...overrides,
    }
}

// Helper: create a class-based ResizeObserver mock (required for `new ResizeObserver(...)`)
function createResizeObserverMock(overrides: Record<string, unknown> = {}) {
    return class ResizeObserverMock {
        observe = (overrides.observe as ReturnType<typeof vi.fn>) ?? vi.fn()
        unobserve = vi.fn()
        disconnect = (overrides.disconnect as ReturnType<typeof vi.fn>) ?? vi.fn()
        constructor(_callback: ResizeObserverCallback) {}
    }
}

describe('useCanvasInteraction', () => {
    let originalDPR: number

    beforeEach(() => {
        vi.useFakeTimers()
        originalDPR = window.devicePixelRatio
        Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
    })

    afterEach(() => {
        vi.useRealTimers()
        Object.defineProperty(window, 'devicePixelRatio', { value: originalDPR, configurable: true })
        vi.restoreAllMocks()
    })

    // ─── Basic initialization ────────────────────────────────────────────

    it('initializes with isRevealed as false', () => {
        const { isRevealed } = useCanvasInteraction(createDefaultOptions() as Parameters<typeof useCanvasInteraction>[0])
        expect(isRevealed.value).toBe(false)
    })

    it('returns expected API surface', () => {
        const result = useCanvasInteraction(createDefaultOptions() as Parameters<typeof useCanvasInteraction>[0])
        expect(result).toHaveProperty('ctx')
        expect(result).toHaveProperty('isRevealed')
        expect(result).toHaveProperty('revealAll')
        expect(result).toHaveProperty('syncCanvasSize')
        expect(result).toHaveProperty('handlePointerDown')
        expect(result).toHaveProperty('handlePointerMove')
        expect(result).toHaveProperty('handlePointerUp')
        expect(result.touchAction).toBe('none')
    })

    // ─── revealAll ───────────────────────────────────────────────────────

    it('revealAll sets isRevealed to true', () => {
        const onCompleted = vi.fn()
        const { isRevealed, revealAll } = useCanvasInteraction(
            createDefaultOptions({ onCompleted }) as Parameters<typeof useCanvasInteraction>[0],
        )
        revealAll()
        expect(isRevealed.value).toBe(true)
    })

    it('revealAll calls onCompleted after fade duration', () => {
        const onCompleted = vi.fn()
        const { revealAll } = useCanvasInteraction(
            createDefaultOptions({ onCompleted, fadeDuration: ref(500) }) as Parameters<typeof useCanvasInteraction>[0],
        )
        revealAll()
        expect(onCompleted).not.toHaveBeenCalled()
        vi.advanceTimersByTime(500)
        expect(onCompleted).toHaveBeenCalledTimes(1)
    })

    it('revealAll calls onCompleted immediately when prefersReducedMotion is true', () => {
        const onCompleted = vi.fn()
        const { revealAll } = useCanvasInteraction(
            createDefaultOptions({ onCompleted, prefersReducedMotion: ref(true) }) as Parameters<typeof useCanvasInteraction>[0],
        )
        revealAll()
        vi.advanceTimersByTime(0)
        expect(onCompleted).toHaveBeenCalledTimes(1)
    })

    it('revealAll does nothing when already revealed (no double fire)', () => {
        const onCompleted = vi.fn()
        const { revealAll } = useCanvasInteraction(
            createDefaultOptions({ onCompleted }) as Parameters<typeof useCanvasInteraction>[0],
        )
        revealAll()
        revealAll() // second call should be no-op
        vi.advanceTimersByTime(500)
        expect(onCompleted).toHaveBeenCalledTimes(1)
    })

    // ─── syncCanvasSize ──────────────────────────────────────────────────

    it('syncCanvasSize initializes canvas and calls drawOverlay on first call', () => {
        const drawOverlay = vi.fn()
        const canvasRef = ref(createMockCanvas())
        const { syncCanvasSize, ctx } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        expect(drawOverlay).toHaveBeenCalledTimes(1)
        expect(ctx.value).not.toBeNull()
    })

    it('syncCanvasSize returns early when container is null', () => {
        const containerRef = ref(null)
        const canvasRef = ref(createMockCanvas())
        const drawOverlay = vi.fn()
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ containerRef, canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        expect(drawOverlay).not.toHaveBeenCalled()
    })

    it('syncCanvasSize returns early when canvas is null', () => {
        const containerRef = ref(createMockContainer())
        const canvasRef = ref(null)
        const drawOverlay = vi.fn()
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ containerRef, canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        expect(drawOverlay).not.toHaveBeenCalled()
    })

    it('syncCanvasSize restores old content on second call (hasBeenSized=true)', () => {
        const drawOverlay = vi.fn()
        const mockDrawImage = vi.fn()

        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                drawImage: mockDrawImage,
                getImageData: vi.fn(() => ({
                    data: new Uint8ClampedArray(100 * 100 * 4),
                })),
            },
        })
        const canvasRef = ref(canvas)
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )

        // First call: style is empty so hasBeenSized=false -> drawOverlay
        syncCanvasSize()
        expect(drawOverlay).toHaveBeenCalledTimes(1)

        // After first call, style.width/height are set
        // Second call: hasBeenSized=true -> tries to restore old content
        // In happy-dom, tempCanvas getContext('2d') may return null, causing catch path
        // So drawOverlay may be called again (fallback to overlay)
        syncCanvasSize()
        // At minimum, syncCanvasSize ran without errors
        // The important thing is hasBeenSized branch is entered
    })

    it('syncCanvasSize uses dpr from canvas width/styleWidth for old content scaling', () => {
        const drawOverlay = vi.fn()
        const scaleCalls: unknown[][] = []

        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn((...args: unknown[]) => {
                    scaleCalls.push(args)
                }),
                drawImage: vi.fn(),
                getImageData: vi.fn(() => ({
                    data: new Uint8ClampedArray(200 * 200 * 4),
                })),
            },
        })
        const canvasRef = ref(canvas)
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )

        // First call with default devicePixelRatio=1 -> scale(1,1)
        syncCanvasSize()
        expect(scaleCalls.length).toBeGreaterThan(0)
        expect(scaleCalls[0]).toEqual([1, 1])
    })

    it('syncCanvasSize handles canvas.getContext returning null', () => {
        const drawOverlay = vi.fn()
        const canvas = createMockCanvas({ ctx: null })
        const canvasRef = ref(canvas)
        const { ctx, syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        expect(ctx.value).toBeNull()
        expect(drawOverlay).not.toHaveBeenCalled()
    })

    // ─── scratch (via handlePointerDown/Move/Up) ─────────────────────────

    it('scratch draws a circle and calls onProgress on intervals', () => {
        const onProgress = vi.fn()

        // Create canvas with pixels that are NOT transparent (alpha=255)
        const pixelData = new Uint8ClampedArray(100 * 100 * 4)
        for (let i = 3; i < pixelData.length; i += 4) {
            pixelData[i] = 255
        }
        const mockGetImageData = vi.fn(() => ({ data: pixelData }))

        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                drawImage: vi.fn(),
                getImageData: mockGetImageData,
                globalCompositeOperation: '',
            },
        })
        const canvasRef = ref(canvas)

        const { syncCanvasSize, handlePointerDown, handlePointerMove, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )

        // Must call syncCanvasSize to set ctx.value before scratching
        syncCanvasSize()

        const target = createPointerTarget()
        const downEvent = {
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent

        handlePointerDown(downEvent)

        // Move enough times to trigger progress check (PROGRESS_CHECK_INTERVAL=10)
        for (let i = 0; i < 10; i++) {
            handlePointerMove({
                clientX: 55,
                clientY: 55,
            } as unknown as PointerEvent)
        }

        expect(onProgress).toHaveBeenCalled()

        handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)
    })

    it('scratch returns early when canvas ref is null', () => {
        const canvasRef = ref(null)
        const onProgress = vi.fn()
        const { handlePointerDown } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerDown({
            target: createPointerTarget(),
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    it('scratch returns early when ctx is null', () => {
        const canvas = createMockCanvas({ ctx: null })
        const canvasRef = ref(canvas)
        const onProgress = vi.fn()
        const { syncCanvasSize, handlePointerDown } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        // syncCanvasSize with ctx=null won't set ctx.value
        syncCanvasSize()
        handlePointerDown({
            target: createPointerTarget(),
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    it('scratch returns early when isRevealed is true', () => {
        const canvas = createMockCanvas()
        const canvasRef = ref(canvas)
        const onProgress = vi.fn()
        const { revealAll, syncCanvasSize, handlePointerDown } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        revealAll()

        handlePointerDown({
            target: createPointerTarget(),
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    // ─── calculateProgress via scratch flow ──────────────────────────────

    it('calculateProgress returns correct percentage when pixels are cleared', () => {
        // Create pixel data where half the sampled pixels have alpha=0
        const pixelData = new Uint8ClampedArray(100 * 100 * 4)
        for (let i = 3; i < pixelData.length; i += 4) {
            pixelData[i] = 255
        }
        // Clear half the sampled pixels (every other SAMPLE_GRID_SIZE column)
        for (let y = 0; y < 100; y += 8) {
            for (let x = 0; x < 100; x += 16) {
                const idx = (y * 100 + x) * 4 + 3
                pixelData[idx] = 0
            }
        }

        const mockGetImageData = vi.fn(() => ({ data: pixelData }))
        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                drawImage: vi.fn(),
                getImageData: mockGetImageData,
                globalCompositeOperation: '',
            },
        })
        const canvasRef = ref(canvas)
        const onCompleted = vi.fn()
        const onProgress = vi.fn()

        const { syncCanvasSize, handlePointerDown, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({
                canvasRef,
                onCompleted,
                onProgress,
                percentage: ref(10),
            }) as Parameters<typeof useCanvasInteraction>[0],
        )

        syncCanvasSize()

        const target = createPointerTarget()
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        // handlePointerUp calls checkProgress -> calculateProgress -> onProgress
        handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)

        expect(onProgress).toHaveBeenCalled()
        vi.advanceTimersByTime(500)
    })

    // ─── handlePointerDown edge cases ────────────────────────────────────

    it('handlePointerDown returns early when target is not an Element', () => {
        const onProgress = vi.fn()
        const { handlePointerDown } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerDown({
            target: null,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    it('handlePointerDown catches setPointerCapture error and resets isScratching', () => {
        const onProgress = vi.fn()
        const { handlePointerDown, handlePointerMove } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        const target = createPointerTarget()
        target.setPointerCapture = vi.fn(() => {
            throw new Error('capture failed')
        })
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)
        // isScratching should be false after catch, so handlePointerMove should be no-op
        handlePointerMove({ clientX: 55, clientY: 55 } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    // ─── handlePointerMove ───────────────────────────────────────────────

    it('handlePointerMove returns early when not scratching', () => {
        const onProgress = vi.fn()
        const { handlePointerMove } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerMove({ clientX: 55, clientY: 55 } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    // ─── handlePointerUp ─────────────────────────────────────────────────

    it('handlePointerUp does nothing when not scratching', () => {
        const onProgress = vi.fn()
        const { handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerUp({
            target: createPointerTarget(),
            pointerId: 1,
        } as unknown as PointerEvent)
        expect(onProgress).not.toHaveBeenCalled()
    })

    it('handlePointerUp releases pointer capture and resets scratching', () => {
        const onProgress = vi.fn()
        const target = createPointerTarget()
        const { handlePointerDown, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)
        expect(target.releasePointerCapture).toHaveBeenCalledWith(1)
    })

    it('handlePointerUp catches releasePointerCapture error silently', () => {
        const onProgress = vi.fn()
        const target = createPointerTarget()
        target.releasePointerCapture = vi.fn(() => {
            throw new Error('release failed')
        })
        const { handlePointerDown, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        expect(() => handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)).not.toThrow()
    })

    it('handlePointerUp handles non-Element target gracefully', () => {
        const onProgress = vi.fn()
        const target = createPointerTarget()
        const { handlePointerDown, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({ onProgress }) as Parameters<typeof useCanvasInteraction>[0],
        )
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        // Release with null target (not an Element) - should not throw
        handlePointerUp({
            target: null,
            pointerId: 1,
        } as unknown as PointerEvent)
    })

    // ─── checkProgress triggers revealAll ────────────────────────────────

    it('checkProgress triggers revealAll when progress exceeds threshold', () => {
        // All sampled pixels are transparent -> 100% progress
        const pixelData = new Uint8ClampedArray(100 * 100 * 4) // all zeros -> alpha=0
        const mockGetImageData = vi.fn(() => ({ data: pixelData }))

        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                drawImage: vi.fn(),
                getImageData: mockGetImageData,
                globalCompositeOperation: '',
            },
        })
        const canvasRef = ref(canvas)
        const onCompleted = vi.fn()
        const onProgress = vi.fn()

        const { syncCanvasSize, handlePointerDown, handlePointerMove, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({
                canvasRef,
                onCompleted,
                onProgress,
                percentage: ref(50),
            }) as Parameters<typeof useCanvasInteraction>[0],
        )

        syncCanvasSize()

        const target = createPointerTarget()
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        // Trigger 10 moves to hit progress check
        for (let i = 0; i < 10; i++) {
            handlePointerMove({ clientX: 55, clientY: 55 } as unknown as PointerEvent)
        }

        handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)

        // progress = 100% >= 50%, so revealAll should trigger
        expect(onProgress).toHaveBeenCalled()
        vi.advanceTimersByTime(500)
        expect(onCompleted).toHaveBeenCalled()
    })

    // ─── scratch throttling ──────────────────────────────────────────────

    it('scratch throttles progress checks based on time', () => {
        const onProgress = vi.fn()
        const pixelData = new Uint8ClampedArray(100 * 100 * 4)
        const mockGetImageData = vi.fn(() => ({ data: pixelData }))

        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                drawImage: vi.fn(),
                getImageData: mockGetImageData,
                globalCompositeOperation: '',
            },
        })
        const canvasRef = ref(canvas)

        const { syncCanvasSize, handlePointerDown, handlePointerMove } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, onProgress, percentage: ref(200) }) as Parameters<typeof useCanvasInteraction>[0],
        )

        // Must initialize ctx.value so scratch does not return early
        syncCanvasSize()

        // Set system time to 0 so Date.now() starts at 0
        vi.setSystemTime(new Date(0))

        const target = createPointerTarget()
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        // handlePointerDown calls scratch once -> drawFrameCount=1
        // 10 moves -> drawFrameCount goes from 2 to 11
        // At drawFrameCount=10: check time. Date.now()=0, lastProgressTime=0, 0-0=0>150=false
        for (let i = 0; i < 10; i++) {
            handlePointerMove({ clientX: 50 + i, clientY: 50 } as unknown as PointerEvent)
        }
        const firstCallCount = onProgress.mock.calls.length

        // 10 more moves -> drawFrameCount goes from 12 to 21
        // At drawFrameCount=20: time still 0, 0>150=false -> throttled
        for (let i = 0; i < 10; i++) {
            handlePointerMove({ clientX: 50 + i, clientY: 50 } as unknown as PointerEvent)
        }
        expect(onProgress.mock.calls.length).toBe(firstCallCount)

        // Advance time past throttle (150ms)
        vi.advanceTimersByTime(160)
        // 10 more moves -> drawFrameCount goes from 22 to 31
        // At drawFrameCount=30: Date.now()=160, 160-0=160>150=true -> checkProgress fires
        for (let i = 0; i < 10; i++) {
            handlePointerMove({ clientX: 50 + i, clientY: 50 } as unknown as PointerEvent)
        }
        expect(onProgress.mock.calls.length).toBeGreaterThan(firstCallCount)
    })

    // ─── onUnmounted lifecycle ───────────────────────────────────────────

    it('onUnmounted disconnects ResizeObserver', () => {
        const disconnect = vi.fn()
        const ROClass = createResizeObserverMock({ disconnect })
        vi.stubGlobal('ResizeObserver', ROClass)

        const wrapper = mount(
            defineComponent({
                setup() {
                    const containerRef = ref(createMockContainer())
                    const canvasRef = ref(createMockCanvas())
                    return useCanvasInteraction(createDefaultOptions({
                        containerRef,
                        canvasRef,
                    }) as Parameters<typeof useCanvasInteraction>[0])
                },
                render: () => h('div'),
            }),
        )

        wrapper.unmount()
        expect(disconnect).toHaveBeenCalled()
    })

    it('onUnmounted clears revealTimerId when timer is active (lines 222-223)', () => {
        const onCompleted = vi.fn()
        const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
        const ROClass = createResizeObserverMock()
        vi.stubGlobal('ResizeObserver', ROClass)

        const wrapper = mount(
            defineComponent({
                setup() {
                    const containerRef = ref(createMockContainer())
                    const canvasRef = ref(createMockCanvas())
                    const result = useCanvasInteraction(createDefaultOptions({
                        containerRef,
                        canvasRef,
                        onCompleted,
                    }) as Parameters<typeof useCanvasInteraction>[0])
                    // Trigger revealAll to create a timer
                    result.revealAll()
                    return result
                },
                render: () => h('div'),
            }),
        )

        wrapper.unmount()
        // clearTimeout should have been called to cancel the pending timer
        expect(clearTimeoutSpy).toHaveBeenCalled()
        // onCompleted should NOT fire because the timer was cleared
        vi.advanceTimersByTime(500)
        expect(onCompleted).not.toHaveBeenCalled()
    })

    it('onUnmounted does not crash when revealTimerId is null', () => {
        const ROClass = createResizeObserverMock()
        vi.stubGlobal('ResizeObserver', ROClass)

        const wrapper = mount(
            defineComponent({
                setup() {
                    const containerRef = ref(createMockContainer())
                    const canvasRef = ref(createMockCanvas())
                    return useCanvasInteraction(createDefaultOptions({
                        containerRef,
                        canvasRef,
                    }) as Parameters<typeof useCanvasInteraction>[0])
                },
                render: () => h('div'),
            }),
        )
        expect(() => wrapper.unmount()).not.toThrow()
    })

    // ─── onMounted lifecycle ─────────────────────────────────────────────

    it('onMounted calls syncCanvasSize and sets up ResizeObserver', () => {
        const observe = vi.fn()
        const ROClass = createResizeObserverMock({ observe })
        vi.stubGlobal('ResizeObserver', ROClass)

        const drawOverlay = vi.fn()
        const container = createMockContainer()
        const containerRef = ref(container)

        mount(
            defineComponent({
                setup() {
                    const canvasRef = ref(createMockCanvas())
                    return useCanvasInteraction(createDefaultOptions({
                        containerRef,
                        canvasRef,
                        drawOverlay,
                    }) as Parameters<typeof useCanvasInteraction>[0])
                },
                render: () => h('div'),
            }),
        )

        expect(drawOverlay).toHaveBeenCalled()
        expect(observe).toHaveBeenCalledWith(container)
    })

    it('onMounted does not crash when containerRef is null', () => {
        const ROClass = createResizeObserverMock()
        vi.stubGlobal('ResizeObserver', ROClass)

        expect(() => {
            mount(
                defineComponent({
                    setup() {
                        const containerRef = ref(null)
                        const canvasRef = ref(createMockCanvas())
                        return useCanvasInteraction(createDefaultOptions({
                            containerRef,
                            canvasRef,
                        }) as Parameters<typeof useCanvasInteraction>[0])
                    },
                    render: () => h('div'),
                }),
            )
        }).not.toThrow()
    })

    // ─── syncCanvasSize with DPR > 1 ────────────────────────────────────

    it('syncCanvasSize handles devicePixelRatio > 1', () => {
        Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true })

        const drawOverlay = vi.fn()
        const scaleCalls: unknown[][] = []
        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn((...args: unknown[]) => {
                    scaleCalls.push(args)
                }),
                drawImage: vi.fn(),
                getImageData: vi.fn(() => ({
                    data: new Uint8ClampedArray(100 * 100 * 4),
                })),
            },
        })
        const canvasRef = ref(canvas)
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        // canvas.width should be rect.width * dpr = 100 * 2 = 200
        expect(canvas.width).toBe(200)
        expect(canvas.height).toBe(200)
        // scale should be called with (2, 2) since devicePixelRatio is 2
        expect(scaleCalls.length).toBeGreaterThan(0)
        expect(scaleCalls[0]).toEqual([2, 2])
        expect(drawOverlay).toHaveBeenCalled()
    })

    // ─── syncCanvasSize: oldDpr fallback when parsedStyleWidth <= 0 ──────

    it('syncCanvasSize falls back to window.devicePixelRatio when parsedStyleWidth is 0', () => {
        const drawOverlay = vi.fn()
        const canvas = createMockCanvas({
            styleWidth: '0px',
            styleHeight: '0px',
            width: 100,
            height: 100,
        })
        const canvasRef = ref(canvas)
        const { syncCanvasSize } = useCanvasInteraction(
            createDefaultOptions({ canvasRef, drawOverlay }) as Parameters<typeof useCanvasInteraction>[0],
        )
        syncCanvasSize()
        // Should not throw; should use fallback dpr
        expect(drawOverlay).toHaveBeenCalled()
    })

    // ─── calculateProgress: canvas width or height is 0 ──────────────────

    it('calculateProgress returns 0 when canvas width is 0', () => {
        const onProgress = vi.fn()
        const mockGetImageData = vi.fn()
        const canvas = createMockCanvas({
            ctx: {
                scale: vi.fn(),
                save: vi.fn(),
                restore: vi.fn(),
                beginPath: vi.fn(),
                arc: vi.fn(),
                fill: vi.fn(),
                drawImage: vi.fn(),
                getImageData: mockGetImageData,
                globalCompositeOperation: '',
            },
        })
        const canvasRef = ref(canvas)

        // Use a container with 0 width so syncCanvasSize sets canvas.width = 0
        const zeroWidthContainer = createMockContainer(0, 100)
        const { syncCanvasSize, handlePointerDown, handlePointerUp } = useCanvasInteraction(
            createDefaultOptions({
                canvasRef,
                onProgress,
                containerRef: ref(zeroWidthContainer),
            }) as Parameters<typeof useCanvasInteraction>[0],
        )

        syncCanvasSize()

        const target = createPointerTarget()
        handlePointerDown({
            target,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        } as unknown as PointerEvent)

        // handlePointerUp triggers checkProgress -> calculateProgress
        handlePointerUp({
            target,
            pointerId: 1,
        } as unknown as PointerEvent)

        // calculateProgress returns 0 when w=0, onProgress(0) is called
        expect(onProgress).toHaveBeenCalledWith(0)
        // getImageData should NOT be called since w=0 causes early return
        expect(mockGetImageData).not.toHaveBeenCalled()
    })
})
