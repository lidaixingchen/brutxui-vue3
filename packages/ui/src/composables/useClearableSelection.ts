import { toValue, type MaybeRefOrGetter } from 'vue'
import { useClearable, type UseClearableReturn } from './useClearable'

export interface UseClearableSelectionOptions<TValue = unknown> {
    modelValue?: MaybeRefOrGetter<TValue | null | undefined>
    clearable?: MaybeRefOrGetter<boolean>
    disabled?: MaybeRefOrGetter<boolean>
    emptyValue: MaybeRefOrGetter<TValue>
    onClear: (value: TValue, event: Event) => void
}

export interface UseClearableSelectionReturn<TValue = unknown> extends UseClearableReturn {
    clearSelection: (event: Event) => TValue
}

export function useClearableSelection<TValue = unknown>(
    options: UseClearableSelectionOptions<TValue>
): UseClearableSelectionReturn<TValue> {
    function clearSelection(event: Event): TValue {
        const emptyValue = toValue(options.emptyValue)
        options.onClear(emptyValue, event)
        return emptyValue
    }

    const clearable = useClearable<TValue>({
        modelValue: options.modelValue,
        clearable: options.clearable,
        disabled: options.disabled,
        onClear: clearSelection,
    })

    return {
        ...clearable,
        clearSelection,
    }
}
