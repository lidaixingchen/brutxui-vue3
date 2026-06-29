import { ref, computed, watch, toValue, type MaybeRefOrGetter } from 'vue'
import { formatColor, parseColor } from '../lib/color'
import type { ColorPickerFormat } from '../components/color-picker/types'

type ColorPickerEmit = ((event: 'open') => void)
    & ((event: 'close') => void)
    & ((event: 'change', value: string | null) => void)
    & ((event: 'update:modelValue', value: string | null) => void)

export interface UseColorPickerOptions {
    modelValue?: MaybeRefOrGetter<string | null>
    format?: MaybeRefOrGetter<ColorPickerFormat>
    showAlpha?: MaybeRefOrGetter<boolean>
    disabled?: MaybeRefOrGetter<boolean>
    emit: ColorPickerEmit
}

export function useColorPicker(options: UseColorPickerOptions) {
    const open = ref(false)
    const displayValue = ref<string | null>(toValue(options.modelValue) ?? null)

    watch(open, (isOpen) => {
        if (isOpen) {
            options.emit('open')
        } else {
            options.emit('close')
            const currentModel = toValue(options.modelValue) ?? null
            if (displayValue.value !== currentModel) {
                options.emit('change', displayValue.value)
            }
        }
    })

    watch(() => toValue(options.modelValue), (value) => {
        displayValue.value = value ?? null
    })

    const normalizedDisplay = computed(() => {
        const value = toValue(options.modelValue)
        if (!value) return null
        const hsv = parseColor(value)
        if (!hsv) return null
        return formatColor(hsv, toValue(options.format) ?? 'hex', toValue(options.showAlpha))
    })

    const swatchStyle = computed(() => ({
        backgroundColor: toValue(options.modelValue) ?? 'transparent',
    }))

    function handlePanelUpdate(value: string | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
    }

    function handlePanelConfirm(value: string | null) {
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
        if (toValue(options.disabled)) return
        if ((event.key === 'Enter' || event.key === ' ') && !open.value) {
            event.preventDefault()
            open.value = true
        }
    }

    return {
        open,
        displayValue,
        normalizedDisplay,
        swatchStyle,
        handlePanelUpdate,
        handlePanelConfirm,
        handlePanelClear,
        handleClearClick,
        handleTriggerKeydown,
    }
}
