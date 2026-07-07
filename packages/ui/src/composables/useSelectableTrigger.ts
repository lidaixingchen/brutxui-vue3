import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { cn } from '@/lib/utils'

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
        return value !== null && value !== undefined
    })

    const triggerClasses = computed(() => {
        const state = { hasValue: hasValue.value }
        const baseClass = typeof options.baseClass === 'function'
            ? options.baseClass(state)
            : toValue(options.baseClass)
        const emptyClass = options.emptyClass === undefined
            ? 'text-brutal-muted-foreground'
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
