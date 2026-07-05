export const inputVariantOptions = ['default', 'error', 'success'] as const

export type InputVariant = (typeof inputVariantOptions)[number]

export const validationBorderColors: Record<InputVariant, string> = {
    default: 'border-brutal',
    error: 'border-brutal-destructive',
    success: 'border-brutal-success',
}

export const inputVariantClasses: Record<InputVariant, string> = {
    default: validationBorderColors.default,
    error: `${validationBorderColors.error} focus:shadow-brutal-primary`,
    success: `${validationBorderColors.success} focus:shadow-brutal-secondary`,
}

export interface BaseInputProps {
    modelValue?: string
    disabled?: boolean
    readonly?: boolean
    placeholder?: string
    errorMessage?: string
}
