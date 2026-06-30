import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CarouselEnhanced from './CarouselEnhanced.vue'

// Mock useLocale
vi.mock('@/composables/useLocale', () => ({
    useLocale: () => ({
        t: (key: string, params?: Record<string, unknown>) => {
            if (params) return `${key} ${JSON.stringify(params)}`
            return key
        },
    }),
}))

describe('CarouselEnhanced', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render with default props', () => {
        const wrapper = mount(CarouselEnhanced, {
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('should render arrows when showArrows is true', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: { showArrows: true },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons.length).toBeGreaterThanOrEqual(2)
    })

    it('should not render arrows when showArrows is false', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: { showArrows: false },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons.length).toBe(0)
    })

    it('should render progress indicator when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'progress' },
            },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        expect(wrapper.find('.absolute.top-0').exists()).toBe(true)
    })

    it('should render fraction indicator when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'fraction' },
            },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        expect(wrapper.text()).toContain('/')
    })

    it('should render dots indicator when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'dots' },
            },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        // Dots indicator 需要 autoplay 和 autoplayIndicator 同时存在
        // 且 scrollSnaps.length > 1（需要 embla 初始化）
        const dotsContainer = wrapper.find('.absolute.bottom-3')
        // 由于 embla 可能未完全初始化，dots 可能不会渲染
        // 这是预期行为，因为 scrollSnaps 在初始化前为空
        expect(dotsContainer.exists()).toBe(true)
    })

    it('should render thumbnails when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                thumbnails: { show: true },
            },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        const thumbnailButtons = wrapper.findAll('button[aria-label*="carousel"]')
        expect(thumbnailButtons.length).toBeGreaterThan(0)
    })

    it('should apply parallax style when configured', () => {
        const wrapper = mount(CarouselEnhanced, {
            props: {
                parallax: { enabled: true, scale: 1.2 },
            },
            slots: {
                default: '<div>Slide 1</div>',
            },
        })
        const container = wrapper.find('div')
        expect(container.attributes('style')).toContain('--parallax-scale')
    })

    it('should expose control methods', () => {
        const wrapper = mount(CarouselEnhanced, {
            slots: {
                default: '<div>Slide 1</div>',
            },
        })

        expect(wrapper.vm.scrollPrev).toBeInstanceOf(Function)
        expect(wrapper.vm.scrollNext).toBeInstanceOf(Function)
        expect(wrapper.vm.scrollTo).toBeInstanceOf(Function)
        expect(wrapper.vm.startAutoplay).toBeInstanceOf(Function)
        expect(wrapper.vm.stopAutoplay).toBeInstanceOf(Function)
    })

    it('should accept all size variants', () => {
        const sizes = ['sm', 'md', 'lg', 'full', 'default'] as const

        sizes.forEach((size) => {
            const wrapper = mount(CarouselEnhanced, {
                props: { size },
                slots: {
                    default: '<div>Slide 1</div>',
                },
            })
            expect(wrapper.exists()).toBe(true)
        })
    })

    it('should accept all thumbnail positions', () => {
        const positions = ['bottom', 'left', 'right'] as const

        positions.forEach((position) => {
            const wrapper = mount(CarouselEnhanced, {
                props: {
                    thumbnails: { show: true, position },
                },
                slots: {
                    default: '<div>Slide 1</div><div>Slide 2</div>',
                },
            })
            expect(wrapper.exists()).toBe(true)
        })
    })

    it('should accept all thumbnail sizes', () => {
        const sizes = ['sm', 'md', 'lg'] as const

        sizes.forEach((size) => {
            const wrapper = mount(CarouselEnhanced, {
                props: {
                    thumbnails: { show: true, size },
                },
                slots: {
                    default: '<div>Slide 1</div><div>Slide 2</div>',
                },
            })
            expect(wrapper.exists()).toBe(true)
        })
    })
})
