import { cva } from 'class-variance-authority'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { validationBorderColors } from '../input/shared-input-variants'

export const numberInputRootVariants = cva(
    [
        'flex items-stretch border-3 border-brutal bg-brutal-bg rounded-brutal shadow-brutal overflow-hidden',
        'transition-all duration-150',
        'focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 focus-within:ring-offset-brutal-bg focus-within:outline-hidden focus-within:shadow-brutal-lg',
    ],
    {
        variants: {
            layout: {
                split: '',
                stacked: '',
            },
            variant: {
                default: '',
                error: `${validationBorderColors.error} focus-within:ring-brutal-destructive`,
                success: `${validationBorderColors.success} focus-within:ring-brutal-success`,
            },
        },
        defaultVariants: {
            layout: 'split',
            variant: 'default',
        },
    }
)

export const numberInputButtonVariants = cva(
    [
        'flex items-center justify-center',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
        brutalPress,
        'hover:shadow-brutal-sm hover:-translate-y-0.5',
        /* 3D 机械键帽：底边加厚形成侧面厚度（border-brutal 深色描边自带反差），
           按压时消除侧面完成「按下」物理隐喻；与 Kbd 键帽语言同源。
           active:translate-x-0 显式中和 brutalPress 的 X 轴盖影位移——键帽按压是纯垂直下沉，
           依赖 twMerge 后置胜出属隐式行为，此处显式声明意图 */
        'border-b-4',
        'active:border-b-0 active:translate-y-1 active:translate-x-0',
    ],
    {
        variants: {
            position: {
                decrement: 'bg-brutal-accent hover:bg-brutal-muted',
                increment: 'bg-brutal-primary hover:bg-brutal-muted',
            },
            layout: {
                split: 'px-4 border-brutal',
                stacked: 'flex-1 border-brutal',
            },
        },
        compoundVariants: [
            { position: 'decrement', layout: 'split', class: 'border-r-3' },
            { position: 'increment', layout: 'split', class: 'border-l-3' },
            { position: 'decrement', layout: 'stacked', class: 'border-t-3' },
        ],
        defaultVariants: {
            position: 'decrement',
            layout: 'split',
        },
    }
)

export const numberInputFieldVariants = cva(
    [
        'bg-transparent font-black placeholder:text-brutal-placeholder placeholder:font-normal focus:outline-none',
    ],
    {
        variants: {
            layout: {
                split: 'flex-1 min-w-0 text-center py-2 px-3 text-base',
                stacked: 'flex-1 min-w-0 py-2 px-4 text-base',
            },
        },
        defaultVariants: {
            layout: 'split',
        },
    }
)
