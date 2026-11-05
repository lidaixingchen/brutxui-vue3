import { describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { type Component } from 'vue'
import { mount } from '@/test/browser-mount'
import ColorPicker from '../color-picker/ColorPicker.vue'
import DatePicker from '../date-picker/DatePicker.vue'
import DateTimePicker from '../date-picker/DateTimePicker.vue'

const PICKERS: ReadonlyArray<readonly [string, Component]> = [
    ['ColorPicker', ColorPicker], ['DatePicker', DatePicker], ['DateTimePicker', DateTimePicker],
]

describe.each(PICKERS)('%s 原生弹层名称引用', (_name, component) => {
    it.each([undefined, 'custom-picker'])('使用 ID %s 时关联到实际触发器', async (id) => {
        const wrapper = mount(component, { props: { id } })
        try {
            const trigger = wrapper.element.querySelector<HTMLButtonElement>('[role="combobox"]')!
            expect(trigger.id).not.toBe('')
            await userEvent.click(trigger)
            await expect.poll(() => document.body.querySelector('[role="dialog"]')?.getAttribute('aria-labelledby')).toBe(trigger.id)
            expect(document.getElementById(trigger.id)).toBe(trigger)
        } finally {
            wrapper.unmount()
        }
    })
})
