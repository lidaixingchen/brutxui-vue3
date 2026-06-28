import { mount } from '@vue/test-utils'
import Label from './Label.vue'

describe('Label', () => {
    it('renders with default props', () => {
        const wrapper = mount(Label, { attachTo: document.body })
        const classes = wrapper.classes()
        expect(classes).toContain('text-sm')
        expect(classes).toContain('font-bold')
        expect(classes).toContain('tracking-wide')
        expect(classes).toContain('leading-none')
    })

    it('renders slot content', () => {
        const wrapper = mount(Label, {
            slots: { default: 'Username' },
            attachTo: document.body,
        })
        expect(wrapper.text()).toBe('Username')
    })

    it('renders a label element', () => {
        const wrapper = mount(Label, { attachTo: document.body })
        expect(wrapper.element.tagName).toBe('LABEL')
    })

    it('applies default variant classes', () => {
        const wrapper = mount(Label, { attachTo: document.body })
        expect(wrapper.classes()).toContain('text-brutal-fg')
    })

    it('applies error variant classes', () => {
        const wrapper = mount(Label, {
            props: { variant: 'error' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('text-brutal-destructive')
    })

    it('applies success variant classes', () => {
        const wrapper = mount(Label, {
            props: { variant: 'success' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('text-brutal-success')
    })

    it('applies muted variant classes', () => {
        const wrapper = mount(Label, {
            props: { variant: 'muted' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('text-brutal-muted-foreground')
    })

    it('applies custom class', () => {
        const wrapper = mount(Label, {
            props: { class: 'my-label' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('my-label')
    })

    it('passes for attribute', () => {
        const wrapper = mount(Label, {
            props: { for: 'input-field' },
            attachTo: document.body,
        })
        expect(wrapper.attributes('for')).toBe('input-field')
    })

    it('applies default size classes', () => {
        const wrapper = mount(Label, { attachTo: document.body })
        expect(wrapper.classes()).toContain('text-sm')
    })

    it('applies sm size classes', () => {
        const wrapper = mount(Label, {
            props: { size: 'sm' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('text-xs')
    })

    it('applies lg size classes', () => {
        const wrapper = mount(Label, {
            props: { size: 'lg' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('text-base')
    })

    it('does not render required indicator by default', () => {
        const wrapper = mount(Label, { attachTo: document.body })
        expect(wrapper.find('span.text-brutal-destructive').exists()).toBe(false)
    })

    it('renders required indicator when required is true', () => {
        const wrapper = mount(Label, {
            props: { required: true },
            attachTo: document.body,
        })
        const indicator = wrapper.find('span.text-brutal-destructive')
        expect(indicator.exists()).toBe(true)
        expect(indicator.text()).toBe('*')
    })

    it('marks required indicator as aria-hidden', () => {
        const wrapper = mount(Label, {
            props: { required: true },
            attachTo: document.body,
        })
        expect(wrapper.find('span.text-brutal-destructive').attributes('aria-hidden')).toBe('true')
    })
})
