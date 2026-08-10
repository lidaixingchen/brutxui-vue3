import { ref, computed, watch, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
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
    openProp?: MaybeRefOrGetter<boolean | undefined>
    emitUpdateOpen?: (value: boolean) => void
    emit: ColorPickerEmit
}

export interface UseColorPickerReturn {
    open: Ref<boolean>
    displayValue: Ref<string | null>
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
    // 空字符串与 null 统一归一化为 null（与 normalizedDisplay 的判空语义一致）
    const displayValue = ref<string | null>(toValue(options.modelValue) || null)

    // 面板内确认关闭（handlePanelConfirm）时跳过 displayValue 重置，
    // 避免父组件异步/延迟更新 modelValue 时用旧值覆盖刚确认的颜色
    let skipResetOnClose = false

    watch(open, (isOpen) => {
        if (isOpen) {
            skipResetOnClose = false
            options.emit('open')
        } else {
            options.emit('close')
            if (skipResetOnClose) {
                skipResetOnClose = false
                return
            }
            const currentModel = toValue(options.modelValue) ?? null
            if (displayValue.value !== currentModel) {
                displayValue.value = currentModel
            }
        }
    })

    watch(() => toValue(options.modelValue), (value) => {
        displayValue.value = value || null
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
        // 基于 displayValue（含空串归一化）计算色块：面板内编辑未提交时同步展示待选颜色
        backgroundColor: displayValue.value || 'transparent',
    }))

    function handlePanelUpdate(value: string | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
    }

    function handlePanelConfirm(value: string | null) {
        displayValue.value = value
        options.emit('update:modelValue', value)
        options.emit('change', value)
        skipResetOnClose = true
        open.value = false
    }

    function clearValue() {
        displayValue.value = null
        options.emit('update:modelValue', null)
        options.emit('change', null)
    }

    function handlePanelClear() {
        clearValue()
    }

    function handleClearClick(event: Event) {
        event.stopPropagation()
        clearValue()
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
