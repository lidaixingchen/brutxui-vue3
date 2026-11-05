import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, type Component } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import DatePicker from './DatePicker.vue'
import DateTimePicker from './DateTimePicker.vue'

declare module 'vitest/browser' {
    interface BrowserCommands {
        pressPrimaryPointer: () => Promise<void>
        releasePrimaryPointer: () => Promise<void>
    }
}

const SIZES = ['sm', 'default', 'lg'] as const
const VALUE = new Date(2026, 10, 5, 13, 42)
const HOST_STYLE = { margin: '3rem', width: '20rem' }
const POINTER_REST_STYLE = { position: 'fixed', left: '0', top: '0', width: '1rem', height: '1rem' }
const PICKERS: { name: string; component: Component }[] = [
    { name: 'DatePicker', component: DatePicker },
    { name: 'DateTimePicker', component: DateTimePicker },
]

let wrapper: ReturnType<typeof mount> | undefined

function mountPicker(component: Component, props: Record<string, unknown> = {}) {
    wrapper = mount(defineComponent({
        setup: () => () => h('div', { style: HOST_STYLE }, [
            h('div', { 'data-pointer-rest': '', style: POINTER_REST_STYLE }),
            h(component, { modelValue: VALUE, clearable: true, ...props }),
        ]),
    }))
    return wrapper.element
}

async function settleMovement() {
    await Promise.all(wrapper!.element.getAnimations({ subtree: true })
        .map(animation => animation.finished))
}

function getControls(root: Element) {
    return {
        trigger: root.querySelector<HTMLElement>('[role="combobox"]')!,
        clear: root.querySelector<HTMLButtonElement>('button[aria-label="清除"]'),
        pointerRest: root.querySelector<HTMLElement>('[data-pointer-rest]')!,
    }
}

afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
})

describe.each(PICKERS)('$name trigger movement', ({ component }) => {
    it.each(SIZES)('keeps the clear action aligned during %s hover motion', async size => {
        const root = mountPicker(component, { size })
        const { trigger, clear, pointerRest } = getControls(root)
        expect(clear).not.toBeNull()
        await userEvent.hover(pointerRest)
        await settleMovement()
        const triggerBefore = trigger.getBoundingClientRect()
        const clearBefore = clear!.getBoundingClientRect()

        await userEvent.hover(trigger)
        await settleMovement()
        const triggerAfter = trigger.getBoundingClientRect()
        const clearAfter = clear!.getBoundingClientRect()

        expect(clearAfter.x - triggerAfter.x).toBeCloseTo(clearBefore.x - triggerBefore.x)
        expect(clearAfter.y - triggerAfter.y).toBeCloseTo(clearBefore.y - triggerBefore.y)
    })

    it.each(SIZES)('keeps the clear action aligned during %s press motion', async size => {
        const root = mountPicker(component, { size })
        const { trigger, clear, pointerRest } = getControls(root)
        expect(clear).not.toBeNull()
        await userEvent.hover(pointerRest)
        await settleMovement()
        await userEvent.hover(trigger)
        await settleMovement()
        const triggerBefore = trigger.getBoundingClientRect()
        const clearBefore = clear!.getBoundingClientRect()

        await commands.pressPrimaryPointer()
        try {
            await settleMovement()
            expect(trigger.matches(':active')).toBe(true)
            const triggerAfter = trigger.getBoundingClientRect()
            const clearAfter = clear!.getBoundingClientRect()
            const triggerDelta = [triggerAfter.x - triggerBefore.x, triggerAfter.y - triggerBefore.y]
            const clearDelta = [clearAfter.x - clearBefore.x, clearAfter.y - clearBefore.y]

            expect(triggerDelta[0]).toBeGreaterThan(0)
            expect(triggerDelta[1]).toBeGreaterThan(0)
            expect(clearDelta[0]).toBeCloseTo(triggerDelta[0])
            expect(clearDelta[1]).toBeCloseTo(triggerDelta[1])
        } finally {
            await commands.releasePrimaryPointer()
        }
    })

    it('keeps the disabled trigger stationary and hides its clear action', async () => {
        const root = mountPicker(component, { disabled: true })
        const { trigger, clear, pointerRest } = getControls(root)
        const control = trigger.parentElement!
        expect((trigger as HTMLButtonElement).disabled).toBe(true)
        expect(clear).toBeNull()
        expect(getComputedStyle(control).pointerEvents).toBe('none')
        const controlBefore = control.getBoundingClientRect()
        const triggerBefore = trigger.getBoundingClientRect()
        await userEvent.hover(pointerRest)
        await settleMovement()
        const controlAfter = control.getBoundingClientRect()
        const triggerAfter = trigger.getBoundingClientRect()
        expect(controlAfter.x).toBe(controlBefore.x)
        expect(controlAfter.y).toBe(controlBefore.y)
        expect(triggerAfter.x).toBe(triggerBefore.x)
        expect(triggerAfter.y).toBe(triggerBefore.y)
    })
})
