import { ref, computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'

export interface UseClearableOptions<TValue = unknown> {
    /** 当前值，用于判断是否显示清除按钮 */
    modelValue?: MaybeRefOrGetter<TValue | null | undefined>
    /** 是否可清除 */
    clearable?: MaybeRefOrGetter<boolean>
    /** 是否禁用 */
    disabled?: MaybeRefOrGetter<boolean>
    /** 清除时触发的回调 */
    onClear?: (event: MouseEvent) => void
}

export interface UseClearableReturn {
    isHovering: Ref<boolean>
    showClear: ComputedRef<boolean>
    handleClear: (event: MouseEvent) => void
    onMouseEnter: () => void
    onMouseLeave: () => void
}

export function useClearable<TValue = unknown>(options: UseClearableOptions<TValue> = {}): UseClearableReturn {
    const isHovering = ref(false)

    const hasValue = computed(() => {
        const value = toValue(options.modelValue)
        if (value === null || value === undefined) return false
        // 支持数组类型（如 Select multiple 模式）
        if (Array.isArray(value)) return value.length > 0
        return true
    })

    const showClear = computed(() => {
        if (!toValue(options.clearable)) return false
        if (!hasValue.value) return false
        if (toValue(options.disabled)) return false
        return isHovering.value
    })

    function handleClear(event: MouseEvent) {
        event.stopPropagation()
        options.onClear?.(event)
    }

    function onMouseEnter() {
        isHovering.value = true
    }

    function onMouseLeave() {
        isHovering.value = false
    }

    return {
        isHovering,
        showClear,
        handleClear,
        onMouseEnter,
        onMouseLeave,
    }
}
