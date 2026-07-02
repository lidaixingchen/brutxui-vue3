import { ref, computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
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
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: DatePickerEmit
}

export interface UseDatePickerReturn {
    open: Ref<boolean>
    displayValue: Ref<Date | null>
    formattedDisplay: ComputedRef<string>
    handlePanelUpdate: (value: Date | null) => void
    handlePanelConfirm: (value: Date | null) => void
    handlePanelClear: () => void
    handleClearClick: (event: Event) => void
    handleTriggerKeydown: (event: KeyboardEvent) => void
}

export function useDatePicker(options: UseDatePickerOptions): UseDatePickerReturn {
    const internalOpen = ref(false)

    const open = computed<boolean>({
        get: () => {
            const controlled = toValue(options.openProp)
            return controlled !== undefined ? controlled : internalOpen.value
        },
        set: (val) => {
            internalOpen.value = val
            options.emitUpdateOpen?.(val)
        },
    })

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

    if (options.openProp !== undefined) {
        watch(() => toValue(options.openProp), (val) => {
            if (val !== undefined) internalOpen.value = val
        }, { immediate: true })
    }

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

    function handleClearClick(event: Event) {
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
