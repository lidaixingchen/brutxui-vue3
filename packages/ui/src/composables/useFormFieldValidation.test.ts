import { effectScope, ref } from 'vue'
import { useFormFieldValidation } from './useFormFieldValidation'

describe('useFormFieldValidation', () => {
    let scope: ReturnType<typeof effectScope>

    beforeEach(() => {
        scope = effectScope(true)
    })

    afterEach(() => {
        scope.stop()
    })

    function createValidation<TValue = string>(options: Parameters<typeof useFormFieldValidation<TValue>>[0] = {}) {
        return scope.run(() => useFormFieldValidation<TValue>(options))!
    }

    it('initializes with default validation state and empty error message', () => {
        const { validationState, errorMessage } = createValidation()
        expect(validationState.value).toBe('default')
        expect(errorMessage.value).toBe('')
    })

    it('returns validate, reset, shouldValidateOnInput, shouldValidateOnBlur functions', () => {
        const result = createValidation()
        expect(typeof result.validate).toBe('function')
        expect(typeof result.reset).toBe('function')
        expect(typeof result.shouldValidateOnInput).toBe('function')
        expect(typeof result.shouldValidateOnBlur).toBe('function')
    })

    it('validate returns true when no rules provided', () => {
        const { validate } = createValidation()
        expect(validate('any value')).toBe(true)
    })

    it('validate returns true when rules array is empty', () => {
        const { validate } = createValidation({ rules: () => [] })
        expect(validate('any value')).toBe(true)
    })

    it('validate sets success state when all rules pass', () => {
        const { validate, validationState, errorMessage } = createValidation({
            rules: () => [(v: string) => v.length > 0],
        })
        validate('hello')
        expect(validationState.value).toBe('success')
        expect(errorMessage.value).toBe('')
    })

    it('validate sets error state when a rule fails with false', () => {
        const { validate, validationState, errorMessage } = createValidation({
            rules: () => [(v: string) => v.length > 5],
        })
        validate('hi')
        expect(validationState.value).toBe('error')
        expect(errorMessage.value).toBe('Invalid value')
    })

    it('validate uses custom error message when rule returns string', () => {
        const { validate, errorMessage } = createValidation({
            rules: () => [(v: string) => v.length > 5 || 'Too short'],
        })
        validate('hi')
        expect(errorMessage.value).toBe('Too short')
    })

    it('validate uses defaultErrorMessage when provided and rule returns false', () => {
        const { validate, errorMessage } = createValidation({
            rules: () => [(v: string) => v.length > 5],
            defaultErrorMessage: () => 'Custom default error',
        })
        validate('hi')
        expect(errorMessage.value).toBe('Custom default error')
    })

    it('validate stops at first failing rule', () => {
        const rules = [
            (v: string) => v.length > 0 || 'Required',
            (v: string) => v.length > 5 || 'Too short',
            vi.fn(() => true),
        ]
        const { validate, errorMessage } = createValidation({ rules: () => rules })
        validate('hi')
        expect(errorMessage.value).toBe('Too short')
        expect(rules[2]).not.toHaveBeenCalled()
    })

    it('validate returns false when validation fails', () => {
        const { validate } = createValidation({
            rules: () => [(v: string) => v.length > 5],
        })
        expect(validate('hi')).toBe(false)
    })

    it('validate returns true when validation passes', () => {
        const { validate } = createValidation({
            rules: () => [(v: string) => v.length > 5],
        })
        expect(validate('hello world')).toBe(true)
    })

    it('onValidationChange callback is called on state change', () => {
        const changes: Array<[string, string?]> = []
        const { validate } = createValidation({
            rules: () => [(v: string) => v.length > 5],
            onValidationChange: (state, message) => changes.push([state, message]),
        })
        validate('hi')
        expect(changes).toContainEqual(['error', 'Invalid value'])
        validate('hello world')
        expect(changes).toContainEqual(['success', undefined])
    })

    it('onValidationChange not called when state stays the same', () => {
        const changes: string[] = []
        const { validate } = createValidation({
            rules: () => [(v: string) => v.length > 5],
            onValidationChange: (state) => changes.push(state),
        })
        validate('hi')
        expect(changes).toHaveLength(1)
        validate('no')
        expect(changes).toHaveLength(1)
    })

    it('reset sets state back to default', () => {
        const { validate, reset, validationState, errorMessage } = createValidation({
            rules: () => [(v: string) => v.length > 5],
        })
        validate('hi')
        expect(validationState.value).toBe('error')
        reset()
        expect(validationState.value).toBe('default')
        expect(errorMessage.value).toBe('')
    })

    it('reset does not call onValidationChange when already default', () => {
        const changes: string[] = []
        const { reset } = createValidation({
            onValidationChange: (state) => changes.push(state),
        })
        reset()
        expect(changes).toHaveLength(0)
    })

    it('reset calls onValidationChange when state was not default', () => {
        const changes: string[] = []
        const { validate, reset } = createValidation({
            rules: () => [(v: string) => v.length > 5],
            onValidationChange: (state) => changes.push(state),
        })
        validate('hi')
        reset()
        expect(changes).toContain('default')
    })

    it('validate resets to default when rules become empty', () => {
        const rulesRef = ref<Array<(v: string) => boolean | string>>([(v: string) => v.length > 5])
        const { validate, validationState } = createValidation({
            rules: () => rulesRef.value,
        })
        validate('hi')
        expect(validationState.value).toBe('error')
        rulesRef.value = []
        validate('hi')
        expect(validationState.value).toBe('default')
    })

    it('shouldValidateOnInput returns true when validateOn is input', () => {
        const { shouldValidateOnInput, shouldValidateOnBlur } = createValidation({
            validateOn: () => 'input',
        })
        expect(shouldValidateOnInput()).toBe(true)
        expect(shouldValidateOnBlur()).toBe(false)
    })

    it('shouldValidateOnBlur returns true when validateOn is blur', () => {
        const { shouldValidateOnInput, shouldValidateOnBlur } = createValidation({
            validateOn: () => 'blur',
        })
        expect(shouldValidateOnInput()).toBe(false)
        expect(shouldValidateOnBlur()).toBe(true)
    })

    it('shouldValidateOnInput and shouldValidateOnBlur return false when validateOn is submit', () => {
        const { shouldValidateOnInput, shouldValidateOnBlur } = createValidation({
            validateOn: () => 'submit',
        })
        expect(shouldValidateOnInput()).toBe(false)
        expect(shouldValidateOnBlur()).toBe(false)
    })

    it('supports generic value types', () => {
        const { validate, validationState } = createValidation<number>({
            rules: () => [(v: number) => v > 0 || 'Must be positive'],
        })
        validate(-1)
        expect(validationState.value).toBe('error')
        validate(5)
        expect(validationState.value).toBe('success')
    })
})
