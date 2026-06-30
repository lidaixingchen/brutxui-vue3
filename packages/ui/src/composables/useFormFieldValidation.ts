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
            if (result !== true) {
                isOk = false
                errText = typeof result === 'string'
                    ? result
                    : toValue(options.defaultErrorMessage) ?? 'Invalid value'
                break
            }
        }

        const prevState = validationState.value
        if (!isOk) {
            validationState.value = 'error'
            errorMessage.value = errText
            if (prevState !== 'error') {
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
