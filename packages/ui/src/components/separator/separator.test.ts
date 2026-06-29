import { mount } from '@vue/test-utils'
import Separator from './Separator.vue'

describe('Separator', () => {
    it('renders with default props', () => {
        const wrapper = mount(Separator, { attachTo: document.body })
        const classes = wrapper.classes()
        expect(classes).toContain('shrink-0')
        expect(classes).toContain('bg-brutal-fg')
        expect(classes).toContain('h-[var(--sep-thickness,3px)]')
        expect(classes).toContain('w-full')
    })

    it('has separator role when decorative is false', () => {
        const wrapper = mount(Separator, {
            props: { decorative: false },
            attachTo: document.body,
        })
        expect(wrapper.attributes('role')).toBe('separator')
    })

    it('has none role when decorative is true', () => {
        const wrapper = mount(Separator, {
            props: { decorative: true },
            attachTo: document.body,
        })
        expect(wrapper.attributes('role')).toBe('none')
    })

    it('has horizontal data-orientation by default', () => {
        const wrapper = mount(Separator, { attachTo: document.body })
        expect(wrapper.attributes('data-orientation')).toBe('horizontal')
    })

    it('applies vertical orientation classes', () => {
        const wrapper = mount(Separator, {
            props: { orientation: 'vertical' },
            attachTo: document.body,
        })
        const classes = wrapper.classes()
        expect(classes).toContain('h-full')
        expect(classes).toContain('w-[var(--sep-thickness,3px)]')
    })

    it('has vertical data-orientation when set', () => {
        const wrapper = mount(Separator, {
            props: { orientation: 'vertical' },
            attachTo: document.body,
        })
        expect(wrapper.attributes('data-orientation')).toBe('vertical')
    })

    it('applies custom class', () => {
        const wrapper = mount(Separator, {
            props: { class: 'my-separator' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('my-separator')
    })

    it('has data-orientation when decorative is false', () => {
        const wrapper = mount(Separator, {
            props: { decorative: false },
            attachTo: document.body,
        })
        expect(wrapper.attributes('data-orientation')).toBe('horizontal')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(Separator, { attachTo: document.body })
        expect(wrapper.classes()).toContain('bg-brutal-fg')
    })

    it('applies primary variant classes', () => {
        const wrapper = mount(Separator, {
            props: { variant: 'primary' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('bg-brutal-primary')
    })

    it('applies muted variant classes', () => {
        const wrapper = mount(Separator, {
            props: { variant: 'muted' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('bg-brutal-muted')
    })

    it('applies sm size via CSS variable', () => {
        const wrapper = mount(Separator, {
            props: { size: 'sm' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('[--sep-thickness:2px]')
    })

    it('applies default size via CSS variable', () => {
        const wrapper = mount(Separator, { attachTo: document.body })
        expect(wrapper.classes()).toContain('[--sep-thickness:var(--brutal-border-width,3px)]')
    })

    it('applies lg size via CSS variable', () => {
        const wrapper = mount(Separator, {
            props: { size: 'lg' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('[--sep-thickness:5px]')
    })

    it('renders text separator with label slot when horizontal', () => {
        const wrapper = mount(Separator, {
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        expect(wrapper.text()).toContain('OR')
        expect(wrapper.attributes('role')).toBe('none')
        expect(wrapper.attributes('data-orientation')).toBe('horizontal')
        const lines = wrapper.findAll('div.flex-1')
        expect(lines.length).toBe(2)
    })

    it('text separator respects decorative=false role', () => {
        const wrapper = mount(Separator, {
            props: { decorative: false },
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        expect(wrapper.attributes('role')).toBe('separator')
    })

    it('renders plain separator without label slot', () => {
        const wrapper = mount(Separator, { attachTo: document.body })
        expect(wrapper.findAll('div.flex-1').length).toBe(0)
    })

    it('renders plain separator with label slot when vertical', () => {
        const wrapper = mount(Separator, {
            props: { orientation: 'vertical' },
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        expect(wrapper.findAll('div.flex-1').length).toBe(0)
    })

    it('applies variant to text separator lines', () => {
        const wrapper = mount(Separator, {
            props: { variant: 'primary' },
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        const lines = wrapper.findAll('div.flex-1')
        lines.forEach(line => {
            expect(line.classes()).toContain('bg-brutal-primary')
        })
    })

    it('applies size to text separator lines via CSS variable', () => {
        const wrapper = mount(Separator, {
            props: { size: 'lg' },
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        const lines = wrapper.findAll('div.flex-1')
        lines.forEach(line => {
            expect(line.classes()).toContain('[--sep-thickness:5px]')
        })
    })

    it('applies custom class to text separator lines', () => {
        const wrapper = mount(Separator, {
            props: { class: 'my-text-sep' },
            slots: { default: 'OR' },
            attachTo: document.body,
        })
        // props.class 应应用到线条上，而非 wrapper
        const lines = wrapper.findAll('div.flex-1')
        lines.forEach(line => {
            expect(line.classes()).toContain('my-text-sep')
        })
    })
})
