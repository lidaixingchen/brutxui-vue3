import { mount } from '@vue/test-utils'
import Kbd from './Kbd.vue'

describe('Kbd', () => {
    it('renders as kbd element', () => {
        const wrapper = mount(Kbd)
        expect(wrapper.element.tagName).toBe('KBD')
    })

    it('applies default md size classes', () => {
        const wrapper = mount(Kbd)
        const classes = wrapper.classes()
        expect(classes).toContain('px-2')
        expect(classes).toContain('py-1')
        expect(classes).toContain('text-sm')
        expect(classes).toContain('min-w-[1.75rem]')
    })

    it('applies sm size classes', () => {
        const wrapper = mount(Kbd, {
            props: { size: 'sm' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('px-1.5')
        expect(classes).toContain('py-0.5')
        expect(classes).toContain('text-xs')
        expect(classes).toContain('min-w-[1.25rem]')
    })

    it('applies lg size classes', () => {
        const wrapper = mount(Kbd, {
            props: { size: 'lg' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('px-3')
        expect(classes).toContain('py-1.5')
        expect(classes).toContain('text-base')
        expect(classes).toContain('min-w-[2.25rem]')
    })

    it('renders slot content', () => {
        const wrapper = mount(Kbd, {
            slots: { default: 'Ctrl' },
        })
        expect(wrapper.text()).toBe('Ctrl')
    })

    it('applies custom class', () => {
        const wrapper = mount(Kbd, {
            props: { class: 'my-kbd' },
        })
        expect(wrapper.classes()).toContain('my-kbd')
    })

    it('has base brutal classes', () => {
        const wrapper = mount(Kbd)
        const classes = wrapper.classes()
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
        expect(classes).toContain('rounded-brutal')
        expect(classes).toContain('shadow-brutal-sm')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(Kbd)
        const classes = wrapper.classes()
        expect(classes).toContain('bg-brutal-muted')
        expect(classes).toContain('text-brutal-fg')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(Kbd, {
            props: { variant: 'primary' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('bg-brutal-primary')
        expect(classes).toContain('text-brutal-primary-foreground')
    })

    it('applies secondary variant classes', () => {
        const wrapper = mount(Kbd, {
            props: { variant: 'secondary' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('bg-brutal-secondary')
        expect(classes).toContain('text-brutal-secondary-foreground')
    })

    it('applies accent variant classes', () => {
        const wrapper = mount(Kbd, {
            props: { variant: 'accent' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('bg-brutal-accent')
        expect(classes).toContain('text-brutal-accent-foreground')
    })

    it('combines variant and size', () => {
        const wrapper = mount(Kbd, {
            props: { variant: 'primary', size: 'lg' },
        })
        const classes = wrapper.classes()
        expect(classes).toContain('bg-brutal-primary')
        expect(classes).toContain('text-brutal-primary-foreground')
        expect(classes).toContain('px-3')
        expect(classes).toContain('text-base')
    })
})
