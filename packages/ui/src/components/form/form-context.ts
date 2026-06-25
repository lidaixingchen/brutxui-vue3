import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { FormContext as VeeFormContext } from 'vee-validate'
import type { FormWizardContext } from './FormWizard.vue'

export interface FormFieldContext {
    name: ComputedRef<string>
    error: Ref<string | undefined>
    value: Ref<unknown>
    setValue: (value: unknown) => void
}

export interface FormItemContext {
    id: string
    formItemId: string
    formDescriptionId: string
    formMessageId: string
}

export const formContextKey: InjectionKey<VeeFormContext> = Symbol('formContext')
export const formFieldKey: InjectionKey<FormFieldContext> = Symbol('formField')
export const formItemKey: InjectionKey<FormItemContext> = Symbol('formItem')
export const formWizardContextKey: InjectionKey<FormWizardContext> = Symbol('formWizardContext')
