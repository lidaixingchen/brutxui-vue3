import { ref, readonly, computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { formatColor, parseColor } from '../lib/color'
import type { ColorPickerFormat } from '../components/color-picker/types'

type ColorPickerEmit = ((event: 'open') => void)
    & ((event: 'close') => void)
    & ((event: 'change', value: string | null) => void)
    & ((event: 'update:modelValue', value: string | null) => void)

export interface UseColorPickerOptions {
    modelValue?: MaybeRefOrGetter<string | null | undefined>
    format?: MaybeRefOrGetter<ColorPickerFormat>
    showAlpha?: MaybeRefOrGetter<boolean>
    disabled?: MaybeRefOrGetter<boolean>
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: ColorPickerEmit
}

export interface UseColorPickerReturn {
    open: Ref<boolean>
    displayValue: Readonly<Ref<string | null>>
    normalizedDisplay: ComputedRef<string | null>
    swatchStyle: ComputedRef<{ backgroundColor: string }>
    handlePanelUpdate: (value: string | null) => void
    handlePanelConfirm: (value: string | null) => void
    handlePanelClear: () => void
    handleClearClick: (event: Event) => void
    handleTriggerKeydown: (event: KeyboardEvent) => void
}

export function useColorPicker(options: UseColorPickerOptions): UseColorPickerReturn {
    const internalOpen = ref(false)
    const open = computed<boolean>({
        get: () => {
            const controlled = toValue(options.openProp)
            return controlled !== undefined ? controlled : internalOpen.value
        },
        set: (val) => {
            const controlled = toValue(options.openProp)
            if (controlled === undefined) {
                internalOpen.value = val
            }
            options.emitUpdateOpen?.(val)
        },
    })
    const displayValue = ref<string | null>(toValue(options.modelValue) || null)
    let committedValue = displayValue.value
    let previewValue: string | null | undefined

    // 面板内确认关闭（handlePanelConfirm）时跳过 displayValue 重置，
    // 避免父组件异步/延迟更新 modelValue 时用旧值覆盖刚确认的颜色
    let skipResetOnClose = false

    watch(open, (isOpen) => {
        if (isOpen) {
            skipResetOnClose = false
            options.emit('open')
        } else {
            if (!skipResetOnClose) {
                const currentModel = toValue(options.modelValue)
                displayValue.value = currentModel === undefined ? committedValue : currentModel || null
            }
            skipResetOnClose = false
            previewValue = undefined
            options.emit('close')
        }
    })

    watch(() => toValue(options.modelValue), (value) => {
        if (value !== undefined) committedValue = value || null
        displayValue.value = committedValue
        if (displayValue.value !== previewValue) previewValue = undefined
    })

    const normalizedDisplay = computed(() => {
        // 基于 displayValue 计算显示：面板内编辑未提交时，触发器文本同步展示待选颜色
        const value = displayValue.value
        if (!value) return null
        const hsv = parseColor(value)
        if (!hsv) return null
        return formatColor(hsv, toValue(options.format) ?? 'hex', toValue(options.showAlpha))
    })

    const swatchStyle = computed(() => ({
        backgroundColor: normalizedDisplay.value ?? 'transparent',
    }))

    function handlePanelUpdate(value: string | null) {
        displayValue.value = value
        previewValue = value
        options.emit('update:modelValue', value)
    }

    function commitValue(value: string | null) {
        const alreadyPublished = value === previewValue
        displayValue.value = value
        committedValue = value
        previewValue = undefined
        if (!alreadyPublished) options.emit('update:modelValue', value)
        options.emit('change', value)
    }

    function handlePanelConfirm(value: string | null) {
        skipResetOnClose = open.value
        commitValue(value)
        open.value = false
    }

    function handlePanelClear() {
        commitValue(null)
    }

    function handleClearClick(event: Event) {
        event.stopPropagation()
        if (open.value) handlePanelConfirm(null)
        else handlePanelClear()
    }

    function handleTriggerKeydown(event: KeyboardEvent) {
        if (toValue(options.disabled)) return
        if (open.value) {
            // 面板打开后按 Escape 关闭，未确认的值由 watch(open) 在关闭时回退到 modelValue
            if (event.key === 'Escape') {
                open.value = false
            }
            return
        }
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            open.value = true
        }
    }

    return {
        open,
        displayValue: readonly(displayValue),
        normalizedDisplay,
        swatchStyle,
        handlePanelUpdate,
        handlePanelConfirm,
        handlePanelClear,
        handleClearClick,
        handleTriggerKeydown,
    }
}
