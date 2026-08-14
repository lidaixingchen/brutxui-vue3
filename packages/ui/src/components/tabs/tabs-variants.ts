import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const tabsListVariants = cva(
    [
        'inline-flex justify-center p-1 gap-1',
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
                horizontal: 'items-center',
                vertical: 'flex-col items-stretch w-fit',
            },
        },
        compoundVariants: [
            { size: 'sm', orientation: 'horizontal', class: 'h-9' },
            { size: 'default', orientation: 'horizontal', class: 'h-11' },
            { size: 'lg', orientation: 'horizontal', class: 'h-14' },
        ],
        defaultVariants: {
            size: 'default',
            orientation: 'horizontal',
        },
    }
)

export const tabsTriggerVariants = cva(
    [
        'inline-flex items-center justify-center whitespace-nowrap px-3 h-full',
        'font-bold text-sm tracking-wide',
        'border-3 border-transparent',
        'rounded-brutal',
        'transition-all duration-150',
        FOCUS_RING_CLASSES,
        brutalPress,
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:border-brutal data-[state=active]:shadow-brutal-sm',
        'data-[state=inactive]:text-brutal-fg data-[state=inactive]:hover:bg-brutal-muted data-[state=inactive]:shadow-none',
        brutalHoverLift,
    ],
    {
        variants: {
            variant: {
                default: 'data-[state=active]:bg-brutal-primary data-[state=active]:text-brutal-primary-foreground',
                primary: 'data-[state=active]:bg-brutal-primary data-[state=active]:text-brutal-primary-foreground',
                secondary: 'data-[state=active]:bg-brutal-secondary data-[state=active]:text-brutal-secondary-foreground',
                accent: 'data-[state=active]:bg-brutal-accent data-[state=active]:text-brutal-accent-foreground',
                success: 'data-[state=active]:bg-brutal-success data-[state=active]:text-brutal-success-foreground',
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
        FOCUS_RING_CLASSES,
    ]
)
