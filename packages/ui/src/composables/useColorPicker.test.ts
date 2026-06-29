import { effectScope, nextTick, ref } from 'vue'
import { useColorPicker } from './useColorPicker'

describe('useColorPicker', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createColorPicker(options: Parameters<typeof useColorPicker>[0]) {
        return scope.run(() => useColorPicker(options))!
    }

    it('initializes with open=false', () => {
        const { open } = createColorPicker({ emit: () => {} })
        expect(open.value).toBe(false)
    })

    it('initializes displayValue from modelValue', () => {
        const { displayValue } = createColorPicker({
            modelValue: () => '#ff0000',
            emit: () => {},
        })
        expect(displayValue.value).toBe('#ff0000')
    })

    it('initializes displayValue as null when modelValue is null', () => {
        const { displayValue } = createColorPicker({
            modelValue: () => null,
            emit: () => {},
        })
        expect(displayValue.value).toBeNull()
    })

    it('normalizedDisplay returns null when modelValue is null', () => {
        const { normalizedDisplay } = createColorPicker({
            modelValue: () => null,
            emit: () => {},
        })
        expect(normalizedDisplay.value).toBeNull()
    })

    it('normalizedDisplay formats hex color', () => {
        const { normalizedDisplay } = createColorPicker({
            modelValue: () => '#ff0000',
            format: () => 'hex',
            emit: () => {},
        })
        expect(normalizedDisplay.value).toBe('#ff0000')
    })

    it('normalizedDisplay formats rgb color', () => {
        const { normalizedDisplay } = createColorPicker({
            modelValue: () => '#ff0000',
            format: () => 'rgb',
            emit: () => {},
        })
        expect(normalizedDisplay.value).toMatch(/rgb/i)
    })

    it('normalizedDisplay returns null for invalid color', () => {
        const { normalizedDisplay } = createColorPicker({
            modelValue: () => 'not-a-color',
            emit: () => {},
        })
        expect(normalizedDisplay.value).toBeNull()
    })

    it('normalizedDisplay uses hex as default format when format is undefined', () => {
        const { normalizedDisplay } = createColorPicker({
            modelValue: () => '#ff0000',
            emit: () => {},
        })
        expect(normalizedDisplay.value).toBe('#ff0000')
    })

    it('swatchStyle returns backgroundColor from modelValue', () => {
        const { swatchStyle } = createColorPicker({
            modelValue: () => '#ff0000',
            emit: () => {},
        })
        expect(swatchStyle.value).toEqual({ backgroundColor: '#ff0000' })
    })

    it('swatchStyle returns transparent when modelValue is null', () => {
        const { swatchStyle } = createColorPicker({
            modelValue: () => null,
            emit: () => {},
        })
        expect(swatchStyle.value).toEqual({ backgroundColor: 'transparent' })
    })

    it('setting open=true emits open event', async () => {
        const emitted: string[] = []
        const { open } = createColorPicker({
            emit: (event: string) => emitted.push(event),
        })
        open.value = true
        await nextTick()
        expect(emitted).toContain('open')
    })

    it('setting open=false emits close event', async () => {
        const emitted: string[] = []
        const { open } = createColorPicker({
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
        const modelValue = ref<string | null>('#ff0000')
        const { open, displayValue } = createColorPicker({
            modelValue,
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        displayValue.value = '#00ff00'
        open.value = true
        await nextTick()
        open.value = false
        await nextTick()
        const changeEvents = emitted.filter(([e]) => e === 'change')
        expect(changeEvents.length).toBe(1)
        expect(changeEvents[0][1]).toBe('#00ff00')
    })

    it('closing does not emit change when displayValue equals modelValue', async () => {
        const emitted: Array<[string, unknown]> = []
        const { open } = createColorPicker({
            modelValue: () => '#ff0000',
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
        const { handlePanelUpdate, displayValue } = createColorPicker({
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        handlePanelUpdate('#00ff00')
        expect(displayValue.value).toBe('#00ff00')
        expect(emitted).toContainEqual(['update:modelValue', '#00ff00'])
    })

    it('handlePanelConfirm updates value, emits update:modelValue and change, closes panel', () => {
        const emitted: Array<[string, unknown]> = []
        const { handlePanelConfirm, open, displayValue } = createColorPicker({
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        open.value = true
        handlePanelConfirm('#00ff00')
        expect(displayValue.value).toBe('#00ff00')
        expect(open.value).toBe(false)
        expect(emitted).toContainEqual(['update:modelValue', '#00ff00'])
        expect(emitted).toContainEqual(['change', '#00ff00'])
    })

    it('handlePanelClear clears value and emits update:modelValue null and change null', () => {
        const emitted: Array<[string, unknown]> = []
        const { handlePanelClear, displayValue } = createColorPicker({
            modelValue: () => '#ff0000',
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        handlePanelClear()
        expect(displayValue.value).toBeNull()
        expect(emitted).toContainEqual(['update:modelValue', null])
        expect(emitted).toContainEqual(['change', null])
    })

    it('handleClearClick stops propagation and clears value', () => {
        const emitted: Array<[string, unknown]> = []
        const { handleClearClick, displayValue } = createColorPicker({
            modelValue: () => '#ff0000',
            emit: (event: string, ...args: unknown[]) => emitted.push([event, args[0]]),
        })
        const event = { stopPropagation: vi.fn() } as unknown as MouseEvent
        handleClearClick(event)
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(displayValue.value).toBeNull()
        expect(emitted).toContainEqual(['update:modelValue', null])
    })

    it('handleTriggerKeydown opens panel on Enter', () => {
        const { handleTriggerKeydown, open } = createColorPicker({
            emit: () => {},
        })
        const event = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent
        handleTriggerKeydown(event)
        expect(open.value).toBe(true)
    })

    it('handleTriggerKeydown opens panel on Space', () => {
        const { handleTriggerKeydown, open } = createColorPicker({
            emit: () => {},
        })
        const event = { key: ' ', preventDefault: vi.fn() } as unknown as KeyboardEvent
        handleTriggerKeydown(event)
        expect(open.value).toBe(true)
    })

    it('handleTriggerKeydown does not open when disabled', () => {
        const { handleTriggerKeydown, open } = createColorPicker({
            disabled: () => true,
            emit: () => {},
        })
        const event = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent
        handleTriggerKeydown(event)
        expect(open.value).toBe(false)
    })

    it('handleTriggerKeydown does not open when already open', () => {
        const { handleTriggerKeydown, open } = createColorPicker({
            emit: () => {},
        })
        open.value = true
        const event = { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent
        handleTriggerKeydown(event)
        expect(event.preventDefault).not.toHaveBeenCalled()
    })

    it('displayValue syncs when modelValue changes', async () => {
        const modelValue = ref<string | null>('#ff0000')
        const { displayValue } = createColorPicker({
            modelValue,
            emit: () => {},
        })
        modelValue.value = '#00ff00'
        await nextTick()
        expect(displayValue.value).toBe('#00ff00')
    })
})
