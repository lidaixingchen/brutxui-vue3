import { mount } from '@vue/test-utils'
import Textarea from './Textarea.vue'

describe('Textarea', () => {
    it('renders with default props', () => {
        const wrapper = mount(Textarea)
        expect(wrapper.element.tagName).toBe('TEXTAREA')
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ variant: 'default' })
        expect(wrapper.classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' })
        expect(wrapper.classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' })
        expect(wrapper.classes()).toContain('border-brutal-success')
    })

    it('applies size classes via size prop', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ size: 'sm' })
        expect(wrapper.classes()).toContain('text-sm')

        await wrapper.setProps({ size: 'default' })
        expect(wrapper.classes()).toContain('text-base')

        await wrapper.setProps({ size: 'lg' })
        expect(wrapper.classes()).toContain('text-lg')
    })

    it('has v-model support (emits update:modelValue on input)', async () => {
        const wrapper = mount(Textarea, {
            props: { modelValue: '' },
        })
        await wrapper.setValue('hello')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Textarea, {
            props: { disabled: true },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('shows placeholder text', () => {
        const wrapper = mount(Textarea, {
            props: { placeholder: 'Enter text' },
        })
        expect(wrapper.attributes('placeholder')).toBe('Enter text')
    })

    it('applies custom class', () => {
        const wrapper = mount(Textarea, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('supports readonly prop', () => {
        const wrapper = mount(Textarea, {
            props: { readonly: true },
        })
        expect(wrapper.attributes('readonly')).toBeDefined()
        expect(wrapper.classes()).toContain('cursor-default')
    })

    it('does not apply opacity-50 when readonly', () => {
        const wrapper = mount(Textarea, {
            props: { readonly: true },
        })
        expect(wrapper.classes()).not.toContain('opacity-50')
    })
})
