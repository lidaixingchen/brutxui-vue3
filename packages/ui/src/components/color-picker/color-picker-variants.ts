import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const colorPickerTriggerVariants = cva(
    [
        'flex items-center gap-2 w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        brutalPress,
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            size: {
                sm: 'h-9 px-3 text-sm',
                default: 'h-11 px-4 text-base',
                lg: 'h-14 px-5 text-lg',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const colorPickerSwatchVariants = cva(
    [
        'inline-flex items-center justify-center',
        'border-2 border-brutal',
        'cursor-pointer',
        'transition-transform duration-100',
        'hover:scale-110', /* 组件私有：特定缩放效果，不抽取 */
        'active:scale-95', /* 组件私有：特定缩放效果，不抽取 */
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100', /* 组件私有：禁用状态缩放重置，不抽取 */
    ],
    {
        variants: {
            size: {
                sm: 'w-5 h-5',
                default: 'w-6 h-6',
                lg: 'w-8 h-8',
            },
            selected: {
                true: 'ring-2 ring-brutal-ring ring-offset-2 ring-offset-brutal-bg',
                false: '', // no-op: unselected uses base swatch style
            },
        },
        defaultVariants: {
            size: 'default',
            selected: false,
        },
    }
)

export const colorPickerPanelVariants = cva([
    'p-4',
    'border-3 border-brutal rounded-brutal',
    'bg-brutal-bg',
    'shadow-brutal-lg',
    'w-64',
])

export const colorPickerInputVariants = cva(
    [
        'w-full px-2 py-1 text-sm font-mono',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring',
    ]
)
