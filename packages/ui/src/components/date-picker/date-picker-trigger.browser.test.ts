import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref, type Component } from 'vue'
import { mount } from '@/test/browser-mount'
import '../../../dist/styles.css'
import DatePicker from './DatePicker.vue'
import DateTimePicker from './DateTimePicker.vue'
import DatePickerRange from './DatePickerRange.vue'
import MonthPicker from './MonthPicker.vue'
import WeekPicker from './WeekPicker.vue'
import YearPicker from './YearPicker.vue'

declare module 'vitest/browser' {
    interface BrowserCommands {
        pressPrimaryPointer: () => Promise<void>
        releasePrimaryPointer: () => Promise<void>
    }
}

const SIZES = ['sm', 'default', 'lg'] as const
const VALUE = new Date(2026, 10, 5, 13, 42)
const RANGE_VALUE = [VALUE, new Date(2026, 10, 9, 13, 42)] as const
const HOST_STYLE = { margin: '3rem', width: '20rem' }
const POINTER_REST_STYLE = { position: 'fixed', left: '0', top: '0', width: '1rem', height: '1rem' }
const PICKERS: { name: string; component: Component }[] = [
    { name: 'DatePicker', component: DatePicker },
    { name: 'DateTimePicker', component: DateTimePicker },
    { name: 'DatePickerRange', component: DatePickerRange },
    { name: 'MonthPicker', component: MonthPicker },
    { name: 'WeekPicker', component: WeekPicker },
    { name: 'YearPicker', component: YearPicker },
]
const CLEAR_PICKERS: { name: string; component: Component; hasHiddenInput: boolean }[] = [
    { name: 'DatePicker', component: DatePicker, hasHiddenInput: true },
    { name: 'DateTimePicker', component: DateTimePicker, hasHiddenInput: true },
    { name: 'DatePickerRange', component: DatePickerRange, hasHiddenInput: false },
    { name: 'MonthPicker', component: MonthPicker, hasHiddenInput: true },
    { name: 'WeekPicker', component: WeekPicker, hasHiddenInput: true },
    { name: 'YearPicker', component: YearPicker, hasHiddenInput: true },
]

let wrapper: ReturnType<typeof mount> | undefined

function mountPicker(component: Component, props: Record<string, unknown> = {}) {
    wrapper = mount(defineComponent({
        setup: () => () => h('div', { style: HOST_STYLE }, [
            h('div', { 'data-pointer-rest': '', style: POINTER_REST_STYLE }),
            h(component, {
                modelValue: component === DatePickerRange ? RANGE_VALUE : VALUE,
                clearable: true,
                ...props,
            }),
        ]),
    }))
    return wrapper.element
}

function mountControlledPicker(component: Component, props: Record<string, unknown> = {}) {
    const modelValue = ref<unknown>(component === DatePickerRange ? RANGE_VALUE : VALUE)
    const emitted = {
        updates: [] as unknown[],
        changes: [] as unknown[],
        opens: [] as unknown[],
        closes: [] as unknown[],
    }

    wrapper = mount(defineComponent({
        setup: () => () => h('form', { 'data-picker-form': '' }, [
            h(component, {
                clearable: true,
                name: 'selected-date',
                ...props,
                modelValue: modelValue.value,
                'onUpdate:modelValue': (value: unknown) => {
                    emitted.updates.push(value)
                    modelValue.value = value
                },
                onChange: (value: unknown) => emitted.changes.push(value),
                onOpen: () => emitted.opens.push(undefined),
                onClose: () => emitted.closes.push(undefined),
            }),
        ]),
    }))

    return { root: wrapper.element, emitted }
}

async function settleMovement() {
    await Promise.all(wrapper!.element.getAnimations({ subtree: true })
        .map(animation => animation.finished.catch(() => undefined)))
}

function getControls(root: Element) {
    return {
        trigger: root.querySelector<HTMLElement>('[role="combobox"]')!,
        clear: root.querySelector<HTMLButtonElement>('button[aria-label="清除"], button[aria-label="Clear"]'),
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

describe('DatePickerRange readonly keyboard behavior', () => {
    it('allows forward and backward Tab navigation while keeping Enter and Space inactive', async () => {
        wrapper = mount(defineComponent({
            setup: () => () => h('div', [
                h('button', { 'data-before': '' }, 'Before'),
                h(DatePickerRange, { readonly: true }),
                h('button', { 'data-after': '' }, 'After'),
            ]),
        }))

        const root = wrapper.element
        const before = root.querySelector<HTMLButtonElement>('[data-before]')!
        const trigger = root.querySelector<HTMLButtonElement>('[role="combobox"]')!
        const after = root.querySelector<HTMLButtonElement>('[data-after]')!

        await userEvent.tab()
        expect(document.activeElement).toBe(before)
        await userEvent.tab()
        expect(document.activeElement).toBe(trigger)
        await userEvent.tab()
        expect(document.activeElement).toBe(after)

        await userEvent.tab({ shift: true })
        expect(document.activeElement).toBe(trigger)
        await userEvent.keyboard('{Enter}')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        await userEvent.keyboard('{Space}')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')

        await userEvent.tab({ shift: true })
        expect(document.activeElement).toBe(before)
    })
})

describe.each(CLEAR_PICKERS)('$name clear action focus', ({ component, hasHiddenInput }) => {
    it('returns focus to the trigger after controlled keyboard clearing', async () => {
        const { root, emitted } = mountControlledPicker(component)
        const { trigger, clear } = getControls(root)
        expect(clear).not.toBeNull()
        expect(clear!.classList.contains('focus-visible:ring-2')).toBe(true)

        await userEvent.tab()
        expect(document.activeElement).toBe(trigger)
        await userEvent.tab()
        expect(document.activeElement).toBe(clear)
        if (hasHiddenInput) {
            expect(new FormData(root as HTMLFormElement).get('selected-date')).not.toBe('')
        }

        await userEvent.keyboard('{Enter}')
        await nextTick()

        expect(root.querySelector('button[aria-label="清除"], button[aria-label="Clear"]')).toBeNull()
        expect(document.activeElement).toBe(trigger)
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(emitted.updates).toEqual([null])
        expect(emitted.changes).toEqual([null])
        expect(emitted.opens).toHaveLength(0)
        expect(emitted.closes).toHaveLength(0)
        if (hasHiddenInput) {
            expect(new FormData(root as HTMLFormElement).get('selected-date')).toBe('')
        }
    })

    it.each([
        { name: 'disabled', props: { disabled: true } },
        { name: 'readonly', props: { readonly: true } },
    ])('keeps a $name value out of the clear path', async ({ props }) => {
        const { root, emitted } = mountControlledPicker(component, props)
        const { clear, trigger } = getControls(root)
        expect(clear).toBeNull()
        if (trigger) {
            if (!('disabled' in props)) trigger.focus()
            if (hasHiddenInput) {
                const fieldValue = new FormData(root as HTMLFormElement).get('selected-date')
                expect(fieldValue === null).toBe('disabled' in props)
                if ('readonly' in props) expect(fieldValue).not.toBe('')
            }
            if (!('disabled' in props)) {
                await userEvent.keyboard('{Enter}')
                await userEvent.keyboard('{Space}')
            }
            expect(trigger.getAttribute('aria-expanded')).toBe('false')
        }
        expect(emitted.updates).toHaveLength(0)
        expect(emitted.changes).toHaveLength(0)
    })
})
