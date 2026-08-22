import { cva } from 'class-variance-authority'
import { brutalHoverLiftSmNoX, brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const paginationVariants = cva('flex items-center justify-center', {
    variants: {
        variant: {
            default: '',
            rounded: '[&_button]:rounded-brutal',
            minimal: '[&_button]:border-transparent [&_button]:shadow-none',
        },
        size: {
            sm: 'gap-1',
            default: 'gap-2',
            lg: 'gap-3',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
})

export const paginationButtonVariants = cva(
    [
        'inline-flex items-center justify-center font-black',
        'border-3 border-brutal',
        'transition-all duration-150',
        FOCUS_RING_CLASSES,
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-none disabled:transform-none disabled:shadow-none',
    ],
    {
        variants: {
            size: {
                sm: 'h-8 min-w-8 text-sm px-2',
                default: 'h-10 min-w-10 text-base px-3',
                lg: 'h-12 min-w-12 text-lg px-4',
            },
            isActive: {
                true: [
                    'bg-brutal-primary text-brutal-primary-foreground',
                    /* 打卡机卡片槽：激活页向上微突并以双重粗边框锁定 */
                    'shadow-brutal-sm -translate-y-0.5 border-4 border-double border-brutal',
                    brutalPress,
                ],
                false: [
                    'bg-brutal-bg text-brutal-fg',
                    'shadow-brutal-sm',
                    'hover:bg-brutal-muted',
                    brutalHoverLiftSmNoX,
                    brutalPress,
                ],
            },
        },
        defaultVariants: {
            size: 'default',
            isActive: false,
        },
    }
)
