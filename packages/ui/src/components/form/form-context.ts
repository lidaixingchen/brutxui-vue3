import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { FormContext as VeeFormContext } from 'vee-validate'
import type { FormWizardContext } from './form-wizard-types'

// 注意：本模块的注入键均为模块级 Symbol，依赖模块单例。
// 若包被重复打包/多版本共存导致 provide 与 inject 拿到不同 Symbol，
// inject 会静默回落默认值，请勿将本模块拆分或复制。

export interface FormFieldContext {
    name: Ref<string>
    error: Ref<string | undefined>
    value: Ref<unknown>
    setValue: (value: unknown) => void
    setError: (message: string | undefined) => void
}

export interface FormItemContext {
    formItemId: string
    formDescriptionId: string
    formMessageId: string
}

export interface FormLayoutContext {
    inline?: boolean
    labelPosition?: 'left' | 'right' | 'top'
    labelWidth?: string | number
    size?: 'sm' | 'default' | 'lg'
}

export const formContextKey: InjectionKey<ComputedRef<VeeFormContext & FormLayoutContext>> = Symbol('formContext')
export const formFieldKey: InjectionKey<FormFieldContext> = Symbol('formField')
export const formItemKey: InjectionKey<FormItemContext> = Symbol('formItem')
export const formWizardContextKey: InjectionKey<FormWizardContext> = Symbol('formWizardContext')
