import { cva } from 'class-variance-authority'
import { formToggleBaseClasses, formToggleVariantColors } from '@/lib/form-toggle-base'

// 各变体选中/不确定态的前景色：指示图标用 text-current 继承根元素文本色，
// 需显式声明与选中背景匹配的前景色（*-foreground），避免图标继承页面文本色造成对比度不足。
const CHECKED_FOREGROUND: Record<keyof typeof formToggleVariantColors, string> = {
    default: 'data-[state=checked]:text-brutal-success-foreground data-[state=indeterminate]:text-brutal-success-foreground',
    primary: 'data-[state=checked]:text-brutal-primary-foreground data-[state=indeterminate]:text-brutal-primary-foreground',
    secondary: 'data-[state=checked]:text-brutal-secondary-foreground data-[state=indeterminate]:text-brutal-secondary-foreground',
    accent: 'data-[state=checked]:text-brutal-accent-foreground data-[state=indeterminate]:text-brutal-accent-foreground',
    danger: 'data-[state=checked]:text-brutal-destructive-foreground data-[state=indeterminate]:text-brutal-destructive-foreground',
}

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
                default: `${formToggleVariantColors.default} ${CHECKED_FOREGROUND.default}`,
                primary: `${formToggleVariantColors.primary} ${CHECKED_FOREGROUND.primary}`,
                secondary: `${formToggleVariantColors.secondary} ${CHECKED_FOREGROUND.secondary}`,
                accent: `${formToggleVariantColors.accent} ${CHECKED_FOREGROUND.accent}`,
                danger: `${formToggleVariantColors.danger} ${CHECKED_FOREGROUND.danger}`,
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
