import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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

        await wrapper.setProps({ variant: 'default' } as any)
        expect(wrapper.find('input').classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' } as any)
        expect(wrapper.find('input').classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' } as any)
        expect(wrapper.find('input').classes()).toContain('border-brutal-success')
    })

    it('applies size classes via size prop', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ size: 'sm' } as any)
        expect(wrapper.find('input').classes()).toContain('h-9')

        await wrapper.setProps({ size: 'default' } as any)
        expect(wrapper.find('input').classes()).toContain('h-11')

        await wrapper.setProps({ size: 'lg' } as any)
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

    // 新增测试：密码切换功能
    describe('password toggle', () => {
        it('toggles password visibility when showPassword is true', async () => {
            const wrapper = mount(Input, {
                props: {
                    type: 'password',
                    showPassword: true,
                    modelValue: 'secret',
                },
            })

            expect(wrapper.find('input').attributes('type')).toBe('password')

            // Click the eye icon to show password
            const toggleButton = wrapper.find('button')
            await toggleButton.trigger('click')
            expect(wrapper.find('input').attributes('type')).toBe('text')

            // Click again to hide password
            await toggleButton.trigger('click')
            expect(wrapper.find('input').attributes('type')).toBe('password')
        })

        it('does not show toggle button when showPassword is false', () => {
            const wrapper = mount(Input, {
                props: {
                    type: 'password',
                    showPassword: false,
                },
            })
            expect(wrapper.find('button').exists()).toBe(false)
        })

        it('does not show toggle button for non-password type', () => {
            const wrapper = mount(Input, {
                props: {
                    type: 'text',
                    showPassword: true,
                },
            })
            expect(wrapper.find('button').exists()).toBe(false)
        })
    })

    // 新增测试：清除功能
    describe('clearable', () => {
        it('shows clear button on hover when clearable and has value', async () => {
            const wrapper = mount(Input, {
                props: {
                    clearable: true,
                    modelValue: 'hello',
                },
            })

            // Trigger mouseenter on the relative container
            await wrapper.find('.relative').trigger('mouseenter')
            await nextTick()

            // Find the clear button (X icon button)
            const buttons = wrapper.findAll('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('emits clear event when clear button is clicked', async () => {
            const wrapper = mount(Input, {
                props: {
                    clearable: true,
                    modelValue: 'hello',
                },
            })

            // Trigger mouseenter to show clear button
            await wrapper.find('.relative').trigger('mouseenter')
            await nextTick()

            // Click the clear button
            const clearButton = wrapper.find('button')
            await clearButton.trigger('click')

            expect(wrapper.emitted('update:modelValue')).toBeTruthy()
            expect(wrapper.emitted('update:modelValue')![0]).toEqual([''])
            expect(wrapper.emitted('clear')).toBeTruthy()
        })

        it('does not show clear button when modelValue is empty', () => {
            const wrapper = mount(Input, {
                props: {
                    clearable: true,
                    modelValue: '',
                },
            })

            // Even on hover, no clear button should appear
            wrapper.find('.relative').trigger('mouseenter')
            expect(wrapper.find('button').exists()).toBe(false)
        })

        it('does not show clear button when clearable is false', async () => {
            const wrapper = mount(Input, {
                props: {
                    clearable: false,
                    modelValue: 'hello',
                },
            })

            await wrapper.find('.relative').trigger('mouseenter')
            await nextTick()
            expect(wrapper.find('button').exists()).toBe(false)
        })
    })

    // 新增测试：字数统计
    describe('word limit', () => {
        it('shows word count when showWordLimit is true and maxlength is set', () => {
            const wrapper = mount(Input, {
                props: {
                    showWordLimit: true,
                    maxlength: 100,
                    modelValue: 'hello',
                },
            })

            const wordCount = wrapper.find('.text-xs.text-brutal-placeholder')
            expect(wordCount.exists()).toBe(true)
            expect(wordCount.text()).toBe('5 / 100')
        })

        it('does not show word count when showWordLimit is false', () => {
            const wrapper = mount(Input, {
                props: {
                    showWordLimit: false,
                    maxlength: 100,
                    modelValue: 'hello',
                },
            })

            expect(wrapper.find('.text-xs.text-brutal-placeholder').exists()).toBe(false)
        })

        it('does not show word count when maxlength is not set', () => {
            const wrapper = mount(Input, {
                props: {
                    showWordLimit: true,
                    modelValue: 'hello',
                },
            })

            expect(wrapper.find('.text-xs.text-brutal-placeholder').exists()).toBe(false)
        })

        it('shows 0 / maxlength when modelValue is empty', () => {
            const wrapper = mount(Input, {
                props: {
                    showWordLimit: true,
                    maxlength: 50,
                    modelValue: '',
                },
            })

            const wordCount = wrapper.find('.text-xs.text-brutal-placeholder')
            expect(wordCount.text()).toBe('0 / 50')
        })
    })

    // 新增测试：前置/后置插槽
    describe('prefix and suffix slots', () => {
        it('renders prepend slot', () => {
            const wrapper = mount(Input, {
                slots: {
                    prepend: 'https://',
                },
            })

            expect(wrapper.text()).toContain('https://')
        })

        it('renders append slot', () => {
            const wrapper = mount(Input, {
                slots: {
                    append: '.com',
                },
            })

            expect(wrapper.text()).toContain('.com')
        })

        it('renders both prepend and append slots', () => {
            const wrapper = mount(Input, {
                slots: {
                    prepend: 'https://',
                    append: '.com',
                },
            })

            expect(wrapper.text()).toContain('https://')
            expect(wrapper.text()).toContain('.com')
        })
    })

    // 新增测试：无障碍属性
    describe('accessibility', () => {
        it('renders with aria-label', () => {
            const wrapper = mount(Input, {
                props: {
                    ariaLabel: 'Username',
                },
            })

            expect(wrapper.find('input').attributes('aria-label')).toBe('Username')
        })

        it('renders with aria-labelledby', () => {
            const wrapper = mount(Input, {
                props: {
                    ariaLabelledby: 'label-id',
                },
            })

            expect(wrapper.find('input').attributes('aria-labelledby')).toBe('label-id')
        })

        it('renders with aria-describedby', () => {
            const wrapper = mount(Input, {
                props: {
                    ariaDescribedby: 'desc-id',
                },
            })

            expect(wrapper.find('input').attributes('aria-describedby')).toBe('desc-id')
        })

        it('renders with aria-invalid when variant is error', () => {
            const wrapper = mount(Input, {
                props: {
                    variant: 'error',
                    ariaInvalid: true,
                },
            })

            expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
        })

        it('renders with aria-required', () => {
            const wrapper = mount(Input, {
                props: {
                    ariaRequired: true,
                },
            })

            expect(wrapper.find('input').attributes('aria-required')).toBe('true')
        })
    })
})
