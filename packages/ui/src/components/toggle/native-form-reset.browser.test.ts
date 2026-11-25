import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { h, nextTick, reactive } from 'vue'
import { mount } from '@/test/browser-mount'
import Checkbox from '../checkbox/Checkbox.vue'
import NumberInput from '../number-input/NumberInput.vue'
import Switch from '../switch/Switch.vue'
import ToggleGroup from '../toggle-group/ToggleGroup.vue'
import ToggleGroupItem from '../toggle-group/ToggleGroupItem.vue'
import Toggle from './Toggle.vue'

function buttons(root: Element) {
    return [...root.querySelectorAll<HTMLButtonElement>('[role="switch"], [role="checkbox"], button[aria-pressed]')]
}

function increment(input: HTMLInputElement) {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
}

function fieldValues(form: HTMLFormElement) {
    return Object.fromEntries(new FormData(form))
}

function groupItems() {
    return ['bold', 'italic', 'underline'].map(value => h(ToggleGroupItem, { value }, () => value))
}

describe('原生表单重置', () => {
    it('同步恢复提交值、字段数量与必填校验，Vue 更新后恢复可见状态', async () => {
        const changed = vi.fn()
        const wrapper = mount({ render: () => h('form', [
            h(Switch, { name: 'switch', value: 'enabled', defaultValue: true, required: true, 'onUpdate:modelValue': changed }),
            h(Toggle, { name: 'toggle', defaultValue: true, required: true, 'onUpdate:modelValue': changed }),
            h(Checkbox, { name: 'checkbox', value: 'accepted', defaultValue: true, required: true, 'onUpdate:checked': changed }),
            h(Checkbox, { name: 'mixed', value: 'partial', defaultValue: 'indeterminate', 'onUpdate:checked': changed }),
            h(ToggleGroup, { name: 'single', defaultValue: 'bold', required: true, 'onUpdate:modelValue': changed }, groupItems),
            h(ToggleGroup, { name: 'multi', type: 'multiple', defaultValue: ['bold', 'italic'], required: true, 'onUpdate:modelValue': changed }, groupItems),
            h(NumberInput, { name: 'quantity', defaultValue: 1500, locale: 'de-DE', required: true, 'onUpdate:modelValue': changed }),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const [switchButton, toggleButton, checkbox, mixed, single, , , multiFirst, multiSecond, multiThird] = buttons(form)
            const input = form.querySelector<HTMLInputElement>('[role="spinbutton"]')!
            const original = {
                switch: 'enabled',
                toggle: 'true',
                checkbox: 'accepted',
                mixed: 'partial',
                single: 'bold',
                'multi[0]': 'bold',
                'multi[1]': 'italic',
                quantity: '1500',
            }
            expect(fieldValues(form)).toEqual(original)
            expect(form.checkValidity()).toBe(true)

            for (const button of [switchButton, toggleButton, checkbox, mixed, single, multiFirst, multiSecond, multiThird]) {
                button!.click()
                await nextTick()
            }
            increment(input)
            await nextTick()
            expect(fieldValues(form)).toEqual({ mixed: 'partial', single: '', 'multi[0]': 'underline', quantity: '1501' })
            expect(form.checkValidity()).toBe(false)
            const calls = changed.mock.calls.length
            const nativeChange = vi.fn()
            form.addEventListener('input', nativeChange)
            form.addEventListener('change', nativeChange)

            form.reset()
            expect(fieldValues(form)).toEqual(original)
            expect(form.checkValidity()).toBe(true)
            expect(input.value).toBe('1.500')
            form.addEventListener('reset', event => event.preventDefault(), { once: true })
            form.reset()
            await nextTick()

            expect(switchButton!.getAttribute('aria-checked')).toBe('true')
            expect(toggleButton!.getAttribute('aria-pressed')).toBe('true')
            expect(checkbox!.getAttribute('aria-checked')).toBe('true')
            expect(mixed!.getAttribute('aria-checked')).toBe('mixed')
            expect(single!.getAttribute('aria-pressed')).toBe('true')
            expect(multiFirst!.getAttribute('aria-pressed')).toBe('true')
            expect(multiSecond!.getAttribute('aria-pressed')).toBe('true')
            expect(multiThird!.getAttribute('aria-pressed')).toBe('false')
            expect(input.getAttribute('aria-valuenow')).toBe('1500')
            expect(fieldValues(form)).toEqual(original)
            expect(changed).toHaveBeenCalledTimes(calls)
            expect(nativeChange).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })

    it('识别外置表单并遵守 reset 按钮的取消结果', async () => {
        const state = reactive({ show: true })
        const wrapper = mount({ render: () => h('div', [
            h('form', { id: 'reset-owner' }, [h('button', { type: 'reset' }, '重置外置字段')]),
            h('form', { id: 'reset-other' }, state.show ? [
                h(Switch, { form: 'reset-owner', name: 'external', defaultValue: true, required: true }),
                h(NumberInput, { form: 'reset-owner', name: 'quantity', defaultValue: 1 }),
                h(ToggleGroup, { form: 'reset-owner', name: 'group', defaultValue: 'bold' }, groupItems),
            ] : []),
        ]) })
        try {
            const root = wrapper.element
            const owner = root.querySelector<HTMLFormElement>('#reset-owner')!
            const other = root.querySelector<HTMLFormElement>('#reset-other')!
            const [toggle, group] = buttons(root)
            const input = root.querySelector<HTMLInputElement>('[role="spinbutton"]')!
            toggle!.click()
            group!.click()
            increment(input)
            await nextTick()
            expect(fieldValues(owner)).toEqual({ quantity: '2', group: '' })

            other.reset()
            await nextTick()
            expect(fieldValues(owner)).toEqual({ quantity: '2', group: '' })
            expect(toggle!.getAttribute('aria-checked')).toBe('false')

            owner.addEventListener('reset', event => event.preventDefault(), { once: true })
            await page.getByRole('button', { name: '重置外置字段' }).click()
            await nextTick()
            expect(fieldValues(owner)).toEqual({ quantity: '2', group: '' })
            expect(owner.checkValidity()).toBe(false)

            await page.getByRole('button', { name: '重置外置字段' }).click()
            await expect.poll(() => toggle!.getAttribute('aria-checked')).toBe('true')
            expect(group!.getAttribute('aria-pressed')).toBe('true')
            expect(fieldValues(owner)).toEqual({ external: 'on', quantity: '1', group: 'bold' })
            expect(owner.checkValidity()).toBe(true)

            state.show = false
            await nextTick()
            owner.reset()
            expect(fieldValues(owner)).toEqual({})
        } finally {
            wrapper.unmount()
        }
    })

    it('多选组只对仍在提交的同名字段值变化发出一组原生事件', async () => {
        const wrapper = mount({ render: () => h('form', [
            h(ToggleGroup, { name: 'multi', type: 'multiple', defaultValue: [] }, groupItems),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const events: [string, string, string][] = []
            for (const type of ['input', 'change']) {
                form.addEventListener(type, event => {
                    const target = event.target as HTMLInputElement
                    events.push([event.type, target.name, target.value])
                })
            }
            const [bold, italic] = buttons(form)
            bold!.click()
            await nextTick()
            italic!.click()
            await nextTick()
            expect(events).toEqual([])

            bold!.click()
            await nextTick()
            expect(fieldValues(form)).toEqual({ 'multi[0]': 'italic' })
            expect(events).toEqual([['input', 'multi[0]', 'italic'], ['change', 'multi[0]', 'italic']])

            form.reset()
            expect(fieldValues(form)).toEqual({})
            await nextTick()
            expect(events).toHaveLength(2)
        } finally {
            wrapper.unmount()
        }
    })

    it('表单字段事件只随实际所属表单的字段变化冒泡', async () => {
        const wrapper = mount({ render: () => h('div', [
            h('form', { id: 'event-owner' }),
            h('div', { id: 'unassociated' }, [
                h(Checkbox, { name: 'checkbox' }),
                h(Switch, { name: 'switch' }),
                h(NumberInput, { name: 'number', defaultValue: 1, focusOnChange: false }),
            ]),
            h('div', { id: 'associated' }, [
                h(Checkbox, { name: 'checkbox', form: 'event-owner' }),
                h(Switch, { name: 'switch', form: 'event-owner' }),
                h(NumberInput, { name: 'number', form: 'event-owner', defaultValue: 1, focusOnChange: false }),
            ]),
        ]) })
        try {
            const root = wrapper.element
            const standalone = root.querySelector('#unassociated')!
            const external = root.querySelector('#associated')!
            const owner = root.querySelector<HTMLFormElement>('#event-owner')!
            const standaloneEvents = vi.fn()
            const externalEvents: [string, string][] = []
            for (const type of ['input', 'change']) {
                standalone.addEventListener(type, standaloneEvents)
                external.addEventListener(type, event => {
                    const target = event.target as HTMLInputElement
                    expect(target.form).toBe(owner)
                    externalEvents.push([type, target.name])
                })
            }
            for (const container of [standalone, external]) {
                for (const button of buttons(container)) button.click()
                increment(container.querySelector<HTMLInputElement>('[role="spinbutton"]')!)
                await nextTick()
            }

            expect(standaloneEvents).not.toHaveBeenCalled()
            expect(externalEvents).toEqual([
                ['input', 'checkbox'], ['change', 'checkbox'],
                ['input', 'switch'], ['change', 'switch'],
                ['input', 'number'], ['change', 'number'],
            ])
            expect(fieldValues(owner)).toEqual({ checkbox: 'on', switch: 'on', number: '2' })
        } finally {
            wrapper.unmount()
        }
    })

    it('Checkbox 的 null 使用原生默认提交值，空字符串仍原样提交', async () => {
        const wrapper = mount({ render: () => h('form', [
            h(Checkbox, { name: 'null', value: null, defaultValue: true }),
            h(Checkbox, { name: 'empty', value: '', defaultValue: true }),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const values = { null: 'on', empty: '' }
            expect(fieldValues(form)).toEqual(values)
            for (const button of buttons(form)) button.click()
            await nextTick()
            expect(fieldValues(form)).toEqual({})
            form.reset()
            expect(fieldValues(form)).toEqual(values)
            await nextTick()
            expect(fieldValues(form)).toEqual(values)
        } finally {
            wrapper.unmount()
        }
    })

    it('保留父组件控制的值，并清除数值框尚未提交的编辑文本', async () => {
        const changed = vi.fn()
        const state = reactive({ active: false, number: 870, placeholder: '数量' })
        const wrapper = mount({ render: () => h('form', [
            h(Toggle, { name: 'toggle', modelValue: state.active, defaultValue: false, 'onUpdate:modelValue': changed }),
            h(Switch, { name: 'switch', modelValue: state.active, defaultValue: false, 'onUpdate:modelValue': changed }),
            h(Checkbox, { name: 'checkbox', checked: state.active, 'onUpdate:checked': changed }),
            h(ToggleGroup, { name: 'group', type: 'multiple', defaultValue: [], modelValue: state.active ? ['italic'] : [], 'onUpdate:modelValue': changed }, groupItems),
            h(NumberInput, {
                name: 'quantity', modelValue: state.number, defaultValue: 1, locale: 'en-US',
                placeholder: state.placeholder, 'onUpdate:modelValue': changed,
            }),
        ]) })
        try {
            const form = wrapper.element as HTMLFormElement
            const input = form.querySelector<HTMLInputElement>('[role="spinbutton"]')!
            state.active = true
            state.number = 1450
            await nextTick()
            await page.getByRole('spinbutton').fill('45')
            await nextTick()
            expect(input.value).toBe('45')
            expect(document.activeElement).toBe(input)

            form.reset()
            expect(fieldValues(form)).toEqual({ toggle: 'true', switch: 'on', checkbox: 'on', 'group[0]': 'italic', quantity: '1450' })
            expect(input.value).toBe('1,450')
            await nextTick()
            state.placeholder = '新数量'
            await nextTick()
            expect(input.value).toBe('1,450')
            expect(document.activeElement).toBe(input)

            await page.getByRole('spinbutton').fill('87')
            state.placeholder = '采购数量'
            await nextTick()
            expect(input.value).toBe('87')
            expect(new FormData(form).get('quantity')).toBe('1450')
            expect(changed).not.toHaveBeenCalled()
        } finally {
            wrapper.unmount()
        }
    })
})
