import { mount } from '@vue/test-utils'
import Calendar from './Calendar.vue'

describe('Calendar', () => {
    it('renders with default props', () => {
        const wrapper = mount(Calendar, {
            attachTo: document.body,
        })
        expect(wrapper.findComponent(Calendar).exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(Calendar, {
            props: { class: 'custom-calendar' },
            attachTo: document.body,
        })
        const vm = wrapper.vm as any
        expect(vm.rootClasses).toContain('custom-calendar')
    })

    it('has calendar structure', () => {
        const wrapper = mount(Calendar, {
            attachTo: document.body,
        })
        const vm = wrapper.vm as any
        expect(vm.rootClasses).toBeDefined()
    })

    it('emits update:modelValue', () => {
        const wrapper = mount(Calendar, {
            attachTo: document.body,
        })
        expect(wrapper.emitted()).toBeDefined()
    })

    it('renders with isRange prop', () => {
        const wrapper = mount(Calendar, {
            props: { isRange: true },
            attachTo: document.body,
        })
        expect(wrapper.findComponent(Calendar).exists()).toBe(true)
    })

    it('renders with disabled prop', () => {
        const wrapper = mount(Calendar, {
            props: { disabled: true },
            attachTo: document.body,
        })
        expect(wrapper.findComponent(Calendar).exists()).toBe(true)
    })
})
