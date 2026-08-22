import { brutalHoverLift, brutalPressStacked } from '@/lib/brutal-interaction-variants'

export const buttonVariantOptions = [
    'default',
    'primary',
    'secondary',
    'accent',
    'danger',
    'success',
    'outline',
    'ghost',
    'link',
] as const

/** 装饰形态维度：与色系变体正交可组合；none 为默认且不输出任何额外类 */
export const buttonFlairOptions = [
    'none',
    'stacked',
    'hazard',
    'ticket',
] as const

export const buttonSizeOptions = [
    'sm',
    'default',
    'lg',
    'xl',
    'icon',
] as const

export type ButtonVariant = (typeof buttonVariantOptions)[number]
export type ButtonSize = (typeof buttonSizeOptions)[number]
export type ButtonFlair = (typeof buttonFlairOptions)[number]

export const baseButtonVariants = {
    variants: {
        variant: {
            default: [
                'bg-brutal-bg text-brutal-fg',
                'shadow-brutal',
                brutalHoverLift,
            ],
            primary: [
                'bg-brutal-primary text-brutal-primary-foreground',
                'shadow-brutal',
                brutalHoverLift,
            ],
            secondary: [
                'bg-brutal-secondary text-brutal-secondary-foreground',
                'shadow-brutal',
                brutalHoverLift,
            ],
            accent: [
                'bg-brutal-accent text-brutal-accent-foreground',
                'shadow-brutal',
                brutalHoverLift,
            ],
            /* 键名沿用 danger（全库组件变体键惯例），样式映射 v0.9.0 重命名的 brutal-destructive token */
            danger: [
                'bg-brutal-destructive text-brutal-destructive-foreground',
                'shadow-brutal',
                brutalHoverLift,
            ],
            success: [
                'bg-brutal-success text-brutal-success-foreground',
                'shadow-brutal',
                brutalHoverLift,
            ],
            outline: [
                'bg-transparent text-brutal-fg',
                'shadow-brutal',
                'hover:bg-brutal-fg hover:text-brutal-bg', /* 组件私有：悬浮反色，不抽取 */
                brutalHoverLift,
            ],
            /* ghost/link 为低强调变体：刻意不引用 brutalHoverLift（位移+阴影），
               悬浮反馈仅用背景/下划线保持克制，与 outline 的悬浮反色+位移+阴影形成强度梯度 */
            ghost: [
                'bg-transparent text-brutal-fg border-transparent',
                'shadow-none',
                'hover:bg-brutal-muted hover:border-brutal', /* 组件私有：悬浮灰色背景，不抽取 */
            ],
            link: [
                'bg-transparent text-brutal-fg border-transparent',
                'shadow-none underline-offset-4',
                'hover:underline', /* 组件私有：悬浮下划线，不抽取 */
            ],
        },
        size: {
            sm: 'h-9 px-3 py-1 text-sm',
            default: 'h-11 px-5 py-2 text-base',
            lg: 'h-14 px-8 py-3 text-lg',
            xl: 'h-16 px-10 py-4 text-xl',
            icon: 'h-11 w-11 p-0',
        },
        flair: {
            none: '',
            stacked: [
                // 多层彩虹投影 + 同源 1.5x 盖影按压：twMerge 同组后者胜，
                // 覆盖基座 brutalPress 的 1x 位移，保证位移距离等于最外层阴影偏移
                'shadow-brutal-stacked',
                brutalPressStacked,
            ],
            hazard: [
                // 警戒斜纹自带黄黑底色语义，前景锁定 fg 保证纹理上可读
                'bg-pattern-hazard',
                'text-brutal-fg',
            ],
            ticket: [
                // 票据撕口：左右中缝半圆缺口（工具类经 prebuild:tokens 双端分发）
                'button-ticket-notch',
            ],
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        flair: 'none',
    } as const,
}
