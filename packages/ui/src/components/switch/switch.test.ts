import { mount } from '@vue/test-utils'
import Switch from './Switch.vue'
import { switchRootVariants, switchThumbVariants } from './switch-variants'

describe('Switch', () => {
    it('renders with switch role', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').exists()).toBe(true)
    })

    it('emits update:modelValue when toggled', async () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Switch, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('disabled')).toBeDefined()
    })

    it('applies custom class', () => {
        const wrapper = mount(Switch, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').classes()).toContain('custom-class')
    })

    it('applies variant classes', () => {
        const wrapper = mount(Switch, {
            props: { variant: 'primary' },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        const expected = switchRootVariants({ variant: 'primary' })
        expected.split(' ').forEach((cls) => {
            if (cls) expect(el.classes()).toContain(cls)
        })
    })

    it('applies size classes to root and thumb', () => {
        const wrapper = mount(Switch, {
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const root = wrapper.find('[role="switch"]')
        const thumb = root.find('span')
        const expectedRoot = switchRootVariants({ size: 'lg' })
        const expectedThumb = switchThumbVariants({ size: 'lg' })
        expectedRoot.split(' ').forEach((cls) => {
            if (cls) expect(root.classes()).toContain(cls)
        })
        expectedThumb.split(' ').forEach((cls) => {
            if (cls) expect(thumb.classes()).toContain(cls)
        })
    })

    it('uses default variant and size when not specified', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        const expected = switchRootVariants({ variant: 'default', size: 'default' })
        expected.split(' ').forEach((cls) => {
            if (cls) expect(el.classes()).toContain(cls)
        })
    })

    it('provides default aria-label from locale', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').attributes('aria-label')).toBe('开关')
    })

    it('uses custom ariaLabel when provided', () => {
        const wrapper = mount(Switch, {
            props: { ariaLabel: '通知开关' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').attributes('aria-label')).toBe('通知开关')
    })
})
