import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { formatDate } from '../lib/date'
import { useDatePickerSelection } from './useDatePickerSelection'

type DatePickerEmit = ((event: 'open') => void)
    & ((event: 'close') => void)
    & ((event: 'change', value: Date | null) => void)
    & ((event: 'update:modelValue', value: Date | null) => void)

export interface UseDatePickerOptions {
    modelValue?: MaybeRefOrGetter<Date | null>
    displayFormat?: MaybeRefOrGetter<string>
    disabled?: MaybeRefOrGetter<boolean>
    readonly?: MaybeRefOrGetter<boolean>
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: DatePickerEmit
}

export interface UseDatePickerReturn {
    open: Ref<boolean>
    displayValue: Readonly<Ref<Date | null>>
    formattedDisplay: ComputedRef<string>
    handlePanelUpdate: (value: Date | null) => void
    handlePanelConfirm: (value: Date | null) => void
    handlePanelClear: () => void
    handleClearClick: (event: Event) => void
    handleTriggerKeydown: (event: KeyboardEvent) => void
}

export function useDatePicker(options: UseDatePickerOptions): UseDatePickerReturn {
    const selection = useDatePickerSelection(options, (a, b) => a?.getTime() === b?.getTime())

    const formattedDisplay = computed(() => {
        const value = toValue(options.modelValue)
        if (!value) return ''
        return formatDate(value, toValue(options.displayFormat) ?? 'YYYY-MM-DD')
    })

    return { ...selection, formattedDisplay }
}
