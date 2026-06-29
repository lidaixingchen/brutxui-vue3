import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { formatDate } from '../lib/date'

type DatePickerEmit = ((event: 'open') => void)
    & ((event: 'close') => void)
    & ((event: 'change', value: Date | null) => void)
    & ((event: 'update:modelValue', value: Date | null) => void)

export interface UseDatePickerOptions {
    modelValue?: MaybeRefOrGetter<Date | null>
    displayFormat?: MaybeRefOrGetter<string>
    disabled?: MaybeRefOrGetter<boolean>
    readonly?: MaybeRefOrGetter<boolean>
    emit: DatePickerEmit
}

export function useDatePicker(options: UseDatePickerOptions) {
    const open = ref(false)
    const displayValue = ref<Date | null>(toValue(options.modelValue) ?? null)

    watch(open, (isOpen) => {
        if (isOpen) {
            options.emit('open')
        } else {
            options.emit('close')
            const currentModel = toValue(options.modelValue) ?? null
            if (displayValue.value?.getTime() !== currentModel?.getTime()) {
                options.emit('change', displayValue.value)
            }
        }
    })

    watch(() => toValue(options.modelValue), (value) => {
        displayValue.value = value ?? null
    })

    const formattedDisplay = computed(() => {
        const value = toValue(options.modelValue)
        if (!value) return ''
        return formatDate(value, toValue(options.displayFormat) ?? 'YYYY-MM-DD')
    })

    function handlePanelUpdate(value: Date | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
    }

    function handlePanelConfirm(value: Date | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
        options.emit('change', value)
        open.value = false
    }

    function handlePanelClear() {
        displayValue.value = null
        options.emit('update:modelValue', null)
        options.emit('change', null)
    }

    function handleClearClick(event: MouseEvent) {
        event.stopPropagation()
        displayValue.value = null
        options.emit('update:modelValue', null)
        options.emit('change', null)
    }

    function handleTriggerKeydown(event: KeyboardEvent) {
        if (toValue(options.disabled) || toValue(options.readonly)) return
        if ((event.key === 'Enter' || event.key === ' ') && !open.value) {
            event.preventDefault()
            open.value = true
        }
    }

    return {
        open,
        displayValue,
        formattedDisplay,
        handlePanelUpdate,
        handlePanelConfirm,
        handlePanelClear,
        handleClearClick,
        handleTriggerKeydown,
    }
}
