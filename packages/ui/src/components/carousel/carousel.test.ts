import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import Carousel from './Carousel.vue'
import CarouselItem from './CarouselItem.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

vi.mock('embla-carousel-vue', () => ({
    default: () => {
        const emblaApi = {
            scrollSnapList: () => [0, 1, 2],
            selectedScrollSnap: () => 0,
            canScrollPrev: () => false,
            canScrollNext: () => true,
            scrollPrev: () => {},
            scrollNext: () => {},
            scrollTo: () => {},
            reInit: () => {},
            on: () => {},
            off: () => {},
        }
        return [ref(null), ref(emblaApi)]
    },
}))

describe('Carousel', () => {
    it('renders with default classes', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        expect(wrapper.find('.overflow-hidden').exists()).toBe(true)
        expect(wrapper.classes()).toContain('relative')
        expect(wrapper.classes()).toContain('overflow-hidden')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('rounded-brutal')
    })

    it('applies size variant classes', async () => {
        const sizes = [
            { size: 'sm' as const, expectedClass: 'h-48' },
            { size: 'md' as const, expectedClass: 'h-64' },
            { size: 'lg' as const, expectedClass: 'h-96' },
            { size: 'full' as const, expectedClass: 'h-full' },
        ]

        const wrapper = mount(Carousel, { ...localeProvide })
        for (const { size, expectedClass } of sizes) {
            await wrapper.setProps({ size } as any)
            expect(wrapper.classes()).toContain(expectedClass)
        }
    })

    it('renders arrow buttons by default', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        const buttons = wrapper.findAll('button[aria-label]')
        const arrowButtons = buttons.filter(b =>
            b.attributes('aria-label') === 'Previous slide' ||
            b.attributes('aria-label') === 'Next slide'
        )
        expect(arrowButtons.length).toBe(2)
    })

    it('hides arrows when showArrows=false', () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { showArrows: false },
        })
        const buttons = wrapper.findAll('button[aria-label]')
        const arrowButtons = buttons.filter(b =>
            b.attributes('aria-label') === 'Previous slide' ||
            b.attributes('aria-label') === 'Next slide'
        )
        expect(arrowButtons.length).toBe(0)
    })

    it('applies custom class', () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { class: 'custom-carousel' },
        })
        expect(wrapper.classes()).toContain('custom-carousel')
    })

    it('renders slot content', () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            slots: {
                default: '<div class="slide-content">Slide 1</div>',
            },
        })
        expect(wrapper.find('.slide-content').exists()).toBe(true)
        expect(wrapper.text()).toContain('Slide 1')
    })
})

describe('CarouselItem', () => {
    it('renders with default classes', () => {
        const wrapper = mount(CarouselItem)
        expect(wrapper.classes()).toContain('flex-none')
        expect(wrapper.classes()).toContain('w-full')
        expect(wrapper.classes()).toContain('h-full')
    })

    it('applies custom class', () => {
        const wrapper = mount(CarouselItem, {
            props: { class: 'custom-item' },
        })
        expect(wrapper.classes()).toContain('custom-item')
        expect(wrapper.classes()).toContain('flex-none')
    })

    it('keeps incoming width/height classes over preset ones via twMerge', () => {
        const wrapper = mount(CarouselItem, {
            props: { class: 'w-1/2 h-64' },
        })
        expect(wrapper.classes()).toContain('w-1/2')
        expect(wrapper.classes()).toContain('h-64')
        expect(wrapper.classes()).not.toContain('w-full')
        expect(wrapper.classes()).not.toContain('h-full')
    })

    it('renders WAI-ARIA slide semantics by default', () => {
        const wrapper = mount(CarouselItem)
        expect(wrapper.attributes('role')).toBe('group')
        expect(wrapper.attributes('aria-roledescription')).toBe('slide')
        expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    })

    it('reflects ariaHidden prop as aria-hidden', () => {
        const wrapper = mount(CarouselItem, { props: { ariaHidden: true } })
        expect(wrapper.attributes('aria-hidden')).toBe('true')
    })

    it('renders slot content', () => {
        const wrapper = mount(CarouselItem, {
            slots: { default: 'Item content' },
        })
        expect(wrapper.text()).toBe('Item content')
    })
})

