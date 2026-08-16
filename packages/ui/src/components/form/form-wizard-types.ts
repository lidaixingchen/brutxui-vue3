import type { Component, Ref, ComputedRef } from 'vue'

export interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    /** 入参为全量 values（跨步骤共享的扁平字段集合），约定只返回当前步骤相关字段的错误 */
    validator?: (values: Record<string, unknown>) => ValidationResult
    /** 线性导航下可跳过（不要求完成即可前进），但不豁免 validator */
    optional?: boolean
}

export interface ValidationResult {
    valid: boolean
    errors: Record<string, string>
}

export interface FormWizardProps {
    steps: FormStep[]
    modelValue?: Record<string, unknown>
    initialStep?: number
    validateOnNext?: boolean
    showIndicator?: boolean
    linear?: boolean
    class?: string
}

export interface FormWizardContext {
    currentStep: Ref<number>
    steps: ComputedRef<FormStep[]>
    values: ComputedRef<Record<string, unknown>>
    /** 浅合并后写入（{ ...values, ...patch }），各步骤可只提交自身字段而不覆盖其他步骤数据 */
    updateValues: (values: Record<string, unknown>) => void
    nextStep: () => void
    previousStep: () => void
    /** 实现层已做边界防御：越界（<0 或 >= steps.length）时静默忽略 */
    goToStep: (step: number) => void
    /** 提交前校验所有带 validator 的步骤，全部通过才触发 complete */
    complete: () => void
    /** undefined 表示该步骤未校验或已通过；非 undefined 表示存在校验失败记录（errors 可能为空对象） */
    getStepErrors: (step: number) => Record<string, string> | undefined
    isFirstStep: ComputedRef<boolean>
    isLastStep: ComputedRef<boolean>
    /** linear 模式：当前步骤无校验失败记录（validateOnNext=false 时恒为 true）；非线性模式恒为 true */
    canGoNext: ComputedRef<boolean>
}
