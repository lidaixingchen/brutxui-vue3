import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick, defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import type { EmblaCarouselType } from 'embla-carousel'

/* ---------- mock embla-carousel-vue ---------- */
type EventName = string
type EventHandler = (...args: unknown[]) => void

interface MockEmblaApi extends EmblaCarouselType {
    __emit: (event: EventName, ...args: unknown[]) => void
    __listeners: Record<string, EventHandler[]>
}

function createMockEmblaApi(overrides: Partial<EmblaCarouselType> = {}): MockEmblaApi {
    const listeners: Record<string, EventHandler[]> = {}
    const mockApi = {
        scrollSnapList: vi.fn().mockReturnValue([]),
        selectedScrollSnap: vi.fn().mockReturnValue(0),
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        scrollTo: vi.fn(),
        reInit: vi.fn(),
        on: vi.fn((event: EventName, handler: EventHandler) => {
            if (!listeners[event]) listeners[event] = []
            listeners[event].push(handler)
            return mockApi
        }),
        off: vi.fn((event: EventName, handler: EventHandler) => {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter((h) => h !== handler)
            }
            return mockApi
        }),
        ...overrides,
    } as unknown as MockEmblaApi

    // expose helpers to emit events from tests
    mockApi.__emit = (event: string, ...args: unknown[]) => {
        listeners[event]?.forEach((fn) => fn(...args))
    }
    mockApi.__listeners = listeners
    return mockApi
}

const mockEmblaRef = ref<HTMLElement | undefined>(undefined)
const mockEmblaApi = ref<EmblaCarouselType | undefined>(undefined)

vi.mock('embla-carousel-vue', () => ({
    default: vi.fn(() => [mockEmblaRef, mockEmblaApi]),
}))

/* ---------- mock useReducedMotion ---------- */
const mockPrefersReducedMotion = ref(false)

vi.mock('./useReducedMotion', () => ({
    useReducedMotion: vi.fn(() => mockPrefersReducedMotion),
}))

/* ---------- imports after mock ---------- */
import { useCarousel, DEFAULT_AUTOPLAY_DELAY } from './useCarousel'

/* ---------- helpers ---------- */
function mountWithCarousel(options: Parameters<typeof useCarousel>[0] = {}) {
    let captured: ReturnType<typeof useCarousel> | null = null
    const TestHost = defineComponent({
        setup() {
            captured = useCarousel(options)
            return () => h('div')
        },
    })
    const wrapper = mount(TestHost)
    return { wrapper, carousel: captured! }
}

