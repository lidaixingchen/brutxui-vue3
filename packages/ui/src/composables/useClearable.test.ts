import { effectScope, ref } from 'vue'
import { useClearable } from './useClearable'

describe('useClearable', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createClearable<TValue = unknown>(
        options: Parameters<typeof useClearable<TValue>>[0] = {},
    ) {
        return scope.run(() => useClearable<TValue>(options))!
    }

    it('initializes isHovering as false', () => {
        const { isHovering } = createClearable()
        expect(isHovering.value).toBe(false)
    })

    it('showClear is false when clearable is false', () => {
        const { showClear } = createClearable({
            modelValue: () => 'hello',
            clearable: () => false,
        })
        expect(showClear.value).toBe(false)
    })

    it('showClear is false when modelValue is null', () => {
        const { showClear } = createClearable({
            modelValue: () => null,
            clearable: () => true,
        })
        expect(showClear.value).toBe(false)
    })

    it('showClear is false when modelValue is undefined', () => {
        const { showClear } = createClearable({
            modelValue: () => undefined,
            clearable: () => true,
        })
        expect(showClear.value).toBe(false)
    })

    it('showClear is false when disabled is true', () => {
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
            disabled: () => true,
        })
        onMouseEnter()
        expect(showClear.value).toBe(false)
    })

    it('showClear is false when not hovering', () => {
        const { showClear } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
        })
        expect(showClear.value).toBe(false)
    })

    it('showClear is true when clearable, has value, not disabled, and hovering', () => {
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
            disabled: () => false,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
    })

    it('showClear becomes false after mouse leave', () => {
        const { showClear, onMouseEnter, onMouseLeave } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
        onMouseLeave()
        expect(showClear.value).toBe(false)
    })

    it('handleClear calls onClear callback and stops propagation', () => {
        const onClear = vi.fn()
        const { handleClear } = createClearable({ onClear })
        const event = new MouseEvent('click')
        vi.spyOn(event, 'stopPropagation')
        handleClear(event)
        expect(event.stopPropagation).toHaveBeenCalled()
        expect(onClear).toHaveBeenCalledWith(event)
    })

    it('handleClear works without onClear callback', () => {
        const { handleClear } = createClearable()
        const event = new MouseEvent('click')
        vi.spyOn(event, 'stopPropagation')
        handleClear(event)
        expect(event.stopPropagation).toHaveBeenCalled()
    })

    it('hasValue returns true for non-empty string', () => {
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
    })

    it('hasValue returns false for empty string', () => {
        const { showClear } = createClearable({
            modelValue: () => '',
            clearable: () => true,
        })
        expect(showClear.value).toBe(false)
    })

    it('hasValue returns true for non-empty array', () => {
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => ['a', 'b'],
            clearable: () => true,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
    })

    it('hasValue returns false for empty array', () => {
        const { showClear } = createClearable({
            modelValue: () => [],
            clearable: () => true,
        })
        expect(showClear.value).toBe(false)
    })

    it('supports ref modelValue', () => {
        const modelValue = ref<string | null>('hello')
        const { showClear, onMouseEnter } = createClearable({
            modelValue,
            clearable: () => true,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
        modelValue.value = null
        expect(showClear.value).toBe(false)
    })

    it('supports ref clearable', () => {
        const clearable = ref(false)
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => 'hello',
            clearable,
        })
        onMouseEnter()
        expect(showClear.value).toBe(false)
        clearable.value = true
        expect(showClear.value).toBe(true)
    })

    it('supports ref disabled', () => {
        const disabled = ref(false)
        const { showClear, onMouseEnter } = createClearable({
            modelValue: () => 'hello',
            clearable: () => true,
            disabled,
        })
        onMouseEnter()
        expect(showClear.value).toBe(true)
        disabled.value = true
        expect(showClear.value).toBe(false)
    })
})
