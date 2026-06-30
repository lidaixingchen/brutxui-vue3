import { mount } from '@vue/test-utils'
import Textarea from './Textarea.vue'

describe('Textarea', () => {
    it('renders with default props', () => {
        const wrapper = mount(Textarea)
        expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ variant: 'default' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal-success')
    })

    it('applies size classes via size prop', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ size: 'sm' } as any)
        expect(wrapper.find('textarea').classes()).toContain('text-sm')

        await wrapper.setProps({ size: 'default' } as any)
        expect(wrapper.find('textarea').classes()).toContain('text-base')

        await wrapper.setProps({ size: 'lg' } as any)
        expect(wrapper.find('textarea').classes()).toContain('text-lg')
    })

    it('has v-model support (emits update:modelValue on input)', async () => {
        const wrapper = mount(Textarea, {
            props: { modelValue: '' },
        })
        await wrapper.find('textarea').setValue('hello')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Textarea, {
            props: { disabled: true },
        })
        expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    })

    it('shows placeholder text', () => {
        const wrapper = mount(Textarea, {
            props: { placeholder: 'Enter text' },
        })
        expect(wrapper.find('textarea').attributes('placeholder')).toBe('Enter text')
    })

    it('applies custom class', () => {
        const wrapper = mount(Textarea, {
            props: { class: 'custom-class' },
        })
        expect(wrapper.find('textarea').classes()).toContain('custom-class')
    })

    it('supports readonly prop', () => {
        const wrapper = mount(Textarea, {
            props: { readonly: true },
        })
        expect(wrapper.find('textarea').attributes('readonly')).toBeDefined()
        expect(wrapper.find('textarea').classes()).toContain('cursor-default')
    })

    it('does not apply opacity-50 when readonly', () => {
        const wrapper = mount(Textarea, {
            props: { readonly: true },
        })
        expect(wrapper.find('textarea').classes()).not.toContain('opacity-50')
    })

    it('shows error message when variant is error and errorMessage is provided', () => {
        const wrapper = mount(Textarea, {
            props: { variant: 'error', errorMessage: 'This field is required' },
        })
        const errorMsg = wrapper.find('[role="alert"]')
        expect(errorMsg.exists()).toBe(true)
        expect(errorMsg.text()).toBe('This field is required')
    })

    it('exposes ref, focus, blur, select methods', () => {
        const wrapper = mount(Textarea)
        expect(wrapper.vm.ref).toBeDefined()
        expect(typeof wrapper.vm.focus).toBe('function')
        expect(typeof wrapper.vm.blur).toBe('function')
        expect(typeof wrapper.vm.select).toBe('function')
    })
})
