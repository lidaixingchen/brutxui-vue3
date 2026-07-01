export const inputVariantOptions = ['default', 'error', 'success'] as const

export type InputVariant = (typeof inputVariantOptions)[number]

export const inputVariantClasses: Record<InputVariant, string> = {
    default: 'border-brutal',
    error: 'border-brutal-destructive focus:shadow-brutal-primary',
    success: 'border-brutal-success focus:shadow-brutal-secondary',
}

export interface BaseInputProps {
    modelValue?: string
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    errorMessage?: string
}
