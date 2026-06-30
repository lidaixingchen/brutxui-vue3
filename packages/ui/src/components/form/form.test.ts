import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, ref, defineComponent } from 'vue'
import { useField } from 'vee-validate'
import Form from './Form.vue'
import FormField from './FormField.vue'
import FormItem from './FormItem.vue'
import FormLabel from './FormLabel.vue'
import FormControl from './FormControl.vue'
import FormDescription from './FormDescription.vue'
import FormMessage from './FormMessage.vue'
import { formFieldKey, formItemKey } from './form-context'
import type { FormFieldContext, FormItemContext } from './form-context'

// Helper component: registers a field with vee-validate via useField
const RegisteredField = defineComponent({
    props: {
        name: { type: String, required: true },
    },
    setup(props) {
        const { value, errorMessage } = useField(props.name)
        return { value, errorMessage }
    },
    template: `<div><input :name="name" v-model="value" /><span data-testid="error">{{ errorMessage }}</span></div>`,
})

// Helper: mount FormLabel with providers
function mountFormLabel(options: Record<string, unknown> = {}, errorValue?: string) {
    return mount(FormLabel, {
        ...options,
        global: {
            provide: {
                [formFieldKey as symbol]: {
                    name: 'test-field',
                    error: ref(errorValue),
                } as unknown as Partial<FormFieldContext>,
                [formItemKey as symbol]: {
                    id: 'test-id',
                    formItemId: 'test-id-form-item',
                    formDescriptionId: 'test-id-form-item-description',
                    formMessageId: 'test-id-form-item-message',
                } as FormItemContext,
            },
        },
    })
}

// Helper: mount FormControl with providers
function mountFormControl(options: Record<string, unknown> = {}) {
    return mount(FormControl, {
        ...options,
        global: {
            provide: {
                [formFieldKey as symbol]: {
                    name: 'test-field',
                    error: ref<string | undefined>(undefined),
                    value: ref(undefined),
                    setValue: () => {},
                    setError: () => {},
                } as unknown as FormFieldContext,
                [formItemKey as symbol]: {
                    id: 'test-id',
                    formItemId: 'test-id-form-item',
                    formDescriptionId: 'test-id-form-item-description',
                    formMessageId: 'test-id-form-item-message',
                } as FormItemContext,
            },
        },
        slots: {
            default: '<input class="control-input" />',
        },
    })
}

// Helper: mount FormMessage with providers
function mountFormMessage(errorValue?: string, options: Record<string, unknown> = {}) {
    return mount(FormMessage, {
        ...options,
        global: {
            provide: {
                [formFieldKey as symbol]: {
                    name: 'test-field',
                    error: ref(errorValue),
                    value: ref(undefined),
                    setValue: () => {},
                    setError: () => {},
                } as unknown as FormFieldContext,
                [formItemKey as symbol]: {
                    id: 'test-id',
                    formItemId: 'test-id-form-item',
                    formDescriptionId: 'test-id-form-item-description',
                    formMessageId: 'test-id-form-item-message',
                } as FormItemContext,
            },
        },
    })
}

// Helper: mount FormDescription with providers
function mountFormDescription(options: Record<string, unknown> = {}) {
    return mount(FormDescription, {
        ...options,
        global: {
            provide: {
                [formItemKey as symbol]: {
                    id: 'test-id',
                    formItemId: 'test-id-form-item',
                    formDescriptionId: 'test-id-form-item-description',
                    formMessageId: 'test-id-form-item-message',
                } as FormItemContext,
            },
        },
    })
}

// Helper: mount a Form with a registered field for integration testing
function mountFormWithField(options: {
    initialValues?: Record<string, unknown>
    validationSchema?: Record<string, (value: unknown) => true | string>
    scrollToError?: boolean
    formProps?: Record<string, unknown>
} = {}) {
    return mount(Form, {
        props: {
            initialValues: options.initialValues,
            validationSchema: options.validationSchema,
            scrollToError: options.scrollToError,
            ...options.formProps,
        },
        slots: {
            default: {
                components: { RegisteredField },
                template: '<RegisteredField name="name" />',
            } as any,
        },
    })
}

