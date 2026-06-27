import { mount } from '@vue/test-utils'
import NoiseBackground from './NoiseBackground.vue'

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
})

describe('NoiseBackground', () => {
    it('renders with default props', () => {
        wrapper = mount(NoiseBackground)
        expect(wrapper.exists()).toBe(true)
    })

    it('renders SVG filter element', () => {
        wrapper = mount(NoiseBackground)
        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
        const filter = wrapper.find('filter')
        expect(filter.exists()).toBe(true)
    })

    it('renders feTurbulence element', () => {
        wrapper = mount(NoiseBackground)
        const turbulence = wrapper.find('feTurbulence')
        expect(turbulence.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(NoiseBackground, {
            props: { class: 'custom-noise' },
        })
        expect(wrapper.classes()).toContain('custom-noise')
    })

    it('applies rounded variant', () => {
        wrapper = mount(NoiseBackground, {
            props: { rounded: 'default' },
        })
        expect(wrapper.classes()).toContain('rounded-brutal')
    })

    it('renders slot content', () => {
        wrapper = mount(NoiseBackground, {
            slots: {
                default: '<div class="slot-content">Content</div>',
            },
        })
        const slotContent = wrapper.find('.slot-content')
        expect(slotContent.exists()).toBe(true)
        expect(slotContent.text()).toBe('Content')
    })

    it('sets correct feTurbulence type', () => {
        wrapper = mount(NoiseBackground, {
            props: { type: 'turbulence' },
        })
        const turbulence = wrapper.find('feTurbulence')
        expect(turbulence.attributes('type')).toBe('turbulence')
    })

    it('sets correct baseFrequency', () => {
        wrapper = mount(NoiseBackground, {
            props: { frequency: 0.8 },
        })
        const turbulence = wrapper.find('feTurbulence')
        // Vue 3 会将 camelCase 属性转为 kebab-case，但 SVG 属性保持原样
        const baseFreq = turbulence.attributes('baseFrequency') ?? turbulence.attributes('basefrequency')
        expect(baseFreq).toBe('0.8')
    })

    it('sets correct numOctaves', () => {
        wrapper = mount(NoiseBackground, {
            props: { octaves: 5 },
        })
        const turbulence = wrapper.find('feTurbulence')
        const numOct = turbulence.attributes('numOctaves') ?? turbulence.attributes('numoctaves')
        expect(numOct).toBe('5')
    })

    it('sets correct opacity on rect', () => {
        wrapper = mount(NoiseBackground, {
            props: { opacity: 0.7 },
        })
        const rect = wrapper.find('rect')
        expect(rect.attributes('opacity')).toBe('0.7')
    })

    it('has pointer-events-none on SVG', () => {
        wrapper = mount(NoiseBackground)
        const svg = wrapper.find('svg')
        expect(svg.classes()).toContain('pointer-events-none')
    })

    it('has aria-hidden on SVG', () => {
        wrapper = mount(NoiseBackground)
        const svg = wrapper.find('svg')
        expect(svg.attributes('aria-hidden')).toBe('true')
    })

    it('renders content with relative z-10', () => {
        wrapper = mount(NoiseBackground, {
            slots: {
                default: '<p>Test</p>',
            },
        })
        const contentWrapper = wrapper.find('.relative.z-10')
        expect(contentWrapper.exists()).toBe(true)
    })
})