/* ---------- tests ---------- */
describe('useCarousel', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mockEmblaApi.value = undefined
        mockEmblaRef.value = undefined
        mockPrefersReducedMotion.value = false
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    /* ---- return values ---- */
    it('returns all expected properties', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(carousel).toHaveProperty('emblaRef')
        expect(carousel).toHaveProperty('selectedIndex')
        expect(carousel).toHaveProperty('scrollSnaps')
        expect(carousel).toHaveProperty('canScrollPrev')
        expect(carousel).toHaveProperty('canScrollNext')
        expect(carousel).toHaveProperty('scrollPrev')
        expect(carousel).toHaveProperty('scrollNext')
        expect(carousel).toHaveProperty('scrollTo')
        expect(carousel).toHaveProperty('startAutoplay')
        expect(carousel).toHaveProperty('stopAutoplay')
        wrapper.unmount()
    })

    /* ---- initial state ---- */
    it('initializes selectedIndex to 0', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(carousel.selectedIndex.value).toBe(0)
        wrapper.unmount()
    })

    it('initializes scrollSnaps to empty array', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(carousel.scrollSnaps.value).toEqual([])
        wrapper.unmount()
    })

    /* ---- DEFAULT_AUTOPLAY_DELAY ---- */
    it('exports DEFAULT_AUTOPLAY_DELAY as 3000', () => {
        expect(DEFAULT_AUTOPLAY_DELAY).toBe(3000)
    })

    /* ---- canScrollPrev / canScrollNext ---- */
    describe('canScrollPrev / canScrollNext', () => {
        it('canScrollPrev is false when loop is false and selectedIndex is 0', () => {
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })
            expect(carousel.canScrollPrev.value).toBe(false)
            wrapper.unmount()
        })

        it('canScrollPrev is true when loop is true', () => {
            const { wrapper, carousel } = mountWithCarousel({ loop: () => true })
            expect(carousel.canScrollPrev.value).toBe(true)
            wrapper.unmount()
        })

        it('canScrollPrev uses default loop=false when loop option is omitted', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(carousel.canScrollPrev.value).toBe(false)
            wrapper.unmount()
        })

        it('canScrollNext is false when scrollSnaps is empty and loop is false', () => {
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })
            expect(carousel.canScrollNext.value).toBe(false)
            wrapper.unmount()
        })

        it('canScrollNext is true when loop is true', () => {
            const { wrapper, carousel } = mountWithCarousel({ loop: () => true })
            expect(carousel.canScrollNext.value).toBe(true)
            wrapper.unmount()
        })

        it('canScrollNext uses default loop=false when loop option is omitted', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(carousel.canScrollNext.value).toBe(false)
            wrapper.unmount()
        })
    })

    /* ---- scroll methods when emblaApi is not ready ---- */
    describe('scroll methods when emblaApi is undefined', () => {
        it('scrollPrev does not throw', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(() => carousel.scrollPrev()).not.toThrow()
            wrapper.unmount()
        })

        it('scrollNext does not throw', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(() => carousel.scrollNext()).not.toThrow()
            wrapper.unmount()
        })

        it('scrollTo does not throw', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(() => carousel.scrollTo(0)).not.toThrow()
            wrapper.unmount()
        })

        it('startAutoplay does not throw when autoplay is disabled', () => {
            const { wrapper, carousel } = mountWithCarousel({ autoplay: () => false })
            expect(() => carousel.startAutoplay()).not.toThrow()
            wrapper.unmount()
        })

        it('stopAutoplay does not throw when no timer is active', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(() => carousel.stopAutoplay()).not.toThrow()
            wrapper.unmount()
        })
    })

    /* ---- scroll methods when emblaApi IS available ---- */
    describe('scroll methods with emblaApi', () => {
        it('scrollPrev delegates to emblaApi', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel()
            carousel.scrollPrev()
            expect(api.scrollPrev).toHaveBeenCalled()
            wrapper.unmount()
        })

        it('scrollNext delegates to emblaApi', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel()
            carousel.scrollNext()
            expect(api.scrollNext).toHaveBeenCalled()
            wrapper.unmount()
        })

        it('scrollTo delegates to emblaApi with index', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel()
            carousel.scrollTo(3)
            expect(api.scrollTo).toHaveBeenCalledWith(3)
            wrapper.unmount()
        })
    })

    /* ---- onInit / onSelect via emblaApi events ---- */
    describe('emblaApi event handling', () => {
        it('registers init, select, reInit event handlers on mount', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel()
            expect(api.on).toHaveBeenCalledWith('init', expect.any(Function))
            expect(api.on).toHaveBeenCalledWith('select', expect.any(Function))
            expect(api.on).toHaveBeenCalledWith('reInit', expect.any(Function))
            wrapper.unmount()
        })

        it('onInit sets scrollSnaps and selectedIndex', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.33, 0.66, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(2),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel()

            // trigger onInit via the 'init' event
            api.__emit('init', api, 'init')
            await nextTick()

            expect(carousel.scrollSnaps.value).toEqual([0, 0.33, 0.66, 1])
            expect(carousel.selectedIndex.value).toBe(2)
            wrapper.unmount()
        })

        it('onSelect updates selectedIndex', async () => {
            const selectedScrollSnapMock = vi.fn().mockReturnValue(0)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: selectedScrollSnapMock,
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel()

            // onMounted already called onInit, index is 0
            expect(carousel.selectedIndex.value).toBe(0)

            // change return value to simulate scrolling to index 2
            selectedScrollSnapMock.mockReturnValue(2)
            api.__emit('select', api, 'select')
            await nextTick()
            expect(carousel.selectedIndex.value).toBe(2)
            wrapper.unmount()
        })

        it('onInit does nothing when emblaApi.value is undefined', () => {
            // emblaApi stays undefined
            const { wrapper, carousel } = mountWithCarousel()
            expect(carousel.scrollSnaps.value).toEqual([])
            expect(carousel.selectedIndex.value).toBe(0)
            wrapper.unmount()
        })

        it('onSelect does nothing when emblaApi.value is undefined', () => {
            const { wrapper, carousel } = mountWithCarousel()
            // selectedIndex should remain 0
            expect(carousel.selectedIndex.value).toBe(0)
            wrapper.unmount()
        })

        it('unregisters event handlers on unmount', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel()

            // get the registered handlers
            const initHandler = vi.mocked(api.on).mock.calls.find((c: [string, (...args: unknown[]) => void]) => c[0] === 'init')?.[1]
            const selectHandler = vi.mocked(api.on).mock.calls.find((c: [string, (...args: unknown[]) => void]) => c[0] === 'select')?.[1]
            const reInitHandler = vi.mocked(api.on).mock.calls.find((c: [string, (...args: unknown[]) => void]) => c[0] === 'reInit')?.[1]

            wrapper.unmount()

            expect(api.off).toHaveBeenCalledWith('init', initHandler)
            expect(api.off).toHaveBeenCalledWith('select', selectHandler)
            expect(api.off).toHaveBeenCalledWith('reInit', reInitHandler)
        })

        it('does not unregister when cachedApi is null (emblaApi was never available)', () => {
            // emblaApi stays undefined - onMounted early returns before setting cachedApi
            const { wrapper } = mountWithCarousel()
            // no api was set, so off should not be called
            wrapper.unmount()
            // this test just verifies no error occurs
        })
    })

    /* ---- canScrollPrev / canScrollNext with scrollSnaps populated ---- */
    describe('canScrollPrev / canScrollNext with slides', () => {
        it('canScrollPrev is true when selectedIndex > 0 and loop is false', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(1),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })

            api.__emit('init', api, 'init')
            await nextTick()

            expect(carousel.canScrollPrev.value).toBe(true)
            wrapper.unmount()
        })

        it('canScrollNext is true when selectedIndex < last and loop is false', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(1),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })

            api.__emit('init', api, 'init')
            await nextTick()

            expect(carousel.canScrollNext.value).toBe(true)
            wrapper.unmount()
        })

        it('canScrollNext is false when selectedIndex is last and loop is false', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(2),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })

            api.__emit('init', api, 'init')
            await nextTick()

            expect(carousel.canScrollNext.value).toBe(false)
            wrapper.unmount()
        })

        it('canScrollPrev is false when selectedIndex is 0 and loop is false', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ loop: () => false })

            api.__emit('init', api, 'init')
            await nextTick()

            expect(carousel.canScrollPrev.value).toBe(false)
            wrapper.unmount()
        })
    })

    /* ---- autoplay ---- */
    describe('autoplay', () => {
        it('does not start autoplay when autoplay option is false', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ autoplay: () => false })

            carousel.startAutoplay()
            vi.advanceTimersByTime(5000)

            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('does not start autoplay when prefersReducedMotion is true', () => {
            mockPrefersReducedMotion.value = true
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ autoplay: () => true })

            carousel.startAutoplay()
            vi.advanceTimersByTime(5000)

            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('calls scrollNext on each autoplay interval tick', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 1000,
            })

            carousel.startAutoplay()
            vi.advanceTimersByTime(1000)
            expect(api.scrollNext).toHaveBeenCalledTimes(1)

            vi.advanceTimersByTime(1000)
            expect(api.scrollNext).toHaveBeenCalledTimes(2)
            wrapper.unmount()
        })

        it('uses DEFAULT_AUTOPLAY_DELAY when autoplayDelay is not specified', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({ autoplay: () => true })

            carousel.startAutoplay()

            // should not fire before default delay
            vi.advanceTimersByTime(DEFAULT_AUTOPLAY_DELAY - 1)
            expect(api.scrollNext).not.toHaveBeenCalled()

            vi.advanceTimersByTime(1)
            expect(api.scrollNext).toHaveBeenCalledTimes(1)
            wrapper.unmount()
        })

        it('autoplay timer skips scrollNext when emblaApi becomes undefined', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            carousel.startAutoplay()

            // remove api before next tick
            mockEmblaApi.value = undefined
            vi.advanceTimersByTime(100)

            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('autoplay timer does nothing when scrollSnaps is empty', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            carousel.startAutoplay()
            vi.advanceTimersByTime(100)

            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('stops autoplay when at last slide and loop is false', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(2),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
                loop: () => false,
            })

            carousel.startAutoplay()
            vi.advanceTimersByTime(100)

            // autoplay should have stopped - no scrollNext call
            expect(api.scrollNext).not.toHaveBeenCalled()

            // advancing more time should not trigger more calls
            vi.advanceTimersByTime(500)
            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('does not stop autoplay at last slide when loop is true', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(2),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
                loop: () => true,
            })

            carousel.startAutoplay()
            vi.advanceTimersByTime(100)

            expect(api.scrollNext).toHaveBeenCalledTimes(1)
            wrapper.unmount()
        })

        it('stopAutoplay clears the timer', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            carousel.startAutoplay()
            carousel.stopAutoplay()

            vi.advanceTimersByTime(500)
            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('stopAutoplay is idempotent (does nothing when no timer)', () => {
            const { wrapper, carousel } = mountWithCarousel()
            expect(() => {
                carousel.stopAutoplay()
                carousel.stopAutoplay()
            }).not.toThrow()
            wrapper.unmount()
        })

        it('startAutoplay resets any existing timer before creating a new one', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper, carousel } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            carousel.startAutoplay()
            carousel.startAutoplay() // second call should reset

            vi.advanceTimersByTime(100)
            expect(api.scrollNext).toHaveBeenCalledTimes(1) // only once, not twice
            wrapper.unmount()
        })

        it('autoplay starts automatically on mount when autoplay option is true', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            vi.advanceTimersByTime(100)
            expect(api.scrollNext).toHaveBeenCalledTimes(1)
            wrapper.unmount()
        })
    })

    /* ---- watch: autoplay option changes ---- */
    describe('watch: autoplay option', () => {
        it('starts autoplay when autoplay becomes true', async () => {
            const autoplay = ref(false)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const onAutoplayChange = vi.fn()
            const { wrapper } = mountWithCarousel({
                autoplay,
                autoplayDelay: () => 100,
                onAutoplayChange,
            })

            autoplay.value = true
            await nextTick()

            vi.advanceTimersByTime(100)
            expect(api.scrollNext).toHaveBeenCalled()
            expect(onAutoplayChange).toHaveBeenCalledWith(true)
            wrapper.unmount()
        })

        it('stops autoplay when autoplay becomes false', async () => {
            const autoplay = ref(true)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const onAutoplayChange = vi.fn()
            const { wrapper } = mountWithCarousel({
                autoplay,
                autoplayDelay: () => 100,
                onAutoplayChange,
            })

            // autoplay is true initially, start it
            // The composable is inside setup, we access via the mount

            autoplay.value = false
            await nextTick()

            vi.advanceTimersByTime(500)
            expect(onAutoplayChange).toHaveBeenCalledWith(false)
            wrapper.unmount()
        })

        it('does not call onAutoplayChange when not provided', async () => {
            const autoplay = ref(false)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ autoplay, autoplayDelay: () => 100 })

            autoplay.value = true
            await nextTick()
            // no error means success
            wrapper.unmount()
        })
    })

    /* ---- watch: loop option changes ---- */
    describe('watch: loop option', () => {
        it('calls reInit when loop changes', async () => {
            const loop = ref(false)
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ loop })

            loop.value = true
            await nextTick()

            expect(api.reInit).toHaveBeenCalledWith({ loop: true })
            wrapper.unmount()
        })

        it('uses default false when loop becomes undefined', async () => {
            const loop = ref<boolean | undefined>(false)
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ loop })

            loop.value = undefined
            await nextTick()

            expect(api.reInit).toHaveBeenCalledWith({ loop: false })
            wrapper.unmount()
        })

        it('does not call reInit when emblaApi is undefined', async () => {
            const loop = ref(false)
            const { wrapper } = mountWithCarousel({ loop })

            loop.value = true
            await nextTick()
            // no error means success (emblaApi.value is undefined so reInit is skipped)
            wrapper.unmount()
        })
    })

    /* ---- watch: autoplayDelay option changes ---- */
    describe('watch: autoplayDelay option', () => {
        it('restarts autoplay when autoplayDelay changes and autoplay is enabled', async () => {
            const autoplayDelay = ref(1000)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const onAutoplayDelayChange = vi.fn()
            const { wrapper } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay,
                onAutoplayDelayChange,
            })

            autoplayDelay.value = 500
            await nextTick()

            expect(onAutoplayDelayChange).toHaveBeenCalled()
            wrapper.unmount()
        })

        it('does not restart autoplay when autoplayDelay changes and autoplay is disabled', async () => {
            const autoplayDelay = ref(1000)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const onAutoplayDelayChange = vi.fn()
            const { wrapper } = mountWithCarousel({
                autoplay: () => false,
                autoplayDelay,
                onAutoplayDelayChange,
            })

            autoplayDelay.value = 500
            await nextTick()

            expect(onAutoplayDelayChange).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('does not call onAutoplayDelayChange when not provided', async () => {
            const autoplayDelay = ref(1000)
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay,
            })

            autoplayDelay.value = 500
            await nextTick()
            // no error means success
            wrapper.unmount()
        })
    })

    /* ---- watch: prefersReducedMotion ---- */
    describe('watch: prefersReducedMotion', () => {
        it('stops autoplay and reInits with duration 0 when reduced motion is true', async () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ autoplay: () => true, autoplayDelay: () => 100 })

            mockPrefersReducedMotion.value = true
            await nextTick()

            expect(api.reInit).toHaveBeenCalledWith({ duration: 0 })
            wrapper.unmount()
        })

        it('reInits without duration and restarts autoplay when reduced motion becomes false', async () => {
            mockPrefersReducedMotion.value = true
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ autoplay: () => true, autoplayDelay: () => 100 })

            mockPrefersReducedMotion.value = false
            await nextTick()

            expect(api.reInit).toHaveBeenCalledWith({})
            wrapper.unmount()
        })

        it('does not restart autoplay when reduced motion becomes false and autoplay is disabled', async () => {
            mockPrefersReducedMotion.value = true
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({ autoplay: () => false })

            mockPrefersReducedMotion.value = false
            await nextTick()

            expect(api.reInit).toHaveBeenCalledWith({})
            // autoplay should not be running
            vi.advanceTimersByTime(5000)
            expect(api.scrollNext).not.toHaveBeenCalled()
            wrapper.unmount()
        })

        it('does nothing when emblaApi is undefined', async () => {
            const { wrapper } = mountWithCarousel()

            mockPrefersReducedMotion.value = true
            await nextTick()
            // no error
            wrapper.unmount()
        })
    })

    /* ---- onMounted: reduced motion initial check ---- */
    describe('onMounted: reduced motion', () => {
        it('reInits with duration 0 on mount when prefersReducedMotion is already true', () => {
            mockPrefersReducedMotion.value = true
            const api = createMockEmblaApi()
            mockEmblaApi.value = api

            const { wrapper } = mountWithCarousel()

            expect(api.reInit).toHaveBeenCalledWith({ duration: 0 })
            wrapper.unmount()
        })

        it('does not reInit on mount when prefersReducedMotion is false', () => {
            mockPrefersReducedMotion.value = false
            const api = createMockEmblaApi()
            mockEmblaApi.value = api

            const { wrapper } = mountWithCarousel()

            // reInit should not have been called during mount (only on events/watchers)
            expect(api.reInit).not.toHaveBeenCalled()
            wrapper.unmount()
        })
    })

    /* ---- onUnmounted ---- */
    describe('onUnmounted', () => {
        it('stops autoplay on unmount', () => {
            const api = createMockEmblaApi({
                scrollSnapList: vi.fn().mockReturnValue([0, 0.5, 1]),
                selectedScrollSnap: vi.fn().mockReturnValue(0),
            })
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel({
                autoplay: () => true,
                autoplayDelay: () => 100,
            })

            wrapper.unmount()

            // advancing time should not trigger scrollNext
            vi.advanceTimersByTime(500)
            expect(api.scrollNext).not.toHaveBeenCalled()
        })

        it('cleans up event listeners on unmount', () => {
            const api = createMockEmblaApi()
            mockEmblaApi.value = api
            const { wrapper } = mountWithCarousel()

            wrapper.unmount()

            expect(api.off).toHaveBeenCalledWith('init', expect.any(Function))
            expect(api.off).toHaveBeenCalledWith('select', expect.any(Function))
            expect(api.off).toHaveBeenCalledWith('reInit', expect.any(Function))
        })
    })

    /* ---- DEFAULT_AUTOPLAY_DELAY ---- */
    describe('DEFAULT_AUTOPLAY_DELAY', () => {
        it('is 3000', () => {
            expect(DEFAULT_AUTOPLAY_DELAY).toBe(3000)
        })
    })
})
