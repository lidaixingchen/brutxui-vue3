import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const inputVariantOptions = ['default', 'error', 'success', 'inset'] as const

export type InputVariant = (typeof inputVariantOptions)[number]

export const validationBorderColors: Record<InputVariant, string> = {
    default: 'border-brutal',
    error: 'border-brutal-destructive',
    success: 'border-brutal-success',
    inset: 'border-brutal',
}

/** 外凸形态的聚焦反馈：阴影放大 + 微上浮（与凹槽形态互斥，故不进基座） */
const elevatedFocusFeedback =
    'focus-within:shadow-brutal-lg focus-within:-translate-x-0.5 focus-within:-translate-y-0.5'

/** 外凸形态共有的静态投影、悬浮上浮与盖影按压 */
const elevatedInteraction = `shadow-brutal ${brutalHoverLift} ${brutalPress}`

export const inputVariantClasses: Record<InputVariant, string> = {
    // default 无专属聚焦类：聚焦反馈由 elevatedFocusFeedback 统一提供
    default: [validationBorderColors.default, elevatedInteraction, elevatedFocusFeedback].join(' '),
    // 容器为 div（不可聚焦），聚焦反馈须用 focus-within:* 才会在内部 input 聚焦时命中；
    // 校验色聚焦阴影置于 elevatedFeedback 之后，twMerge 同组后者胜
    error: [validationBorderColors.error, elevatedInteraction, elevatedFocusFeedback, 'focus-within:shadow-brutal-primary'].join(' '),
    success: [validationBorderColors.success, elevatedInteraction, elevatedFocusFeedback, 'focus-within:shadow-brutal-secondary'].join(' '),
    /* 冲压凹槽：静态内嵌形态，刻意不含悬浮/按压/聚焦上浮反馈——
       凹槽的物理语义是「沉入外壳」，任何外浮反馈都与之矛盾；
       聚焦态显式声明保持凹槽阴影，R7 焦点环（基座）不受影响 */
    inset: [
        validationBorderColors.inset,
        'shadow-brutal-inset',
        'focus-within:shadow-brutal-inset',
    ].join(' '),
}
