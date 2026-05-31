import type { InjectionKey, Ref } from 'vue'

export interface FormFieldContext {
    name: string
    error: Ref<string | undefined>
}

export interface FormItemContext {
    id: string
    formItemId: string
    formDescriptionId: string
    formMessageId: string
}

export const formFieldKey: InjectionKey<FormFieldContext> = Symbol('formField')
export const formItemKey: InjectionKey<FormItemContext> = Symbol('formItem')
