import { cva } from 'class-variance-authority'
import { brutalPress, brutalHoverLiftSm } from '@/lib/brutal-interaction-variants'

export const accordionItemVariants = cva(
    [
        'border-3 border-brutal bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: [
                    'mb-4',
                    'data-[state=closed]:shadow-brutal-sm',
                    'data-[state=open]:shadow-brutal data-[state=open]:-translate-x-0.5 data-[state=open]:-translate-y-0.5',
                ],
                flat: 'shadow-none mb-4',
                ghost: 'border-transparent shadow-none mb-2',
                interactive: [
                    'mb-4',
                    'data-[state=closed]:shadow-brutal-sm',
                    'data-[state=open]:shadow-brutal data-[state=open]:-translate-x-0.5 data-[state=open]:-translate-y-0.5',
                    brutalHoverLiftSm,
                ],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const accordionTriggerVariants = cva(
    [
        'flex flex-1 items-center justify-between py-4 px-6',
        'text-left font-black tracking-wide transition-all',
        brutalPress,
        'hover:shadow-brutal-sm hover:-translate-y-0.5', /* 组件私有：垂直浮起带小投影，不抽取 */
    ],
    {
        variants: {
            variant: {
                default: 'hover:bg-brutal-muted',
                flat: 'hover:bg-brutal-muted',
                ghost: 'hover:bg-brutal-muted',
                interactive: 'hover:bg-brutal-muted',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

export const accordionContentVariants = cva(
    'border-t-3 border-brutal p-6 bg-brutal-bg text-brutal-fg',
    {
        variants: {
            variant: {
                default: '',
                flat: 'bg-brutal-muted/30',
                ghost: 'border-transparent',
                interactive: 'hover:bg-brutal-muted/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
