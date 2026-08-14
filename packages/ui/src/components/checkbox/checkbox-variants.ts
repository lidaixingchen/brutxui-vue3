import { cva } from 'class-variance-authority'
import { formToggleBaseClasses, formToggleForegroundColors, formToggleVariantColors } from '@/lib/form-toggle-base'

// 设计决策：未选中态刻意保持中性（统一 bg-brutal-bg + border-brutal），五个变体视觉一致，
// 变体差异仅在选中/不确定态的背景色上体现 —— 与 formToggleBaseClasses 的「未选中态统一背景」意图一致。
export const checkboxVariants = cva(
    [
        'peer shrink-0',
        'bg-brutal-bg',
        'flex items-center justify-center',
        ...formToggleBaseClasses,
    ],
    {
        variants: {
            variant: {
                default: `${formToggleVariantColors.default} ${formToggleForegroundColors.default}`,
                primary: `${formToggleVariantColors.primary} ${formToggleForegroundColors.primary}`,
                secondary: `${formToggleVariantColors.secondary} ${formToggleForegroundColors.secondary}`,
                accent: `${formToggleVariantColors.accent} ${formToggleForegroundColors.accent}`,
                danger: `${formToggleVariantColors.danger} ${formToggleForegroundColors.danger}`,
            },
            size: {
                sm: 'h-5 w-5',
                default: 'h-6 w-6',
                lg: 'h-7 w-7',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const checkboxIndicatorVariants = cva(
    [
        'flex items-center justify-center text-current',
        'stroke-[3]',
    ]
)
