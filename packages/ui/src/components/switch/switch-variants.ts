import { cva } from 'class-variance-authority'
import { formToggleVariantColors } from '@/lib/form-toggle-base'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const switchRootVariants = cva(
    [
        'peer relative inline-flex shrink-0 cursor-pointer items-center',
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
            shape: {
                slider: 'rounded-brutal',
                rocker: 'rounded-brutal',
            },
            size: {
                sm: 'h-6 w-11',
                default: 'h-7.5 w-14',
                lg: 'h-9.5 w-18',
            },
        },
        defaultVariants: {
            variant: 'default',
            shape: 'slider',
            size: 'default',
        },
    }
)

export const switchThumbVariants = cva(
    [
        'pointer-events-none flex items-center justify-center',
        'bg-brutal-bg border-2 border-brutal rounded-brutal',
        'shadow-[1px_1px_0px_0px_var(--brutal-border-color,#000000)]',
        // 翘板吸合：bounce 缓动超调回弹，120ms 模拟工业磁吸继电器的干脆闭合
        'transition-transform duration-[120ms] ease-brutal-bounce',
    ],
    {
        variants: {
            shape: {
                slider: 'rounded-brutal',
                rocker: 'rounded-brutal',
            },
            size: {
                sm: 'size-3.5 data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]',
                default: 'size-5 data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-[2px]',
                lg: 'size-7 data-[state=checked]:translate-x-[34px] data-[state=unchecked]:translate-x-[2px]',
            },
        },
        defaultVariants: {
            shape: 'slider',
            size: 'default',
        },
    }
)

