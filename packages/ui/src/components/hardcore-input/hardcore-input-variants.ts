import { cva } from 'class-variance-authority'
import { validationBorderColors } from '../input/shared-input-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const hardcoreInputVariants = cva(
    [
        'w-full',
        'border-3',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'px-4 py-2',
        'font-bold',
        'transition-all duration-150',
        `${FOCUS_RING_CLASSES} focus-visible:shadow-brutal-lg`,
        'placeholder:text-brutal-placeholder placeholder:font-normal',
    ],
    {
        variants: {
            variant: validationBorderColors,
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const hardcoreInputFaceVariants = cva(
    [
        'inline-flex items-center justify-center',
        'border-3 border-brutal',
        'rounded-brutal',
        'w-10 h-10',
        'text-lg',
        'bg-brutal-accent',
        'transition-transform duration-300',
    ],
    {
        variants: {
            // 状态样式集中于此（背景/边框/文字色/动画），消费方通过 variant 表达状态，
            // 不再用 cn() 外部覆盖
            variant: {
                default: '',
                success: 'bg-brutal-success border-brutal-success',
                // 动画类（animate-bounce-short）依赖组件内 scoped 关键帧，由消费方在组件内应用，
                // 避免公共 variants 输出无全局样式支撑的类名
                error: 'bg-brutal-destructive border-brutal-destructive text-brutal-fg',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
