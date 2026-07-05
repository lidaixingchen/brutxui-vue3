import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const tabsListVariants = cva(
    [
        'inline-flex items-center justify-center p-1 gap-1',
        'bg-brutal-bg border-3 border-brutal shadow-brutal rounded-brutal',
    ],
    {
        variants: {
            size: {
                sm: '',
                default: '',
                lg: '',
            },
            orientation: {
                horizontal: '',
                vertical: 'flex-col',
            },
        },
        compoundVariants: [
            { size: 'sm', orientation: 'horizontal', class: 'h-9' },
            { size: 'default', orientation: 'horizontal', class: 'h-12' },
            { size: 'lg', orientation: 'horizontal', class: 'h-14' },
            { size: 'sm', orientation: 'vertical', class: 'w-9' },
            { size: 'default', orientation: 'vertical', class: 'w-12' },
            { size: 'lg', orientation: 'vertical', class: 'w-14' },
        ],
        defaultVariants: {
            size: 'default',
            orientation: 'horizontal',
        },
    }
)

export const tabsTriggerVariants = cva(
    [
        'inline-flex items-center justify-center whitespace-nowrap px-4 py-2',
        'font-bold text-sm tracking-wide',
        'border-3 border-transparent',
        'rounded-brutal',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
        brutalPress,
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-brutal-fg data-[state=active]:border-brutal data-[state=active]:shadow-brutal-sm',
        'data-[state=inactive]:hover:bg-brutal-muted data-[state=inactive]:shadow-none', /* 组件私有：未激活标签悬停样式，不抽取 */
        brutalHoverLift,
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=active]:bg-brutal-accent',
                primary: 'data-[state=active]:bg-brutal-primary',
                secondary: 'data-[state=active]:bg-brutal-secondary',
                success: 'data-[state=active]:bg-brutal-success',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const tabsContentVariants = cva(
    [
        'mt-3 p-4',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring focus-visible:ring-offset-2',
    ]
)
