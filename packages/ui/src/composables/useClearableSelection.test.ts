import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { useClearableSelection } from './useClearableSelection'

describe('useClearableSelection', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createClearableSelection<TValue = unknown>(
        options: Parameters<typeof useClearableSelection<TValue>>[0],
    ) {
        return scope.run(() => useClearableSelection<TValue>(options))!
    }

    it('shows clear when value is clearable, enabled, and hovered', () => {
        const clearableSelection = createClearableSelection({
            modelValue: () => ['one'],
            clearable: () => true,
            disabled: () => false,
            emptyValue: () => [],
            onClear: vi.fn(),
        })

        clearableSelection.onMouseEnter()

        expect(clearableSelection.showClear.value).toBe(true)
    })

    it('clears to the configured empty value', () => {
        const onClear = vi.fn()
        const clearableSelection = createClearableSelection<string[] | undefined>({
            modelValue: () => ['one'],
            clearable: () => true,
            emptyValue: () => [],
            onClear,
        })
        const event = new Event('click')

        const emptyValue = clearableSelection.clearSelection(event)

        expect(emptyValue).toEqual([])
        expect(onClear).toHaveBeenCalledWith([], event)
    })

    it('uses the latest empty value', () => {
        const onClear = vi.fn()
        const emptyValue = ref<string[] | undefined>([])
        const clearableSelection = createClearableSelection<string[] | undefined>({
            modelValue: () => ['one'],
            clearable: () => true,
            emptyValue,
            onClear,
        })
        emptyValue.value = undefined
        const event = new Event('click')

        clearableSelection.clearSelection(event)

        expect(onClear).toHaveBeenCalledWith(undefined, event)
    })

    it('stops propagation when using handleClear', () => {
        const onClear = vi.fn()
        const clearableSelection = createClearableSelection({
            modelValue: () => 'one',
            clearable: () => true,
            emptyValue: () => undefined,
            onClear,
        })
        const event = new Event('click')
        vi.spyOn(event, 'stopPropagation')

        clearableSelection.handleClear(event)

        expect(event.stopPropagation).toHaveBeenCalled()
        expect(onClear).toHaveBeenCalledWith(undefined, event)
    })
})
