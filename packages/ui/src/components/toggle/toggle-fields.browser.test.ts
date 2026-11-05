import { describe, expect, it } from 'vitest'
import { h, nextTick, reactive } from 'vue'
import { mount } from '@/test/browser-mount'
import Toggle from './Toggle.vue'
import ToggleGroup from '../toggle-group/ToggleGroup.vue'
import ToggleGroupItem from '../toggle-group/ToggleGroupItem.vue'

describe('Toggle 原生表单契约', () => {
    it('未命名的必填控件也参与原生校验', async () => {
        const wrapper = mount({ render: () => h('form', [h(Toggle, { required: true }, () => '加粗')]) })
        try {
            const form = wrapper.element as HTMLFormElement
            expect(form.checkValidity()).toBe(false)
            form.querySelector('button')!.click()
            await nextTick()
            expect(form.checkValidity()).toBe(true)
            expect(Array.from(new FormData(form).entries())).toEqual([])
        } finally {
            wrapper.unmount()
        }
    })

    it.each(['single', 'multiple'] as const)('未命名的 %s 必填组需要选择一项', async (type) => {
        const wrapper = mount({ render: () => h('form', [
            h(ToggleGroup, { type, required: true }, () => h(ToggleGroupItem, { value: 'bold' }, () => '加粗')),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            expect(form.checkValidity()).toBe(false)
            form.querySelector('button')!.click()
            await nextTick()
            expect(form.checkValidity()).toBe(true)
            expect(Array.from(new FormData(form).entries())).toEqual([])
        } finally {
            wrapper.unmount()
        }
    })

    it('按下时提交，关闭时触发必填校验，禁用时排除字段', async () => {
        const state = reactive({ disabled: false })
        const wrapper = mount({ render: () => h('form', [
            h(Toggle, { name: 'bold', defaultValue: true, required: true, disabled: state.disabled }, () => '加粗'),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const button = form.querySelector('button')!
            expect(new FormData(form).get('bold')).toBe('true')
            expect(form.checkValidity()).toBe(true)

            button.click()
            await nextTick()
            expect(new FormData(form).has('bold')).toBe(false)
            expect(form.checkValidity()).toBe(false)

            state.disabled = true
            await nextTick()
            expect(new FormData(form).has('bold')).toBe(false)
            expect(form.checkValidity()).toBe(true)
        } finally {
            wrapper.unmount()
        }
    })

    it.each(['single', 'multiple'] as const)('%s 组禁用时排除字段，恢复后提交所选值', async (type) => {
        const state = reactive({ disabled: false })
        const wrapper = mount({ render: () => h('form', [
            h(ToggleGroup, {
                type, name: 'format', defaultValue: type === 'single' ? 'bold' : ['bold', 'italic'],
                disabled: state.disabled,
            }, () => [
                h(ToggleGroupItem, { value: 'bold' }, () => '加粗'),
                h(ToggleGroupItem, { value: 'italic' }, () => '斜体'),
            ]),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const original = Array.from(new FormData(form).entries())
            expect(original.length).toBeGreaterThan(0)
            state.disabled = true
            await nextTick()
            expect(Array.from(new FormData(form).entries())).toEqual([])
            state.disabled = false
            await nextTick()
            expect(Array.from(new FormData(form).entries())).toEqual(original)
        } finally {
            wrapper.unmount()
        }
    })
})
