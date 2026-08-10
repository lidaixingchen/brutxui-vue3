import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { cn } from '@/lib/utils'

// 默认空态样式：brutal 主题专属 token。提取为模块级常量便于其他主题/复用方统一覆盖，
// 避免通用逻辑与主题设计 token 耦合（调用方仍可经 emptyClass 逐次覆盖）
const DEFAULT_EMPTY_CLASS = 'text-brutal-muted-foreground'

export interface SelectableTriggerState {
    hasValue: boolean
}

export type SelectableTriggerClass =
    | MaybeRefOrGetter<string | false | null | undefined>
    | ((state: SelectableTriggerState) => string | false | null | undefined)

export interface UseSelectableTriggerOptions<TValue = unknown> {
    modelValue?: MaybeRefOrGetter<TValue | null | undefined>
    hasValue?: MaybeRefOrGetter<boolean | undefined>
    getHasValue?: (value: TValue | null | undefined) => boolean
    baseClass?: SelectableTriggerClass
    class?: MaybeRefOrGetter<string | false | null | undefined>
    emptyClass?: MaybeRefOrGetter<string | false | null | undefined>
}

export interface UseSelectableTriggerReturn {
    hasValue: ComputedRef<boolean>
    triggerClasses: ComputedRef<string>
}

// 解析 baseClass：按函数形参个数做 arity 分派——`() => T` 是无参 getter（与
// MaybeRefOrGetter 中的 getter 形态一致，如 `() => cascaderTriggerVariants(...)`），
// 只有声明了形参的 `(state) => T` 才接收 state 对象。
// 注意：状态回调禁止使用默认参数/rest 参数（Function.length 会退化为 0，被误判为零参 getter）
function resolveBaseClass(
    base: SelectableTriggerClass | undefined,
    state: SelectableTriggerState,
): string | false | null | undefined {
    if (typeof base !== 'function') return toValue(base)
    return base.length > 0
        ? (base as (state: SelectableTriggerState) => string | false | null | undefined)(state)
        : (base as () => string | false | null | undefined)()
}

export function useSelectableTrigger<TValue = unknown>(
    options: UseSelectableTriggerOptions<TValue> = {}
): UseSelectableTriggerReturn {
    const hasValue = computed(() => {
        const explicitHasValue = toValue(options.hasValue)
        if (explicitHasValue !== undefined) return explicitHasValue

        const value = toValue(options.modelValue)
        if (options.getHasValue) return options.getHasValue(value)
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'string') return value.length > 0
        // 取舍说明：0 / false / 空对象等 falsy 原始值一律视为「已选择」（它们都是合法的选中值，
        // 如索引 0、布尔勾选态），只有 null/undefined 才算未选择；如需把 0/false 视为未选择，
        // 请通过 getHasValue 定制判定规则
        return value !== null && value !== undefined
    })

    const triggerClasses = computed(() => {
        const state = { hasValue: hasValue.value }
        const baseClass = resolveBaseClass(options.baseClass, state)
        const emptyClass = options.emptyClass === undefined
            ? DEFAULT_EMPTY_CLASS
            : toValue(options.emptyClass)

        return cn(
            baseClass,
            !state.hasValue && emptyClass,
            toValue(options.class)
        )
    })

    return {
        hasValue,
        triggerClasses,
    }
}
