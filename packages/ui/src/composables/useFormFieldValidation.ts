import { ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

export type ValidationState = 'default' | 'success' | 'error'
export type ValidationRule<TValue> = (value: TValue) => boolean | string
export type ValidateOn = 'input' | 'blur' | 'submit'

export interface UseFormFieldValidationOptions<TValue = string> {
    rules?: MaybeRefOrGetter<ValidationRule<TValue>[]>
    validateOn?: MaybeRefOrGetter<ValidateOn>
    defaultErrorMessage?: MaybeRefOrGetter<string>
    onValidationChange?: (state: ValidationState, message?: string) => void
}

export interface UseFormFieldValidationReturn<TValue = string> {
    validationState: Ref<ValidationState>
    errorMessage: Ref<string>
    validate: (value: TValue) => boolean
    reset: () => void
    shouldValidateOnInput: () => boolean
    shouldValidateOnBlur: () => boolean
}

export function useFormFieldValidation<TValue = string>(options: UseFormFieldValidationOptions<TValue> = {}): UseFormFieldValidationReturn<TValue> {
    const validationState = ref<ValidationState>('default')
    const errorMessage = ref<string>('')

    function validate(value: TValue): boolean {
        const rules = toValue(options.rules) ?? []
        // 无规则时保持 'default'（"无需校验/未经过校验"），与有规则通过后的 'success' 语义区分；
        // 消费方（如 HardcoreInput 的 rulesEmpty 分支）依赖此契约，勿改为 'success'
        if (rules.length === 0) {
            if (validationState.value !== 'default') {
                validationState.value = 'default'
                errorMessage.value = ''
                options.onValidationChange?.('default')
            }
            return true
        }

        let isOk = true
        let errText = ''
        for (const rule of rules) {
            const result = rule(value)
            // 规则契约是同步 boolean | string；若经类型断言/any 传入异步规则，
            // 明确抛错而非把 Promise 静默当作校验失败并显示默认错误文案（难以排查）
            // 静态类型为 boolean | string，此处经 unknown 断言做运行时 Promise 检测
            if ((result as unknown) instanceof Promise) {
                throw new TypeError('[useFormFieldValidation] 仅支持同步规则，请勿传入异步规则')
            }
            if (result !== true) {
                isOk = false
                errText = typeof result === 'string'
                    ? result
                    : toValue(options.defaultErrorMessage) ?? 'Invalid value'
                break
            }
        }

        const prevState = validationState.value
        const prevErrText = errorMessage.value
        if (!isOk) {
            validationState.value = 'error'
            errorMessage.value = errText
            // 连续两次失败但错误文案变化时也要再次通知，避免依赖回调同步的非响应式状态长期展示过期错误
            if (prevState !== 'error' || errText !== prevErrText) {
                options.onValidationChange?.('error', errText)
            }
        } else {
            validationState.value = 'success'
            errorMessage.value = ''
            if (prevState !== 'success') {
                options.onValidationChange?.('success')
            }
        }

        return isOk
    }

    function reset() {
        if (validationState.value === 'default') return
        validationState.value = 'default'
        errorMessage.value = ''
        options.onValidationChange?.('default')
    }

    const shouldValidateOnInput = () => toValue(options.validateOn) === 'input'
    const shouldValidateOnBlur = () => toValue(options.validateOn) === 'blur'

    return {
        validationState,
        errorMessage,
        validate,
        reset,
        shouldValidateOnInput,
        shouldValidateOnBlur,
    }
}
