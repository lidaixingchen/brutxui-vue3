import { mount } from '@vue/test-utils'
import Input from './Input.vue'

describe('Input', () => {
    it('renders with default type="text"', () => {
        const wrapper = mount(Input)
        expect(wrapper.element.tagName).toBe('INPUT')
        expect(wrapper.attributes('type')).toBe('text')
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ variant: 'default' })
        expect(wrapper.classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' })
        expect(wrapper.classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' })
        expect(wrapper.classes()).toContain('border-brutal-success')
    })

    it('applies size classes via inputSize prop', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ inputSize: 'sm' })
        expect(wrapper.classes()).toContain('h-9')

        await wrapper.setProps({ inputSize: 'default' })
        expect(wrapper.classes()).toContain('h-11')

        await wrapper.setProps({ inputSize: 'lg' })
        expect(wrapper.classes()).toContain('h-14')
    })

    it('has v-model support (emits update:modelValue on input)', async () => {
        const wrapper = mount(Input, {
            props: { modelValue: '' },
        })
        await wrapper.setValue('hello')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Input, {
            props: { disabled: true },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('shows placeholder text', () => {
        const wrapper = mount(Input, {
            props: { placeholder: 'Enter text' },
        })
        expect(wrapper.attributes('placeholder')).toBe('Enter text')
    })

    it('applies custom class', () => {
        const wrapper = mount(Input, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('supports readonly attribute', () => {
        const wrapper = mount(Input, {
            attrs: { readonly: '' },
        })
        expect(wrapper.attributes('readonly')).toBeDefined()
    })

    it('supports type="password"', () => {
        const wrapper = mount(Input, {
            props: { type: 'password' },
        })
        expect(wrapper.attributes('type')).toBe('password')
    })

    it('supports type="email"', () => {
        const wrapper = mount(Input, {
            props: { type: 'email' },
        })
        expect(wrapper.attributes('type')).toBe('email')
    })

    it('supports type="number"', () => {
        const wrapper = mount(Input, {
            props: { type: 'number' },
        })
        expect(wrapper.attributes('type')).toBe('number')
    })

    it('has default border-brutal class', () => {
        const wrapper = mount(Input)
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
    })
})
