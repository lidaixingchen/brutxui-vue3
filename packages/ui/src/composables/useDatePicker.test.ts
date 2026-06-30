import { effectScope, nextTick, ref } from 'vue'
import { useDatePicker } from './useDatePicker'

describe('useDatePicker', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createDatePicker(options: Parameters<typeof useDatePicker>[0]) {
        return scope.run(() => useDatePicker(options))!
    }

    it('initializes with open=false', () => {
        const { open } = createDatePicker({ emit: () => {} })
        expect(open.value).toBe(false)
    })

    it('initializes displayValue from modelValue', () => {
        const date = new Date(2026, 5, 26)
        const { displayValue } = createDatePicker({
            modelValue: () => date,
            emit: () => {},
        })
        expect(displayValue.value).toEqual(date)
    })

    it('initializes displayValue as null when modelValue is null', () => {
        const { displayValue } = createDatePicker({
            modelValue: () => null,
            emit: () => {},
        })
        expect(displayValue.value).toBeNull()
    })

    it('formattedDisplay returns empty string when modelValue is null', () => {
        const { formattedDisplay } = createDatePicker({
            modelValue: () => null,
            emit: () => {},
        })
        expect(formattedDisplay.value).toBe('')
    })

    it('formattedDisplay formats date with default YYYY-MM-DD', () => {
        const { formattedDisplay } = createDatePicker({
            modelValue: () => new Date(2026, 0, 5),
            emit: () => {},
        })
        expect(formattedDisplay.value).toBe('2026-01-05')
    })

    it('formattedDisplay respects custom displayFormat', () => {
        const { formattedDisplay } = createDatePicker({
            modelValue: () => new Date(2026, 0, 5),
            displayFormat: () => 'YYYY/MM/DD',
            emit: () => {},
        })
        expect(formattedDisplay.value).toBe('2026/01/05')
    })

    it('setting open=true emits open event', async () => {
        const emitted: string[] = []
        const { open } = createDatePicker({
            emit: (event: string) => emitted.push(event),
        })
        open.value = true
        await nextTick()
        expect(emitted).toContain('open')
    })

    it('setting open=false emits close event', async () => {
        const emitted: string[] = []
        const { open } = createDatePicker({
            emit: (event: string) => emitted.push(event),
        })
        open.value = true
        await nextTick()
        open.value = false
        await nextTick()
        expect(emitted).toContain('close')
    })

    it('closing emits change when displayValue differs from modelValue', async () => {
        const emitted: Array<[string, unknown]> = []
        const modelValue = ref<Date | null>(new Date(2026, 0, 1))
        const { open, displayValue } = createDatePicker({
            modelValue,
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        displayValue.value = new Date(2026, 5, 26)
        open.value = true
        await nextTick()
        open.value = false
        await nextTick()
        const changeEvents = emitted.filter(([e]) => e === 'change')
        expect(changeEvents.length).toBe(1)
        expect(changeEvents[0][1]).toEqual(new Date(2026, 5, 26))
    })

    it('closing does not emit change when displayValue equals modelValue', async () => {
        const emitted: Array<[string, unknown]> = []
        const date = new Date(2026, 0, 1)
        const { open } = createDatePicker({
            modelValue: () => date,
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        open.value = true
        await nextTick()
        open.value = false
        await nextTick()
        const changeEvents = emitted.filter(([e]) => e === 'change')
        expect(changeEvents.length).toBe(0)
    })

    it('handlePanelUpdate updates displayValue and emits update:modelValue', () => {
        const emitted: Array<[string, unknown]> = []
        const { handlePanelUpdate, displayValue } = createDatePicker({
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        const date = new Date(2026, 5, 26)
        handlePanelUpdate(date)
        expect(displayValue.value).toEqual(date)
        expect(emitted).toContainEqual(['update:modelValue', date])
    })

    it('handlePanelConfirm updates value, emits update:modelValue and change, closes panel', () => {
        const emitted: Array<[string, unknown]> = []
        const { handlePanelConfirm, open, displayValue } = createDatePicker({
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        open.value = true
        const date = new Date(2026, 5, 26)
        handlePanelConfirm(date)
        expect(displayValue.value).toEqual(date)
        expect(open.value).toBe(false)
        expect(emitted).toContainEqual(['update:modelValue', date])
        expect(emitted).toContainEqual(['change', date])
    })

    it('handlePanelClear clears value and emits update:modelValue null and change null', () => {
        const emitted: Array<[string, unknown]> = []
        const { handlePanelClear, displayValue } = createDatePicker({
            modelValue: () => new Date(2026, 0, 1),
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        handlePanelClear()
        expect(displayValue.value).toBeNull()
        expect(emitted).toContainEqual(['update:modelValue', null])
        expect(emitted).toContainEqual(['change', null])
    })

    it('handleClearClick stops propagation and clears value', () => {
        const emitted: Array<[string, unknown]> = []
        const { handleClearClick, displayValue } = createDatePicker({
            modelValue: () => new Date(2026, 0, 1),
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        const event = new MouseEvent('click')
        vi.spyOn(event, 'stopPropagation')
        handleClearClick(event)
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(displayValue.value).toBeNull()
        expect(emitted).toContainEqual(['update:modelValue', null])
    })

    it('handleTriggerKeydown opens panel on Enter', () => {
        const { handleTriggerKeydown, open } = createDatePicker({
            emit: () => {},
        })
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        vi.spyOn(event, 'preventDefault')
        handleTriggerKeydown(event)
        expect(open.value).toBe(true)
    })

    it('handleTriggerKeydown opens panel on Space', () => {
        const { handleTriggerKeydown, open } = createDatePicker({
            emit: () => {},
        })
        const event = new KeyboardEvent('keydown', { key: ' ' })
        vi.spyOn(event, 'preventDefault')
        handleTriggerKeydown(event)
        expect(open.value).toBe(true)
    })

    it('handleTriggerKeydown does not open when disabled', () => {
        const { handleTriggerKeydown, open } = createDatePicker({
            disabled: () => true,
            emit: () => {},
        })
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        vi.spyOn(event, 'preventDefault')
        handleTriggerKeydown(event)
        expect(open.value).toBe(false)
    })

    it('handleTriggerKeydown does not open when readonly', () => {
        const { handleTriggerKeydown, open } = createDatePicker({
            readonly: () => true,
            emit: () => {},
        })
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        vi.spyOn(event, 'preventDefault')
        handleTriggerKeydown(event)
        expect(open.value).toBe(false)
    })

    it('handleTriggerKeydown does not open when already open', () => {
        const { handleTriggerKeydown, open } = createDatePicker({
            emit: () => {},
        })
        open.value = true
        const event = new KeyboardEvent('keydown', { key: 'Enter' })
        vi.spyOn(event, 'preventDefault')
        handleTriggerKeydown(event)
        expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('displayValue syncs when modelValue changes', async () => {
        const modelValue = ref<Date | null>(new Date(2026, 0, 1))
        const { displayValue } = createDatePicker({
            modelValue,
            emit: () => {},
        })
        modelValue.value = new Date(2026, 5, 26)
        await nextTick()
        expect(displayValue.value).toEqual(new Date(2026, 5, 26))
    })
})