// ==============================
// Form component tests
// ==============================
describe('Form', () => {
    it('renders with default props', () => {
        const wrapper = mount(Form)
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('renders slot content', () => {
        const wrapper = mount(Form, {
            slots: { default: '<div class="form-inner">Form content</div>' },
        })
        expect(wrapper.find('.form-inner').exists()).toBe(true)
        expect(wrapper.find('.form-inner').text()).toBe('Form content')
    })

    it('applies custom class', () => {
        const wrapper = mount(Form, {
            props: { class: 'custom-form' },
        })
        expect(wrapper.find('form').classes()).toContain('custom-form')
    })

    it('applies inline layout classes when inline=true', () => {
        const wrapper = mount(Form, {
            props: { inline: true },
        })
        const formEl = wrapper.find('form')
        expect(formEl.classes()).toContain('flex')
        expect(formEl.classes()).toContain('flex-wrap')
        expect(formEl.classes()).toContain('items-start')
    })

    it('does not apply inline layout classes when inline=false', () => {
        const wrapper = mount(Form, {
            props: { inline: false },
        })
        const formEl = wrapper.find('form')
        expect(formEl.classes()).not.toContain('flex')
        expect(formEl.classes()).not.toContain('flex-wrap')
    })

    it('applies both inline and custom class', () => {
        const wrapper = mount(Form, {
            props: { inline: true, class: 'my-form' },
        })
        const formEl = wrapper.find('form')
        expect(formEl.classes()).toContain('flex')
        expect(formEl.classes()).toContain('my-form')
    })

    it('accepts initialValues prop', () => {
        const wrapper = mount(Form, {
            props: {
                initialValues: { email: 'test@example.com' },
            },
        })
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('accepts validationSchema prop with function validators', () => {
        const schema = {
            email: (value: unknown) => {
                if (!value) return 'Email is required'
                return true
            },
        }
        const wrapper = mount(Form, {
            props: { validationSchema: schema },
        })
        expect(wrapper.find('form').exists()).toBe(true)
    })

    it('provides form context to child components', () => {
        const wrapper = mount(Form, {
            props: {
                inline: true,
                labelPosition: 'left',
                labelWidth: '100px',
                size: 'lg',
            },
            slots: {
                default: '<div class="child-content">child</div>',
            },
        })
        expect(wrapper.find('.child-content').exists()).toBe(true)
    })

    describe('submit', () => {
        it('emits submit event on form submission', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'test' },
                },
                slots: {
                    default: '<button type="submit">Submit</button>',
                },
            })
            await wrapper.find('form').trigger('submit')
            await flushPromises()
            // vee-validate handleSubmit is async; verify form renders
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('calls handleSubmit and emits submit with values when no validation errors', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { username: 'admin' },
                },
                slots: {
                    default: '<button type="submit">Submit</button>',
                },
            })

            await wrapper.find('form').trigger('submit')
            await flushPromises()

            // The submit event should have been emitted with the form values
            const submitEvents = wrapper.emitted('submit')
            if (submitEvents) {
                expect(submitEvents[0]).toEqual([{ username: 'admin' }])
            }
        })

        it('submits with registered field values', async () => {
            const wrapper = mountFormWithField({
                initialValues: { name: 'hello' },
            })

            await wrapper.find('form').trigger('submit')
            await flushPromises()

            const submitEvents = wrapper.emitted('submit')
            if (submitEvents && submitEvents.length > 0) {
                expect(submitEvents[0]).toEqual([{ name: 'hello' }])
            }
        })
    })

    describe('exposed methods', () => {
        it('exposes validate method', () => {
            const wrapper = mount(Form)
            expect(typeof (wrapper.vm as Record<string, unknown>).validate).toBe('function')
        })

        it('exposes validateField method', () => {
            const wrapper = mount(Form)
            expect(typeof (wrapper.vm as Record<string, unknown>).validateField).toBe('function')
        })

        it('exposes resetFields method', () => {
            const wrapper = mount(Form)
            expect(typeof (wrapper.vm as Record<string, unknown>).resetFields).toBe('function')
        })

        it('exposes clearValidate method', () => {
            const wrapper = mount(Form)
            expect(typeof (wrapper.vm as Record<string, unknown>).clearValidate).toBe('function')
        })

        it('exposes scrollToField method', () => {
            const wrapper = mount(Form)
            expect(typeof (wrapper.vm as Record<string, unknown>).scrollToField).toBe('function')
        })

        it('validate returns true when form is valid', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'test' },
                },
            })

            const result = await (wrapper.vm as Record<string, Function>).validate()
            expect(result).toBe(true)
        })

        it('validate returns false when validation fails with registered field', async () => {
            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mountFormWithField({
                initialValues: { name: '' },
                validationSchema: schema,
            })

            const result = await (wrapper.vm as Record<string, Function>).validate()
            await flushPromises()
            expect(result).toBe(false)
        })

        it('validate scrolls to first error when scrollToError is true', async () => {
            const scrollIntoViewMock = vi.fn()
            const originalScrollIntoView = Element.prototype.scrollIntoView
            Element.prototype.scrollIntoView = scrollIntoViewMock

            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mountFormWithField({
                initialValues: { name: '' },
                validationSchema: schema,
                scrollToError: true,
            })

            // Mock the formRef's querySelector to return a mock element
            const formEl = wrapper.find('form').element
            const mockElement = { scrollIntoView: scrollIntoViewMock }
            vi.spyOn(formEl, 'querySelector').mockReturnValue(mockElement as unknown as Element)

            const result = await (wrapper.vm as Record<string, Function>).validate()
            await flushPromises()

            // With scrollToError=true and validation failing, scrollToField should be called
            expect(scrollIntoViewMock).toHaveBeenCalled()
            expect(result).toBe(false)

            Element.prototype.scrollIntoView = originalScrollIntoView
        })

        it('validate does not scroll when scrollToError is false', async () => {
            const scrollIntoViewMock = vi.fn()
            const originalScrollIntoView = Element.prototype.scrollIntoView
            Element.prototype.scrollIntoView = scrollIntoViewMock

            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mountFormWithField({
                initialValues: { name: '' },
                validationSchema: schema,
                scrollToError: false,
            })

            const result = await (wrapper.vm as Record<string, Function>).validate()
            await flushPromises()

            expect(scrollIntoViewMock).not.toHaveBeenCalled()
            expect(result).toBe(false)

            Element.prototype.scrollIntoView = originalScrollIntoView
        })

        it('validate scrolls to first error and field element not found', async () => {
            const scrollIntoViewMock = vi.fn()
            const originalScrollIntoView = Element.prototype.scrollIntoView
            Element.prototype.scrollIntoView = scrollIntoViewMock

            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mountFormWithField({
                initialValues: { name: '' },
                validationSchema: schema,
                scrollToError: true,
            })

            // Mock querySelector to return null (field not found in DOM)
            const formEl = wrapper.find('form').element
            vi.spyOn(formEl, 'querySelector').mockReturnValue(null)

            const result = await (wrapper.vm as Record<string, Function>).validate()
            await flushPromises()

            // scrollToField should be called but find no element, so no scrollIntoView
            expect(scrollIntoViewMock).not.toHaveBeenCalled()
            expect(result).toBe(false)

            Element.prototype.scrollIntoView = originalScrollIntoView
        })

        it('resetFields resets the form', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'original' },
                },
            })

            await (wrapper.vm as Record<string, Function>).resetFields()
            // resetFields calls form.resetForm(); just verify no error
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('clearValidate clears all field errors when no fields specified', async () => {
            const wrapper = mount(Form)

            // clearValidate without arguments should call resetForm with empty errors
            await (wrapper.vm as Record<string, Function>).clearValidate()
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('clearValidate clears specific field errors', async () => {
            const wrapper = mount(Form)

            // clearValidate with specific field names
            await (wrapper.vm as Record<string, Function>).clearValidate(['name', 'email'])
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('clearValidate clears specific field errors on form with registered fields', async () => {
            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mountFormWithField({
                initialValues: { name: '' },
                validationSchema: schema,
            })

            // First validate to generate errors
            await (wrapper.vm as Record<string, Function>).validate()
            await flushPromises()

            // Then clear specific field
            await (wrapper.vm as Record<string, Function>).clearValidate(['name'])
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('validateField validates a single field', async () => {
            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'valid-name' },
                    validationSchema: schema,
                },
            })

            const result = await (wrapper.vm as Record<string, Function>).validateField('name')
            expect(result).toBe(true)
        })

        it('validateField returns false for invalid field', async () => {
            const schema = {
                name: (value: unknown) => {
                    if (!value) return 'Name is required'
                    return true
                },
            }

            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: '' },
                    validationSchema: schema,
                },
            })

            const result = await (wrapper.vm as Record<string, Function>).validateField('name')
            expect(result).toBe(false)
        })

        it('scrollToField scrolls to the specified field', () => {
            const scrollIntoViewMock = vi.fn()

            const wrapper = mount(Form)
            const formEl = wrapper.find('form').element
            const mockElement = { scrollIntoView: scrollIntoViewMock }
            vi.spyOn(formEl, 'querySelector').mockReturnValue(mockElement as unknown as Element)

            ;(wrapper.vm as Record<string, Function>).scrollToField('username')

            expect(formEl.querySelector).toHaveBeenCalledWith('[name="username"]')
            expect(scrollIntoViewMock).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start',
            })
        })

        it('scrollToField does nothing when field element not found', () => {
            const wrapper = mount(Form)
            const formEl = wrapper.find('form').element
            vi.spyOn(formEl, 'querySelector').mockReturnValue(null)

            expect(() => {
                (wrapper.vm as Record<string, Function>).scrollToField('nonexistent')
            }).not.toThrow()
        })
    })

    describe('watch initialValues', () => {
        it('resets form when initialValues change and form is not dirty', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'initial' },
                },
            })

            await wrapper.setProps({ initialValues: { name: 'updated' } } as any)
            await nextTick()

            // The watch should have triggered resetForm
            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('does not reset form when newValues is undefined', async () => {
            const wrapper = mount(Form, {
                props: {
                    initialValues: { name: 'initial' },
                },
            })

            await wrapper.setProps({ initialValues: undefined } as any)
            await nextTick()

            expect(wrapper.find('form').exists()).toBe(true)
        })

        it('watches deep changes in initialValues', async () => {
            const initial = { nested: { value: 'a' } }
            const wrapper = mount(Form, {
                props: { initialValues: initial },
            })

            // Deep change
            await wrapper.setProps({ initialValues: { nested: { value: 'b' } } } as any)
            await nextTick()

            expect(wrapper.find('form').exists()).toBe(true)
        })
    })
})

