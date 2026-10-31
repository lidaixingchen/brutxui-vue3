import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import ColorPicker from './ColorPicker.vue'

const SIZES = ['sm', 'default', 'lg'] as const
const SELECTED_COLOR = '#EF476F'
const HOST_STYLE = { margin: '3rem', width: '20rem' }
const POINTER_REST_STYLE = { position: 'fixed', left: '0', top: '0', width: '1rem', height: '1rem' }
let wrapper: ReturnType<typeof mount> | null = null

async function settleMovement(element: Element) {
    await Promise.all(element.getAnimations({ subtree: true })
        .map(animation => animation.finished))
}

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

describe('ColorPicker trigger movement', () => {
    it.each(SIZES)('keeps the clear action aligned while hovering the %s trigger', async size => {
        wrapper = mount(defineComponent({
            setup: () => () => h('div', { style: HOST_STYLE }, [
                h('div', { 'data-pointer-rest': '', style: POINTER_REST_STYLE }),
                h(ColorPicker, { modelValue: SELECTED_COLOR, clearable: true, size }),
            ]),
        }))
        const trigger = wrapper.element.querySelector<HTMLElement>('[role="combobox"]')!
        const clear = wrapper.element.querySelector<HTMLButtonElement>('button[aria-label="清除"]')!
        const pointerRest = wrapper.element.querySelector<HTMLElement>('[data-pointer-rest]')!
        await document.fonts.ready
        await userEvent.hover(pointerRest)
        await settleMovement(wrapper.element)
        const initialTrigger = trigger.getBoundingClientRect()
        const initialClear = clear.getBoundingClientRect()

        await userEvent.hover(trigger)
        await settleMovement(wrapper.element)
        const hoveredTrigger = trigger.getBoundingClientRect()
        const hoveredClear = clear.getBoundingClientRect()

        expect(hoveredTrigger.x).toBeLessThan(initialTrigger.x)
        expect(hoveredClear.x - hoveredTrigger.x).toBeCloseTo(initialClear.x - initialTrigger.x)
        expect(hoveredClear.y - hoveredTrigger.y).toBeCloseTo(initialClear.y - initialTrigger.y)
    })
})
