import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useCarouselEnhanced } from './useCarouselEnhanced'

describe('useCarouselEnhanced', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should return base carousel functionality', () => {
        const result = useCarouselEnhanced()
        expect(result.emblaRef).toBeDefined()
        expect(result.selectedIndex).toBeDefined()
        expect(result.scrollSnaps).toBeDefined()
        expect(result.canScrollPrev).toBeDefined()
        expect(result.canScrollNext).toBeDefined()
        expect(result.scrollPrev).toBeInstanceOf(Function)
        expect(result.scrollNext).toBeInstanceOf(Function)
        expect(result.scrollTo).toBeInstanceOf(Function)
        expect(result.startAutoplay).toBeInstanceOf(Function)
        expect(result.stopAutoplay).toBeInstanceOf(Function)
    })

    it('should return autoplayProgress ref', () => {
        const { autoplayProgress } = useCarouselEnhanced()
        expect(autoplayProgress.value).toBe(0)
    })

    it('should reset progress on stopAutoplay', () => {
        const { autoplayProgress, stopAutoplay } = useCarouselEnhanced()

        stopAutoplay()
        expect(autoplayProgress.value).toBe(0)
    })

    it('should accept trackProgress option', () => {
        const trackProgress = ref(true)
        const result = useCarouselEnhanced({ trackProgress })
        expect(result.autoplayProgress).toBeDefined()
    })

    it('should accept progressInterval option', () => {
        const progressInterval = ref(100)
        const result = useCarouselEnhanced({ progressInterval })
        expect(result.autoplayProgress).toBeDefined()
    })

    it('should accept all base useCarousel options', () => {
        const result = useCarouselEnhanced({
            loop: true,
            autoplay: true,
            autoplayDelay: 5000,
        })
        expect(result.emblaRef).toBeDefined()
    })
})
