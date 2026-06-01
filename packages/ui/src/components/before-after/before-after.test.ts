import { mount } from '@vue/test-utils'
import BeforeAfter from './BeforeAfter.vue'

describe('BeforeAfter', () => {
    it('renders before and after images', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const imgs = wrapper.findAll('img')
        expect(imgs).toHaveLength(2)
        expect(imgs[0].attributes('src')).toBe('/before.jpg')
        expect(imgs[1].attributes('src')).toBe('/after.jpg')
    })

    it('applies default root classes', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('relative')
        expect(classes).toContain('overflow-hidden')
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('shadow-brutal')
        expect(classes).toContain('rounded-brutal')
    })

    it('renders range input', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const input = wrapper.find('input[type="range"]')
        expect(input.exists()).toBe(true)
        expect(input.attributes('min')).toBe('0')
        expect(input.attributes('max')).toBe('100')
    })

    it('images have correct default alt text', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const imgs = wrapper.findAll('img')
        expect(imgs[0].attributes('alt')).toBe('Before')
        expect(imgs[1].attributes('alt')).toBe('After')
    })

    it('images use custom alt text when provided', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                beforeAlt: 'Original',
                afterAlt: 'Modified',
            },
        })
        const imgs = wrapper.findAll('img')
        expect(imgs[0].attributes('alt')).toBe('Original')
        expect(imgs[1].attributes('alt')).toBe('Modified')
    })

    it('range input uses default value of 50', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).value).toBe('50')
    })

    it('range input uses custom defaultValue', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                defaultValue: 75,
            },
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).value).toBe('75')
    })

    it('disables range input when disabled prop is true', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                disabled: true,
            },
        })
        const input = wrapper.find('input[type="range"]')
        expect((input.element as HTMLInputElement).disabled).toBe(true)
    })

    it('renders handle with MoveHorizontal icon', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
            },
        })
        const handle = wrapper.find('.absolute.top-1\\/2')
        expect(handle.exists()).toBe(true)
    })

    it('merges custom class prop', () => {
        const wrapper = mount(BeforeAfter, {
            props: {
                before: '/before.jpg',
                after: '/after.jpg',
                class: 'custom-class',
            },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })
})
