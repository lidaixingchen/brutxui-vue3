import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useCarousel } from './useCarousel'

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

describe('useCarousel', () => {
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

    it('scrollPrev does not throw when embla is not ready', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(() => carousel.scrollPrev()).not.toThrow()
        wrapper.unmount()
    })

    it('scrollNext does not throw when embla is not ready', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(() => carousel.scrollNext()).not.toThrow()
        wrapper.unmount()
    })

    it('scrollTo does not throw when embla is not ready', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(() => carousel.scrollTo(0)).not.toThrow()
        wrapper.unmount()
    })

    it('startAutoplay does not throw when autoplay is disabled', () => {
        const { wrapper, carousel } = mountWithCarousel({ autoplay: () => false })
        expect(() => carousel.startAutoplay()).not.toThrow()
        wrapper.unmount()
    })

    it('stopAutoplay does not throw', () => {
        const { wrapper, carousel } = mountWithCarousel()
        expect(() => carousel.stopAutoplay()).not.toThrow()
        wrapper.unmount()
    })

    it('does not start autoplay when autoplay option is true but no slides exist', () => {
        const { wrapper, carousel } = mountWithCarousel({ autoplay: () => true, autoplayDelay: () => 100 })
        expect(() => carousel.startAutoplay()).not.toThrow()
        carousel.stopAutoplay()
        wrapper.unmount()
    })
})
