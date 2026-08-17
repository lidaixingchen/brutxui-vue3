import { mount } from '@vue/test-utils'
import Textarea from './Textarea.vue'

describe('Textarea', () => {
    it('renders with default props', () => {
        const wrapper = mount(Textarea)
        const textarea = wrapper.find('textarea')
        expect(textarea.exists()).toBe(true)
        expect(textarea.classes()).toContain('border-3')
        expect(textarea.classes()).toContain('border-brutal')
        expect(textarea.classes()).toContain('focus:shadow-brutal')
        expect(textarea.classes()).toContain('resize-none')
        expect(textarea.classes()).not.toContain('active:translate-x-0.5')
    })

    it('applies variant classes', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ variant: 'default' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal')
        expect(wrapper.find('textarea').classes()).toContain('focus:shadow-brutal')

        await wrapper.setProps({ variant: 'error' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal-destructive')
        expect(wrapper.find('textarea').classes()).toContain('focus:shadow-brutal-destructive')

        await wrapper.setProps({ variant: 'success' } as any)
        expect(wrapper.find('textarea').classes()).toContain('border-brutal-success')
        expect(wrapper.find('textarea').classes()).toContain('focus:shadow-brutal-success')
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

    it('applies resize classes via resize prop', async () => {
        const wrapper = mount(Textarea)

        await wrapper.setProps({ resize: 'vertical' } as any)
        expect(wrapper.find('textarea').classes()).toContain('resize-y')

        await wrapper.setProps({ resize: 'horizontal' } as any)
        expect(wrapper.find('textarea').classes()).toContain('resize-x')

        await wrapper.setProps({ resize: 'both' } as any)
        expect(wrapper.find('textarea').classes()).toContain('resize')

        await wrapper.setProps({ resize: 'none' } as any)
        expect(wrapper.find('textarea').classes()).toContain('resize-none')
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

    it('shows error message and automatically links aria-errormessage and aria-invalid', () => {
        const wrapper = mount(Textarea, {
            props: { variant: 'error', errorMessage: 'This field is required' },
        })
        const errorMsg = wrapper.find('[role="alert"]')
        expect(errorMsg.exists()).toBe(true)
        expect(errorMsg.text()).toBe('This field is required')

        const errorId = errorMsg.attributes('id')
        expect(errorId).toBeDefined()
        expect(wrapper.find('textarea').attributes('aria-errormessage')).toBe(errorId)
        expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true')
        expect(wrapper.find('textarea').attributes('aria-describedby')).toBe(errorId)
    })

    it('allows custom ariaErrormessage and ariaInvalid to override default derivation', () => {
        const wrapper = mount(Textarea, {
            props: {
                variant: 'error',
                errorMessage: 'Error info',
                ariaErrormessage: 'my-custom-error-id',
                ariaInvalid: false,
            },
        })
        const errorMsg = wrapper.find('[role="alert"]')
        expect(errorMsg.attributes('id')).toBe('my-custom-error-id')
        expect(wrapper.find('textarea').attributes('aria-errormessage')).toBe('my-custom-error-id')
        expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('false')
    })

    it('exposes ref, focus, blur, select methods', () => {
        const wrapper = mount(Textarea)
        expect(wrapper.vm.ref).toBeDefined()
        expect(typeof wrapper.vm.focus).toBe('function')
        expect(typeof wrapper.vm.blur).toBe('function')
        expect(typeof wrapper.vm.select).toBe('function')
    })

    describe('IME composition', () => {
        it('does not emit update:modelValue while composing', async () => {
            const wrapper = mount(Textarea, {
                props: { modelValue: '' },
            })

            await wrapper.find('textarea').trigger('compositionstart')
            await wrapper.find('textarea').setValue('中')

            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('emits final value once when compositionend is followed by a duplicate input', async () => {
            const wrapper = mount(Textarea, {
                props: { modelValue: '' },
            })

            await wrapper.find('textarea').trigger('compositionstart')
            await wrapper.find('textarea').setValue('中')
            await wrapper.find('textarea').setValue('中文')
            await wrapper.find('textarea').trigger('compositionend')
            await wrapper.find('textarea').trigger('input')

            const emitted = wrapper.emitted('update:modelValue')
            expect(emitted).toHaveLength(1)
            expect(emitted![0]).toEqual(['中文'])
        })

        it('restores input emission after compositioncancel', async () => {
            const wrapper = mount(Textarea, {
                props: { modelValue: '' },
            })

            await wrapper.find('textarea').trigger('compositionstart')
            await wrapper.find('textarea').trigger('compositioncancel')
            await wrapper.find('textarea').setValue('hello')

            expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
        })
    })
})
