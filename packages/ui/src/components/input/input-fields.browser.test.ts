import { describe, expect, it } from 'vitest'
import { h, nextTick, reactive, type Component } from 'vue'
import { computeAccessibleName } from 'dom-accessibility-api'
import { mount } from '@/test/browser-mount'
import Input from './Input.vue'
import Textarea from '../textarea/Textarea.vue'
import HardcoreInput from '../hardcore-input/HardcoreInput.vue'

const FIELDS: ReadonlyArray<readonly [string, Component]> = [
    ['Input', Input],
    ['Textarea', Textarea],
    ['HardcoreInput', HardcoreInput],
]

describe.each(FIELDS)('%s 原生表单契约', (_name, component) => {
    it('关联可见名称、必填校验和实际提交值，并排除禁用字段', async () => {
        const state = reactive({ value: '', disabled: false })
        const wrapper = mount({
            render: () => h('form', [
                h('label', { for: 'native-field' }, '联系信息'),
                h(component, {
                    id: 'native-field', name: 'contact', required: true,
                    modelValue: state.value, disabled: state.disabled,
                    ...(component === HardcoreInput ? { sound: false } : {}),
                    'onUpdate:modelValue': (value: string | number) => { state.value = String(value) },
                }),
            ]),
        })
        try {
            const form = wrapper.element as HTMLFormElement
            const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>('#native-field')!
            expect(computeAccessibleName(field)).toBe('联系信息')
            expect(form.checkValidity()).toBe(false)

            field.value = '已填写'
            field.dispatchEvent(new Event('input', { bubbles: true }))
            await nextTick()
            expect(form.checkValidity()).toBe(true)
            expect(new FormData(form).get('contact')).toBe('已填写')

            state.disabled = true
            await nextTick()
            expect(new FormData(form).has('contact')).toBe(false)
            expect(form.checkValidity()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })
})
