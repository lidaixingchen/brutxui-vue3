import { mount } from '@vue/test-utils'
import Input from './Input.vue'

describe('Input', () => {
    it('renders with default type="text"', () => {
        const wrapper = mount(Input)
        const input = wrapper.find('input')
        expect(input.exists()).toBe(true)
        expect(input.attributes('type')).toBe('text')
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ variant: 'default' })
        expect(wrapper.find('input').classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' })
        expect(wrapper.find('input').classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' })
        expect(wrapper.find('input').classes()).toContain('border-brutal-success')
    })

    it('applies size classes via size prop', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ size: 'sm' })
        expect(wrapper.find('input').classes()).toContain('h-9')

        await wrapper.setProps({ size: 'default' })
        expect(wrapper.find('input').classes()).toContain('h-11')

        await wrapper.setProps({ size: 'lg' })
        expect(wrapper.find('input').classes()).toContain('h-14')
    })

    it('has v-model support (emits update:modelValue on input)', async () => {
        const wrapper = mount(Input, {
            props: { modelValue: '' },
        })
        await wrapper.find('input').setValue('hello')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Input, {
            props: { disabled: true },
        })
        expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    })

    it('shows placeholder text', () => {
        const wrapper = mount(Input, {
            props: { placeholder: 'Enter text' },
        })
        expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text')
    })

    it('applies custom class', () => {
        const wrapper = mount(Input, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.find('input').classes()).toContain('custom-class')
    })

    it('supports readonly prop', () => {
        const wrapper = mount(Input, {
            props: { readonly: true },
        })
        expect(wrapper.find('input').attributes('readonly')).toBeDefined()
        expect(wrapper.find('input').classes()).toContain('cursor-default')
    })

    it('does not apply opacity-50 when readonly', () => {
        const wrapper = mount(Input, {
            props: { readonly: true },
        })
        expect(wrapper.find('input').classes()).not.toContain('opacity-50')
    })

    it('supports type="password"', () => {
        const wrapper = mount(Input, {
            props: { type: 'password' },
        })
        expect(wrapper.find('input').attributes('type')).toBe('password')
    })

    it('supports type="email"', () => {
        const wrapper = mount(Input, {
            props: { type: 'email' },
        })
        expect(wrapper.find('input').attributes('type')).toBe('email')
    })

    it('supports type="number"', () => {
        const wrapper = mount(Input, {
            props: { type: 'number' },
        })
        expect(wrapper.find('input').attributes('type')).toBe('number')
    })

    it('has default border-brutal class', () => {
        const wrapper = mount(Input)
        expect(wrapper.find('input').classes()).toContain('border-brutal')
        expect(wrapper.find('input').classes()).toContain('bg-brutal-bg')
    })

    it('shows error message when variant is error and errorMessage is provided', () => {
        const wrapper = mount(Input, {
            props: { variant: 'error', errorMessage: 'This field is required' },
        })
        const errorMsg = wrapper.find('[role="alert"]')
        expect(errorMsg.exists()).toBe(true)
        expect(errorMsg.text()).toBe('This field is required')
    })

    it('does not show error message when variant is not error', () => {
        const wrapper = mount(Input, {
            props: { variant: 'default', errorMessage: 'This field is required' },
        })
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('exposes ref, focus, blur, select methods', () => {
        const wrapper = mount(Input)
        expect(wrapper.vm.ref).toBeDefined()
        expect(typeof wrapper.vm.focus).toBe('function')
        expect(typeof wrapper.vm.blur).toBe('function')
        expect(typeof wrapper.vm.select).toBe('function')
    })
})
