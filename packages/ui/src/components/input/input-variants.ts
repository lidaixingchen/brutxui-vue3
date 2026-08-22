import { cva } from 'class-variance-authority'
import { inputVariantClasses } from './shared-input-variants'

export const inputContainerVariants = cva(
    [
        'flex items-stretch overflow-hidden transition-all duration-150 bg-brutal-bg text-brutal-fg',
        'border-3 border-brutal rounded-brutal',
        // R7 焦点指示环（容器为 div，须用 focus-within 命中内部 input 聚焦）
        'focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 focus-within:ring-offset-brutal-bg focus-within:outline-hidden',
    ],
    {
        variants: {
            variant: inputVariantClasses,
            size: {
                sm: 'h-9 text-sm',
                default: 'h-11 text-base',
                lg: 'h-14 text-lg',
            },
            disabled: {
                true: 'cursor-not-allowed opacity-50 bg-brutal-muted',
                false: '',
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
            disabled: false,
        }
    }
)

export const inputVariants = cva(
    [
        // 内层 input 抑制 UA 焦点环：焦点指示由 inputContainerVariants 的 focus-within:* 统一提供（C1 豁免）
        'w-full h-full bg-transparent border-0 outline-none focus:outline-none text-current',
        'font-medium placeholder:text-brutal-placeholder placeholder:font-normal',
        'disabled:cursor-not-allowed'
    ]
)