describe('Carousel programmatic control (defineExpose)', () => {
    it('exposes scrollPrev, scrollNext, scrollTo as functions', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        expect(typeof wrapper.vm.scrollPrev).toBe('function')
        expect(typeof wrapper.vm.scrollNext).toBe('function')
        expect(typeof wrapper.vm.scrollTo).toBe('function')
    })

    it('exposes selectedIndex as a readable value', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        expect(wrapper.vm.selectedIndex).toBe(0)
    })

    it('exposes canScrollPrev and canScrollNext as readable values', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        expect(typeof wrapper.vm.canScrollPrev).toBe('boolean')
        expect(typeof wrapper.vm.canScrollNext).toBe('boolean')
    })

    it('calling exposed scroll methods does not throw when embla is unavailable', () => {
        const wrapper = mount(Carousel, { ...localeProvide })
        expect(() => {
            ;(wrapper.vm as any).scrollPrev()
            ;(wrapper.vm as any).scrollNext()
            ;(wrapper.vm as any).scrollTo(0)
        }).not.toThrow()
    })
})

describe('Carousel indicators and thumbnails', () => {
    it('renders only autoplay dots when showDots and dots indicator coexist', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: {
                showDots: true,
                autoplay: true,
                autoplayIndicator: { type: 'dots' },
            },
        })
        // showDots 按钮组被排除，仅 autoplay dots（div）渲染，避免两组重叠
        await nextTick()
        expect(wrapper.findAll('button[aria-label^="Go to slide"]')).toHaveLength(0)
        expect(wrapper.findAll('.w-2\\.5')).toHaveLength(3)
        wrapper.unmount()
    })

    it('falls back to showDots buttons when dots indicator exists but autoplay is off', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: {
                showDots: true,
                autoplay: false,
                autoplayIndicator: { type: 'dots' },
            },
        })
        await nextTick()
        expect(wrapper.findAll('button[aria-label^="Go to slide"]')).toHaveLength(3)
        expect(wrapper.findAll('.w-2\\.5')).toHaveLength(0)
    })

    it('positions progress indicator at bottom when position=bottom', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'progress', position: 'bottom' },
            },
        })
        await nextTick()
        const track = wrapper.findAll('div').find(el =>
            el.classes().includes('bg-brutal-fg/20') && el.classes().includes('h-1')
        )
        const container = track?.element.parentElement as HTMLElement | null
        expect(container?.className).toContain('bottom-0')
        wrapper.unmount()
    })

    it('positions dots indicator at top when position=top', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'dots', position: 'top' },
            },
        })
        await nextTick()
        const dot = wrapper.find('.w-2\\.5')
        expect(dot.exists()).toBe(true)
        const container = (dot.element.parentElement as HTMLElement | null)
        expect(container?.className).toContain('top-3')
        wrapper.unmount()
    })

    it('applies thumbnails.gap to thumbnail container style', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { thumbnails: { show: true, gap: 16 } },
        })
        await nextTick()
        const container = wrapper.findAll('div').find(el =>
            el.classes().includes('flex') &&
            el.classes().includes('justify-center') &&
            (el.attributes('style') || '').includes('gap: 16px')
        )
        expect(container).toBeDefined()
    })

    it('highlights current thumbnail by default', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { thumbnails: { show: true } },
        })
        await nextTick()
        const buttons = wrapper.findAll('button[aria-label^="Go to slide"]')
        expect(buttons).toHaveLength(3)
        expect(buttons[0].classes()).toContain('border-brutal-primary')
        expect(buttons[1].classes()).not.toContain('border-brutal-primary')
    })

    it('skips current thumbnail highlight when highlightCurrent=false', async () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { thumbnails: { show: true, highlightCurrent: false } },
        })
        await nextTick()
        const buttons = wrapper.findAll('button[aria-label^="Go to slide"]')
        expect(buttons[0].classes()).not.toContain('border-brutal-primary')
        expect(buttons[0].classes()).not.toContain('shadow-brutal')
    })

    it('exposes parallax opacity CSS variable when opacity enabled', () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { parallax: { enabled: true, opacity: true } },
        })
        expect(wrapper.attributes('style')).toContain('--parallax-opacity: 0')
    })

    it('sets parallax opacity to 1 when opacity disabled', () => {
        const wrapper = mount(Carousel, {
            ...localeProvide,
            props: { parallax: { enabled: true } },
        })
        expect(wrapper.attributes('style')).toContain('--parallax-opacity: 1')
    })
})
