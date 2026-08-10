import { toValue, type MaybeRefOrGetter } from 'vue'
import { useClearable, type UseClearableReturn } from './useClearable'

export interface UseClearableSelectionOptions<TValue = unknown> {
    modelValue?: MaybeRefOrGetter<TValue | null | undefined>
    clearable?: MaybeRefOrGetter<boolean>
    disabled?: MaybeRefOrGetter<boolean>
    emptyValue: MaybeRefOrGetter<TValue>
    /**
     * 清除回调。契约：消费方需把 emptyValue 回写进 modelValue 对应的 Ref/父组件状态，
     * 仅当回写后 modelValue 变为空值，hasValue/showClear 才会随之隐藏清除按钮；
     * 回调抛出的异常由本库捕获并记录日志，不会向调用方传播。
     */
    onClear: (value: TValue, event: Event) => void
}

export interface UseClearableSelectionReturn<TValue = unknown> extends UseClearableReturn {
    clearSelection: (event: Event) => TValue
}

export function useClearableSelection<TValue = unknown>(
    options: UseClearableSelectionOptions<TValue>
): UseClearableSelectionReturn<TValue> {
    /**
     * 程序化调用入口：不阻止事件冒泡、不校验 clearable/disabled（由调用方自行把握），
     * 返回写入的 emptyValue；DOM 事件入口请用 handleClear（会阻止冒泡）。
     */
    function clearSelection(event: Event): TValue {
        const emptyValue = toValue(options.emptyValue)
        try {
            options.onClear(emptyValue, event)
        } catch (err) {
            // 回调异常不应中断所在的原生事件处理链（尤其经 handleClear 触发时），记录日志便于排查
            console.error('[useClearableSelection] onClear callback threw:', err)
        }
        return emptyValue
    }

    const clearable = useClearable<TValue>({
        modelValue: options.modelValue,
        clearable: options.clearable,
        disabled: options.disabled,
        onClear: clearSelection,
    })

    return {
        ...clearable,
        clearSelection,
    }
}
