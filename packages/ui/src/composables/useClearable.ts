import { computed, readonly, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { hasSelectionValue } from '@/lib/selection-value'

export interface UseClearableOptions<TValue = unknown> {
    /** 当前值，用于判断是否显示清除按钮 */
    modelValue?: MaybeRefOrGetter<TValue | null | undefined>
    /** 是否可清除 */
    clearable?: MaybeRefOrGetter<boolean>
    /** 是否禁用 */
    disabled?: MaybeRefOrGetter<boolean>
    /** 清除时触发的回调 */
    onClear?: (event: Event) => void
}

export interface UseClearableReturn {
    isHovering: Readonly<Ref<boolean>>
    isFocused: Readonly<Ref<boolean>>
    showClear: ComputedRef<boolean>
    handleClear: (event: Event) => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    onFocus: () => void
    onBlur: () => void
}

export function useClearable<TValue = unknown>(options: UseClearableOptions<TValue> = {}): UseClearableReturn {
    const isHovering = ref(false)
    const isFocused = ref(false)

    const hasValue = computed(() => hasSelectionValue(toValue(options.modelValue)))

    const showClear = computed(() => {
        if (!toValue(options.clearable)) return false
        if (!hasValue.value) return false
        if (toValue(options.disabled)) return false
        // 悬停或键盘/触屏聚焦时均显示清除按钮，弥补触屏与键盘可达性盲区
        return isHovering.value || isFocused.value
    })

    function handleClear(event: Event) {
        // preventDefault 兜底：即使调用方把 handleClear 绑到 form 内默认 type=submit 的按钮，
        // 也不会触发表单提交等默认行为
        event.preventDefault()
        event.stopPropagation()
        options.onClear?.(event)
    }

    function onMouseEnter() {
        isHovering.value = true
    }

    function onMouseLeave() {
        isHovering.value = false
    }

    function onFocus() {
        isFocused.value = true
    }

    function onBlur() {
        isFocused.value = false
    }

    return {
        isHovering: readonly(isHovering),
        isFocused: readonly(isFocused),
        showClear,
        handleClear,
        onMouseEnter,
        onMouseLeave,
        onFocus,
        onBlur,
    }
}
