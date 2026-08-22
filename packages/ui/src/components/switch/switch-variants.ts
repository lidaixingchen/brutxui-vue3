import { cva } from 'class-variance-authority'
import { formToggleVariantColors } from '@/lib/form-toggle-base'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const switchRootVariants = cva(
    [
        'peer inline-flex shrink-0 cursor-pointer items-center',
        'rounded-brutal',
        /* 轨道是冲压凹槽本体：刻意不走 formToggleBaseClasses 的外凸投影/悬浮/按压反馈
           （那是按钮语言，与「沉入外壳」的凹槽物理语义矛盾）；边框、过渡、焦点环、
           禁用处理仍与表单开关族保持一致。Checkbox/Radio/Toggle 的凹槽化不在本变体范围 */
        'border-3 border-brutal transition-all duration-150',
        'shadow-brutal-inset hover:shadow-brutal-inset active:shadow-brutal-inset',
        FOCUS_RING_CLASSES,
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:select-none',
    ],
    {
        variants: {
            variant: {
                default: formToggleVariantColors.default,
                primary: formToggleVariantColors.primary,
                secondary: formToggleVariantColors.secondary,
                accent: formToggleVariantColors.accent,
                danger: formToggleVariantColors.danger,
            },
            size: {
                sm: 'h-6 w-10',
                default: 'h-7 w-12',
                lg: 'h-9 w-16',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const switchThumbVariants = cva(
    [
        'pointer-events-none block bg-brutal-fg rounded-brutal',
        // 翘板吸合：bounce 缓动超调回弹，120ms 模拟工业磁吸继电器的干脆闭合
        'transition-transform duration-[120ms] ease-brutal-bounce',
        // 防滑凸棱：底色细线挖槽叠加在前景色滑块上（background-image 与 background-color 叠加）
        'bg-[image:repeating-linear-gradient(90deg,var(--brutal-bg,#ffffff)_0px,var(--brutal-bg,#ffffff)_2px,transparent_2px,transparent_6px)]',
    ],
    {
        variants: {
            size: {
                sm: 'h-4 w-4 data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]',
                default: 'h-5 w-5 data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]',
                lg: 'h-7 w-7 data-[state=checked]:translate-x-[28px] data-[state=unchecked]:translate-x-[2px]',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)