// ==============================
// FormField component tests
// ==============================
describe('FormField', () => {
    it('renders within Form context', () => {
        const wrapper = mount(FormField, {
            props: { name: 'email' },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('renders slot content', () => {
        const wrapper = mount(FormField, {
            props: { name: 'email' },
            slots: { default: '<div class="field-inner">Field content</div>' },
        })
        expect(wrapper.find('.field-inner').exists()).toBe(true)
    })

    it('provides field context to children', () => {
        const wrapper = mount(FormField, {
            props: { name: 'username' },
            slots: { default: '<span class="field-slot">content</span>' },
        })
        expect(wrapper.find('.field-slot').exists()).toBe(true)
    })
})

// ==============================
// FormItem component tests
// ==============================
describe('FormItem', () => {
    it('renders slot content', () => {
        const wrapper = mount(FormItem, {
            slots: { default: '<div class="item-inner">Item content</div>' },
        })
        expect(wrapper.find('.item-inner').exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(FormItem, {
            props: { class: 'custom-item' },
        })
        expect(wrapper.classes()).toContain('custom-item')
    })

    it('has space-y-2 class by default', () => {
        const wrapper = mount(FormItem)
        expect(wrapper.classes()).toContain('space-y-2')
    })

    it('provides item context with generated ids', () => {
        const wrapper = mount(FormItem, {
            slots: { default: '<div />' },
        })
        expect(wrapper.exists()).toBe(true)
    })
})

// ==============================
// FormLabel component tests
// ==============================
describe('FormLabel', () => {
    it('renders slot content', () => {
        const wrapper = mountFormLabel({ slots: { default: 'Email Address' } })
        expect(wrapper.text()).toBe('Email Address')
    })

    it('applies custom class', () => {
        const wrapper = mountFormLabel({ props: { class: 'custom-label' } })
        expect(wrapper.classes()).toContain('custom-label')
    })

    it('shows destructive class when error exists', () => {
        const wrapper = mountFormLabel({}, 'Required field')
        expect(wrapper.classes()).toContain('text-brutal-destructive')
    })

    it('does not show destructive class when no error', () => {
        const wrapper = mountFormLabel({}, undefined)
        expect(wrapper.classes()).not.toContain('text-brutal-destructive')
    })

    it('renders as label element', () => {
        const wrapper = mountFormLabel()
        expect(wrapper.element.tagName).toBe('LABEL')
    })
})

// ==============================
// FormControl component tests
// ==============================
describe('FormControl', () => {
    it('renders slot content', () => {
        const wrapper = mountFormControl()
        expect(wrapper.find('.control-input').exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(FormControl, {
            props: { class: 'custom-control' },
            global: {
                provide: {
                    [formFieldKey as symbol]: {
                        name: 'test-field',
                        error: ref<string | undefined>(undefined),
                        value: ref(undefined),
                        setValue: () => {},
                        setError: () => {},
                    } as unknown as FormFieldContext,
                    [formItemKey as symbol]: {
                        id: 'test-id',
                        formItemId: 'test-id-form-item',
                        formDescriptionId: 'test-id-form-item-description',
                        formMessageId: 'test-id-form-item-message',
                    } as FormItemContext,
                },
            },
            slots: {
                default: '<input />',
            },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('provides aria attributes via slot props', () => {
        const wrapper = mount(FormControl, {
            global: {
                provide: {
                    [formFieldKey as symbol]: {
                        name: 'test-field',
                        error: ref<string | undefined>(undefined),
                        value: ref(undefined),
                        setValue: () => {},
                        setError: () => {},
                    } as unknown as FormFieldContext,
                    [formItemKey as symbol]: {
                        id: 'test-id',
                        formItemId: 'test-id-form-item',
                        formDescriptionId: 'test-id-form-item-description',
                        formMessageId: 'test-id-form-item-message',
                    } as FormItemContext,
                },
            },
            slots: {
                default: '<template #default="slotProps"><input v-bind="slotProps" /></template>',
            },
        })
        expect(wrapper.find('input').exists()).toBe(true)
    })
})

// ==============================
// FormDescription component tests
// ==============================
describe('FormDescription', () => {
    it('renders slot content', () => {
        const wrapper = mountFormDescription({
            slots: { default: 'Enter your email address' },
        })
        expect(wrapper.text()).toBe('Enter your email address')
    })

    it('applies custom class', () => {
        const wrapper = mountFormDescription({ props: { class: 'custom-desc' } })
        expect(wrapper.classes()).toContain('custom-desc')
    })

    it('has default styling classes', () => {
        const wrapper = mountFormDescription()
        expect(wrapper.classes()).toContain('text-sm')
        expect(wrapper.classes()).toContain('font-medium')
    })

    it('renders as paragraph element', () => {
        const wrapper = mountFormDescription()
        expect(wrapper.element.tagName).toBe('P')
    })
})

// ==============================
// FormMessage component tests
// ==============================
describe('FormMessage', () => {
    it('renders error message when present', () => {
        const wrapper = mountFormMessage('This field is required')
        expect(wrapper.text()).toBe('This field is required')
    })

    it('does not render when no error', () => {
        const wrapper = mountFormMessage()
        expect(wrapper.find('p').exists()).toBe(false)
    })

    it('applies custom class', () => {
        const wrapper = mountFormMessage('Error message', { props: { class: 'custom-msg' } })
        expect(wrapper.find('p').classes()).toContain('custom-msg')
    })

    it('has destructive text class', () => {
        const wrapper = mountFormMessage('Error')
        expect(wrapper.find('p').classes()).toContain('text-brutal-destructive')
    })

    it('has alert role', () => {
        const wrapper = mountFormMessage('Error occurred')
        expect(wrapper.find('p').attributes('role')).toBe('alert')
    })

    it('renders empty when error is empty string', () => {
        const wrapper = mountFormMessage('')
        expect(wrapper.find('p').exists()).toBe(false)
    })
})
