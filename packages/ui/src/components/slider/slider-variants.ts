import { cva } from 'class-variance-authority'
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants'

const sliderTrackSizeVariants = {
    sm: '[--slider-thickness:0.75rem]',
    default: '[--slider-thickness:1.25rem]',
    lg: '[--slider-thickness:1.75rem]',
}

export const sliderRootVariants = cva(
    ['relative flex touch-none select-none'],
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
        'shadow-brutal-sm',
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
        'block rounded-brutal',
        'border-3 border-brutal',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        brutalHoverLiftSmNoX,
        brutalPress,
        'cursor-grab active:cursor-grabbing', /* 组件私有：拖拽抓取状态语义，不抽取 */
    ],
    {
        variants: {
            size: {
                sm: 'h-4 w-4',
                default: 'h-6 w-6',
                lg: 'h-8 w-8',
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
