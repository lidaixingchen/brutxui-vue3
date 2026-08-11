export const inputVariantOptions = ['default', 'error', 'success'] as const

export type InputVariant = (typeof inputVariantOptions)[number]

export const validationBorderColors: Record<InputVariant, string> = {
    default: 'border-brutal',
    error: 'border-brutal-destructive',
    success: 'border-brutal-success',
}

export const inputVariantClasses: Record<InputVariant, string> = {
    // default 无额外聚焦类：聚焦反馈由 inputContainerVariants 基础类的 focus-within:* 统一提供
    default: validationBorderColors.default,
    // 容器为 div（不可聚焦），聚焦反馈须用 focus-within:* 才会在内部 input 聚焦时命中
    error: `${validationBorderColors.error} focus-within:shadow-brutal-primary`,
    success: `${validationBorderColors.success} focus-within:shadow-brutal-secondary`,
}
