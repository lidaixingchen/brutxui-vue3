import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Form from './Form.vue'
import FormControl from './FormControl.vue'
import FormField from './FormField.vue'
import FormItem from './FormItem.vue'
import FormMessage from './FormMessage.vue'
import Input from '../input/Input.vue'

function mountField(initialValue: string, validationSchema?: Record<string, (value: unknown) => true | string>) {
    return mount(Form, {
        props: {
            initialValues: { username: initialValue },
            validationSchema,
        },
        slots: {
            default: {
                components: { FormField, FormControl, FormItem, FormMessage, Input },
                template: `
                    <FormField name="username" v-slot="{ componentField }">
                        <FormItem>
                            <FormControl>
                                <Input v-bind="componentField" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                `,
            } as any,
        },
    })
}

describe('FormField componentField', () => {
    it('binds the initial form value to the component input', () => {
        const wrapper = mountField('seed')

        expect((wrapper.get('input').element as HTMLInputElement).value).toBe('seed')
    })

    it('submits edited component input values', async () => {
        const wrapper = mountField('seed')
        const input = wrapper.findComponent(Input)
        await wrapper.get('input').setValue('edited')
        expect(input.emitted('update:modelValue')).toEqual([['edited']])
        expect(input.props('modelValue')).toBe('edited')
        await wrapper.get('form').trigger('submit')
        await flushPromises()

        expect(wrapper.emitted('submit')?.[0]).toEqual([{ username: 'edited' }])
    })

    it('validates the field on focus leaving the component input', async () => {
        const validator = vi.fn((value: unknown) => value ? true : 'Username is required')
        const wrapper = mountField('', { username: validator })
        expect(wrapper.text()).not.toContain('Username is required')
        validator.mockClear()

        await wrapper.get('input').trigger('focusout')
        await vi.waitFor(() => expect(wrapper.text()).toContain('Username is required'))

        expect(validator).toHaveBeenCalled()
    })
})
