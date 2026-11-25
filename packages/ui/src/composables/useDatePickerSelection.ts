import { computed, readonly, ref, shallowRef, toValue, watch, type DeepReadonly, type MaybeRefOrGetter, type Ref } from 'vue'

interface DatePickerSelectionOptions<TValue> {
    modelValue?: MaybeRefOrGetter<TValue | null>
    disabled?: MaybeRefOrGetter<boolean>
    readonly?: MaybeRefOrGetter<boolean>
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: ((event: 'open') => void)
        & ((event: 'close') => void)
        & ((event: 'change', value: TValue | null) => void)
        & ((event: 'update:modelValue', value: TValue | null) => void)
    onTriggerClear?: () => void
}

export function useDatePickerSelection<TValue extends Date | readonly [Date, Date]>(
    options: DatePickerSelectionOptions<TValue>,
    isSameValue: (a: TValue | null, b: TValue | null) => boolean,
) {
    const internalOpen = ref(false)
    const open = computed({
        get: () => {
            const controlledOpen = toValue(options.openProp)
            return controlledOpen !== undefined ? controlledOpen : internalOpen.value
        },
        set: (value: boolean) => {
            if (value && toValue(options.readonly)) return
            if (toValue(options.openProp) === undefined) internalOpen.value = value
            options.emitUpdateOpen?.(value)
        },
    })

    const getModelValue = () => toValue(options.modelValue) ?? null
    const displayValue: Ref<TValue | null> = shallowRef(getModelValue())
    const readonlyDisplayValue: DeepReadonly<Ref<TValue | null>> = readonly(displayValue)
    let suppressCloseChange = false

    watch(open, (isOpen) => {
        if (isOpen) {
            suppressCloseChange = false
            displayValue.value = getModelValue()
            options.emit('open')
            return
        }

        options.emit('close')
        if (suppressCloseChange) {
            suppressCloseChange = false
        } else if (!isSameValue(displayValue.value, getModelValue())) {
            options.emit('change', displayValue.value)
        }
    })

    watch(() => toValue(options.disabled), (isDisabled) => {
        if (!isDisabled || !(toValue(options.openProp) ?? internalOpen.value)) return

        displayValue.value = getModelValue()
        suppressCloseChange = true
        open.value = false
    }, { immediate: true })

    watch(() => toValue(options.openProp), (value) => {
        if (value !== undefined) internalOpen.value = value
    }, { immediate: true })

    watch(() => toValue(options.modelValue), (value) => {
        displayValue.value = value ?? null
    })

    function handlePanelUpdate(value: TValue | null) {
        if (toValue(options.disabled)) return
        displayValue.value = value
        // 面板清除后会补发一次空值更新。重新选值后，关闭面板时再比较当前值。
        if (value !== null) suppressCloseChange = false
        options.emit('update:modelValue', value)
    }

    function commitSelection(value: TValue | null) {
        if (toValue(options.disabled)) return false
        displayValue.value = value
        options.emit('update:modelValue', value)
        options.emit('change', value)
        suppressCloseChange = true
        return true
    }

    function handlePanelConfirm(value: TValue | null) {
        if (commitSelection(value)) open.value = false
    }

    function handlePanelClear() {
        commitSelection(null)
    }

    function handleClearClick(event: Event) {
        event.stopPropagation()
        if (commitSelection(null)) options.onTriggerClear?.()
    }

    function handleTriggerKeydown(event: KeyboardEvent) {
        if (
            (toValue(options.disabled) || toValue(options.readonly))
            && (event.key === 'Enter' || event.key === ' ')
        ) {
            event.preventDefault()
        }
    }

    return {
        open,
        displayValue: readonlyDisplayValue,
        handlePanelUpdate,
        handlePanelConfirm,
        handlePanelClear,
        handleClearClick,
        handleTriggerKeydown,
    }
}
