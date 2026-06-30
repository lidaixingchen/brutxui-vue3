import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
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

// Mock useCarouselEnhanced - 在 happy-dom 测试环境中 embla-carousel 无法完整初始化，
// 因为 happy-dom 缺少真实的布局引擎。scrollSnaps 需要通过 emblaApi 初始化后填充，
// 但 emblaApi 在测试环境中永远不会初始化，导致 scrollSnaps 始终为空数组。
// 通过 mock composable 返回有效的 scrollSnaps 值来正确测试 UI 渲染逻辑。
const mockScrollSnaps = ref<number[]>([0, 1])
const mockSelectedIndex = ref(0)
const mockCanScrollPrev = computed(() => mockSelectedIndex.value > 0)
const mockCanScrollNext = computed(() => mockSelectedIndex.value < mockScrollSnaps.value.length - 1)
const mockAutoplayProgress = ref(0)

vi.mock('@/composables/useCarouselEnhanced', () => ({
    useCarouselEnhanced: () => ({
        emblaRef: ref(null),
        selectedIndex: mockSelectedIndex,
        scrollSnaps: mockScrollSnaps,
        canScrollPrev: mockCanScrollPrev,
        canScrollNext: mockCanScrollNext,
        scrollPrev: vi.fn(),
        scrollNext: vi.fn(),
        scrollTo: vi.fn(),
        startAutoplay: vi.fn(),
        stopAutoplay: vi.fn(),
        autoplayProgress: mockAutoplayProgress,
    }),
}))

describe('CarouselEnhanced', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 重置 mock 状态到默认值（scrollSnaps 默认为空，模拟 embla 未初始化的状态）
        mockScrollSnaps.value = []
        mockSelectedIndex.value = 0
        mockAutoplayProgress.value = 0
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
        // 模拟 embla 初始化后有 2 个 scroll snap 的状态
        mockScrollSnaps.value = [0, 1]
        const wrapper = mount(CarouselEnhanced, {
            props: {
                autoplay: true,
                autoplayIndicator: { type: 'dots' },
            },
            slots: {
                default: '<div>Slide 1</div><div>Slide 2</div>',
            },
        })
        // 当 autoplay、autoplayIndicator.type === 'dots' 和 scrollSnaps.length > 1
        // 同时满足时，应渲染 dots 指示器
        const dotsContainer = wrapper.find('.absolute.bottom-3')
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
