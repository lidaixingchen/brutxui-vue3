import { mount } from '@vue/test-utils'
import Toggle from './Toggle.vue'
import { Loader2 } from '@lucide/vue'

describe('Toggle', () => {
    it('renders with default props', () => {
        const wrapper = mount(Toggle, {
            attachTo: document.body,
        })
        expect(wrapper.find('button').exists()).toBe(true)
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Toggle, {
            attachTo: document.body,
        })

        await wrapper.setProps({ variant: 'default' } as any)
        expect(wrapper.classes()).toContain('shadow-brutal-sm')

        await wrapper.setProps({ variant: 'outline' } as any)
        expect(wrapper.classes()).toContain('border-brutal')
    })

    it('applies size classes', async () => {
        const wrapper = mount(Toggle, {
            attachTo: document.body,
        })

        await wrapper.setProps({ size: 'sm' } as any)
        expect(wrapper.classes()).toContain('h-8')

        await wrapper.setProps({ size: 'default' } as any)
        expect(wrapper.classes()).toContain('h-10')

        await wrapper.setProps({ size: 'lg' } as any)
        expect(wrapper.classes()).toContain('h-12')
    })

    it('emits update:modelValue when toggled', async () => {
        const wrapper = mount(Toggle, {
            attachTo: document.body,
        })
        await wrapper.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Toggle, {
            props: { disabled: true },
            attachTo: document.body,
        })
        expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('applies custom class', () => {
        const wrapper = mount(Toggle, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('passes ariaLabel to aria-label attribute', () => {
        const wrapper = mount(Toggle, {
            props: { ariaLabel: '加粗' },
            attachTo: document.body,
        })
        expect(wrapper.find('button').attributes('aria-label')).toBe('加粗')
    })

    it('renders Loader2 spinner when loading=true', () => {
        const wrapper = mount(Toggle, {
            props: { loading: true },
            attachTo: document.body,
        })
        expect(wrapper.findComponent(Loader2).exists()).toBe(true)
    })

    it('disables button when loading=true', () => {
        const wrapper = mount(Toggle, {
            props: { loading: true },
            attachTo: document.body,
        })
        expect(wrapper.find('button').attributes('disabled')).toBeDefined()
        expect(wrapper.find('button').attributes('aria-busy')).toBe('true')
    })

    it('does not render spinner when loading=false', () => {
        const wrapper = mount(Toggle, {
            props: { loading: false },
            attachTo: document.body,
        })
        expect(wrapper.findComponent(Loader2).exists()).toBe(false)
    })
})
