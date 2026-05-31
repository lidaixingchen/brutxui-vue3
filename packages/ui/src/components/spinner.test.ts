import { mount } from '@vue/test-utils'
import Spinner from './Spinner.vue'
import BlockSpinner from './BlockSpinner.vue'
import DotsSpinner from './DotsSpinner.vue'
import BarsSpinner from './BarsSpinner.vue'

describe('Spinner', () => {
    it('renders with default props', () => {
        const wrapper = mount(Spinner)
        const classes = wrapper.classes()
        expect(classes).toContain('inline-block')
        expect(classes).toContain('rounded-full')
        expect(classes).toContain('animate-spin')
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('h-8')
        expect(classes).toContain('w-8')
    })

    it('has role status and aria-label', () => {
        const wrapper = mount(Spinner)
        expect(wrapper.attributes('role')).toBe('status')
        expect(wrapper.attributes('aria-label')).toBe('Loading...')
    })

    it('renders sr-only label text', () => {
        const wrapper = mount(Spinner)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.text()).toBe('Loading...')
    })

    it('applies variant classes', () => {
        const wrapper = mount(Spinner, { props: { variant: 'primary' } })
        expect(wrapper.classes()).toContain('border-brutal-primary')
    })

    it('applies size classes', () => {
        const wrapper = mount(Spinner, { props: { size: 'lg' } })
        expect(wrapper.classes()).toContain('h-12')
        expect(wrapper.classes()).toContain('w-12')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(Spinner, {
            props: { class: 'custom-spinner' },
        })
        expect(wrapper.classes()).toContain('custom-spinner')
    })
})

describe('BlockSpinner', () => {
    it('renders with default props', () => {
        const wrapper = mount(BlockSpinner)
        const classes = wrapper.classes()
        expect(classes).toContain('grid')
        expect(classes).toContain('grid-cols-2')
        expect(classes).toContain('gap-1')
    })

    it('has role status and aria-label', () => {
        const wrapper = mount(BlockSpinner)
        expect(wrapper.attributes('role')).toBe('status')
        expect(wrapper.attributes('aria-label')).toBe('Loading...')
    })

    it('renders 4 block elements with animate-pulse', () => {
        const wrapper = mount(BlockSpinner)
        const blocks = wrapper.findAll('div.animate-pulse')
        expect(blocks.length).toBe(4)
    })

    it('applies size classes', () => {
        const wrapper = mount(BlockSpinner, { props: { size: 'lg' } })
        expect(wrapper.classes()).toContain('h-12')
        expect(wrapper.classes()).toContain('w-12')
    })

    it('renders sr-only label text', () => {
        const wrapper = mount(BlockSpinner)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.text()).toBe('Loading...')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(BlockSpinner, {
            props: { class: 'custom-block' },
        })
        expect(wrapper.classes()).toContain('custom-block')
    })
})

describe('DotsSpinner', () => {
    it('renders with default props', () => {
        const wrapper = mount(DotsSpinner)
        const classes = wrapper.classes()
        expect(classes).toContain('flex')
        expect(classes).toContain('items-center')
        expect(classes).toContain('gap-2')
    })

    it('has role status and aria-label', () => {
        const wrapper = mount(DotsSpinner)
        expect(wrapper.attributes('role')).toBe('status')
        expect(wrapper.attributes('aria-label')).toBe('Loading...')
    })

    it('renders 3 dot elements with animate-bounce', () => {
        const wrapper = mount(DotsSpinner)
        const dots = wrapper.findAll('div.animate-bounce')
        expect(dots.length).toBe(3)
    })

    it('applies size classes', () => {
        const wrapper = mount(DotsSpinner, { props: { size: 'lg' } })
        expect(wrapper.classes()).toContain('gap-3')
    })

    it('renders sr-only label text', () => {
        const wrapper = mount(DotsSpinner)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.text()).toBe('Loading...')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(DotsSpinner, {
            props: { class: 'custom-dots' },
        })
        expect(wrapper.classes()).toContain('custom-dots')
    })
})

describe('BarsSpinner', () => {
    it('renders with default props', () => {
        const wrapper = mount(BarsSpinner)
        const classes = wrapper.classes()
        expect(classes).toContain('flex')
        expect(classes).toContain('items-end')
        expect(classes).toContain('gap-0.5')
    })

    it('has role status and aria-label', () => {
        const wrapper = mount(BarsSpinner)
        expect(wrapper.attributes('role')).toBe('status')
        expect(wrapper.attributes('aria-label')).toBe('Loading...')
    })

    it('renders 5 bar elements with animate-pulse', () => {
        const wrapper = mount(BarsSpinner)
        const bars = wrapper.findAll('div.animate-pulse')
        expect(bars.length).toBe(5)
    })

    it('applies size classes', () => {
        const wrapper = mount(BarsSpinner, { props: { size: 'lg' } })
        expect(wrapper.classes()).toContain('h-8')
    })

    it('renders sr-only label text', () => {
        const wrapper = mount(BarsSpinner)
        const srOnly = wrapper.find('.sr-only')
        expect(srOnly.text()).toBe('Loading...')
    })

    it('merges custom class prop', () => {
        const wrapper = mount(BarsSpinner, {
            props: { class: 'custom-bars' },
        })
        expect(wrapper.classes()).toContain('custom-bars')
    })
})
