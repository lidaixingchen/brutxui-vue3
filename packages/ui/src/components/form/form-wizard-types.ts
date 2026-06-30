import type { Component, Ref, ComputedRef } from 'vue'

export interface FormStep {
    id: string
    title: string
    description?: string
    icon?: Component
    validator?: (values: Record<string, unknown>) => ValidationResult
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
    updateValues: (values: Record<string, unknown>) => void
    nextStep: () => void
    previousStep: () => void
    goToStep: (step: number) => void
    complete: () => void
    getStepErrors: (step: number) => Record<string, string> | undefined
    isFirstStep: ComputedRef<boolean>
    isLastStep: ComputedRef<boolean>
    canGoNext: ComputedRef<boolean>
}
