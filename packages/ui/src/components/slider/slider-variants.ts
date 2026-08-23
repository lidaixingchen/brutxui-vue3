import { cva, type VariantProps } from 'class-variance-authority'
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

const sliderTrackSizeVariants = {
    sm: '[--slider-thickness:0.75rem]',
    default: '[--slider-thickness:1.25rem]',
    lg: '[--slider-thickness:1.75rem]',
}

export const sliderRootVariants = cva(
    [
        'relative flex touch-none select-none',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
    ],
    {
        variants: {
            orientation: {
                horizontal: 'w-full items-center',
                vertical: 'flex-col h-full justify-center',
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
        },
    }
)

export const sliderTrackVariants = cva(
    [
        'relative grow overflow-visible rounded-brutal',
        'border-3 border-brutal bg-brutal-bg',
        // 轨道底槽内嵌凹槽：滑块深陷导轨内部的机械物理关系
        'shadow-brutal-inset',
    ],
    {
        variants: {
            size: sliderTrackSizeVariants,
            orientation: {
                horizontal: 'w-full h-[var(--slider-thickness,1.25rem)]',
                vertical: 'h-full w-[var(--slider-thickness,1.25rem)]',
            },
        },
        defaultVariants: {
            size: 'default',
            orientation: 'horizontal',
        },
    }
)

export const sliderThumbVariants = cva(
    [
        'flex items-center justify-center rounded-brutal',
        'border-3 border-brutal',
        'shadow-brutal-sm',
        'transition-colors duration-150',
        FOCUS_RING_CLASSES,
        'data-[disabled]:pointer-events-none',
        brutalHoverLiftSmNoX,
        brutalPress,
        'cursor-grab active:cursor-grabbing', /* 组件私有：拖拽抓取状态语义，不抽取 */
    ],
    {
        variants: {
            size: {
                sm: 'size-4.5',
                default: 'size-6',
                lg: 'size-8',
            },
            variant: {
                default: 'bg-brutal-accent',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const sliderThumbNotchVariants = cva(
    'pointer-events-none rounded-brutal bg-brutal-fg/70',
    {
        variants: {
            orientation: {
                horizontal: 'w-0.5',
                vertical: 'h-0.5',
            },
            size: {
                sm: '',
                default: '',
                lg: '',
            },
        },
        compoundVariants: [
            { orientation: 'horizontal', size: 'sm', class: 'h-2' },
            { orientation: 'horizontal', size: 'default', class: 'h-3' },
            { orientation: 'horizontal', size: 'lg', class: 'h-4' },
            { orientation: 'vertical', size: 'sm', class: 'w-2' },
            { orientation: 'vertical', size: 'default', class: 'w-3' },
            { orientation: 'vertical', size: 'lg', class: 'w-4' },
        ],
        defaultVariants: {
            orientation: 'horizontal',
            size: 'default',
        },
    }
)

export type SliderThumbNotchVariantProps = VariantProps<typeof sliderThumbNotchVariants>

export const sliderRangeVariants = cva(
    [
        'absolute',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-secondary',
                primary: 'bg-brutal-primary',
                secondary: 'bg-brutal-secondary',
                accent: 'bg-brutal-accent',
                success: 'bg-brutal-success',
            },
            orientation: {
                horizontal: 'h-full',
                vertical: 'w-full',
            },
        },
        defaultVariants: {
            variant: 'default',
            orientation: 'horizontal',
        },
    }
)

export const sliderMarkVariants = cva(
    ['absolute bg-brutal-fg/60 pointer-events-none'],
    {
        variants: {
            orientation: {
                horizontal: 'w-0.5 h-2',
                vertical: 'h-0.5 w-2',
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
        },
    }
)

export const sliderTooltipVariants = cva(
    [
        'absolute pointer-events-none z-10',
        'px-2 py-1 text-xs font-bold',
        'bg-brutal-fg text-brutal-bg',
        'border-3 border-brutal rounded-brutal',
        'shadow-brutal-sm whitespace-nowrap',
    ]
)
