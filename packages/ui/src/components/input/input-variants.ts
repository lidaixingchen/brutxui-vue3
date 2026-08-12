import { cva } from 'class-variance-authority'
import { inputVariantClasses } from './shared-input-variants'
import { brutalPress, brutalHoverLift } from '@/lib/brutal-interaction-variants'

export const inputContainerVariants = cva(
    [
        'flex items-stretch overflow-hidden transition-all duration-150 bg-brutal-bg text-brutal-fg',
        'border-3 border-brutal rounded-brutal shadow-brutal',
        brutalHoverLift,
        brutalPress,
        'focus-within:outline-2 focus-within:outline-brutal-ring focus-within:outline-offset-2 focus-within:shadow-brutal-lg focus-within:-translate-x-0.5 focus-within:-translate-y-0.5'
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
