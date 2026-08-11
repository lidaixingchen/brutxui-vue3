import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { Mail } from '@lucide/vue'
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
        expect(wrapper.find('.brutal-input-container').classes()).toContain('border-brutal')

        await wrapper.setProps({ variant: 'error' } as any)
        expect(wrapper.find('.brutal-input-container').classes()).toContain('border-brutal-destructive')

        await wrapper.setProps({ variant: 'success' } as any)
        expect(wrapper.find('.brutal-input-container').classes()).toContain('border-brutal-success')
    })

    it('applies size classes via size prop', async () => {
        const wrapper = mount(Input)

        await wrapper.setProps({ size: 'sm' } as any)
        expect(wrapper.find('.brutal-input-container').classes()).toContain('h-9')

        await wrapper.setProps({ size: 'default' } as any)
        expect(wrapper.find('.brutal-input-container').classes()).toContain('h-11')

        await wrapper.setProps({ size: 'lg' } as any)
        expect(wrapper.find('.brutal-input-container').classes()).toContain('h-14')
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
        expect(wrapper.find('.brutal-input-container').classes()).toContain('custom-class')
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
        expect(wrapper.find('.brutal-input-container').classes()).toContain('border-brutal')
        expect(wrapper.find('.brutal-input-container').classes()).toContain('bg-brutal-bg')
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
            await wrapper.find('.brutal-input-container').trigger('mouseenter')
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
            await wrapper.find('.brutal-input-container').trigger('mouseenter')
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
            wrapper.find('.brutal-input-container').trigger('mouseenter')
            expect(wrapper.find('button').exists()).toBe(false)
        })

        it('does not show clear button when clearable is false', async () => {
            const wrapper = mount(Input, {
                props: {
                    clearable: false,
                    modelValue: 'hello',
                },
            })

            await wrapper.find('.brutal-input-container').trigger('mouseenter')
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

    describe('IME composition', () => {
        it('does not emit update:modelValue while composing', async () => {
            const wrapper = mount(Input, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            // 组合期间的 input 事件应被守卫拦截，不 emit
            await wrapper.find('input').setValue('中')

            expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        })

        it('emits final value once when compositionend is followed by a duplicate input', async () => {
            const wrapper = mount(Input, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            await wrapper.find('input').setValue('中')
            await wrapper.find('input').setValue('中文')
            // compositionend 兜底 emit 最终值
            await wrapper.find('input').trigger('compositionend')
            // 浏览器随后再次触发携带相同值的 input，应被 skipNextInput 去重，不再重复 emit
            await wrapper.find('input').trigger('input')

            const emitted = wrapper.emitted('update:modelValue')
            expect(emitted).toHaveLength(1)
            expect(emitted![0]).toEqual(['中文'])
        })

        it('restores input emission after compositioncancel', async () => {
            const wrapper = mount(Input, {
                props: { modelValue: '' },
            })

            await wrapper.find('input').trigger('compositionstart')
            await wrapper.find('input').trigger('compositioncancel')
            // 取消组合后 isComposing 已复位，后续普通 input 应正常 emit
            await wrapper.find('input').setValue('hello')

            expect(wrapper.emitted('update:modelValue')![0]).toEqual(['hello'])
        })
    })

    // 新增测试：容器聚焦反馈（不可聚焦，须用 focus-within）、只读语义与后缀优先级
    describe('focus feedback & suffix priority', () => {
        it('uses focus-within shadow for error variant', () => {
            const wrapper = mount(Input, { props: { variant: 'error' } })
            expect(wrapper.find('.brutal-input-container').classes()).toContain('focus-within:shadow-brutal-primary')
        })

        it('uses focus-within shadow for success variant', () => {
            const wrapper = mount(Input, { props: { variant: 'success' } })
            expect(wrapper.find('.brutal-input-container').classes()).toContain('focus-within:shadow-brutal-secondary')
        })

        it('does not show clear button when readonly', async () => {
            const wrapper = mount(Input, {
                props: { clearable: true, modelValue: 'hello', readonly: true },
            })
            await wrapper.find('.brutal-input-container').trigger('mouseenter')
            await nextTick()
            expect(wrapper.find('button').exists()).toBe(false)
        })

        it('does not show password toggle when disabled or readonly', () => {
            const disabledWrapper = mount(Input, {
                props: { type: 'password', showPassword: true, disabled: true },
            })
            expect(disabledWrapper.find('button').exists()).toBe(false)

            const readonlyWrapper = mount(Input, {
                props: { type: 'password', showPassword: true, readonly: true },
            })
            expect(readonlyWrapper.find('button').exists()).toBe(false)
        })

        it('gives the clear button an accessible label', async () => {
            const wrapper = mount(Input, {
                props: { clearable: true, modelValue: 'hello' },
            })
            await wrapper.find('.brutal-input-container').trigger('mouseenter')
            await nextTick()
            expect(wrapper.find('button').attributes('aria-label')).toBeTruthy()
        })

        it('hides suffix icon when password toggle is shown', () => {
            const wrapper = mount(Input, {
                props: { type: 'password', showPassword: true, suffixIcon: Mail },
            })
            expect(wrapper.find('.lucide-mail').exists()).toBe(false)
            expect(wrapper.find('button').exists()).toBe(true)
        })

        it('hides suffix icon when clear button is shown', async () => {
            const wrapper = mount(Input, {
                props: { clearable: true, modelValue: 'hello', suffixIcon: Mail },
            })
            await wrapper.find('.brutal-input-container').trigger('mouseenter')
            await nextTick()
            expect(wrapper.find('button').exists()).toBe(true)
            expect(wrapper.find('.lucide-mail').exists()).toBe(false)
        })

        it('shows suffix icon and keeps suffix padding when no suffix control is active', () => {
            const wrapper = mount(Input, {
                props: { clearable: true, suffixIcon: Mail },
            })
            expect(wrapper.find('.lucide-mail').exists()).toBe(true)
            expect(wrapper.find('input').classes()).toContain('pr-9')
        })

        it('derives aria-invalid from error variant', () => {
            const wrapper = mount(Input, { props: { variant: 'error' } })
            expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
        })

        it('keeps explicit ariaInvalid override', () => {
            const wrapper = mount(Input, { props: { variant: 'error', ariaInvalid: false } })
            expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')
        })

        it('keeps only the variant focus-within shadow after twMerge', () => {
            // cn(twMerge) 合并 base 的 focus-within:shadow-brutal-lg 与变体的彩色阴影，
            // DOM 上只保留变体类，避免同一 box-shadow 双类导致 CSS 顺序不确定
            const wrapper = mount(Input, { props: { variant: 'error' } })
            const classes = wrapper.find('.brutal-input-container').classes().join(' ')
            expect(classes).toContain('focus-within:shadow-brutal-primary')
            expect(classes).not.toContain('focus-within:shadow-brutal-lg')
        })
    })
})
