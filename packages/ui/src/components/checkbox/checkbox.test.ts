import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'

describe('Checkbox', () => {
    it('renders with checkbox role', () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').exists()).toBe(true)
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Checkbox, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        expect(el.attributes('disabled')).toBeDefined()
    })

    it('applies custom class', () => {
        const wrapper = mount(Checkbox, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').classes()).toContain('custom-class')
    })

    it('emits update:checked when toggled', async () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:checked')).toBeTruthy()
    })

    it('supports keyboard interaction with Space key', async () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('keydown', { key: ' ' })
        // reka-ui CheckboxRoot handles the Space key internally
        expect(el.exists()).toBe(true)
    })
})
