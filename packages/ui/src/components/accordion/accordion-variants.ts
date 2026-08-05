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

// 组件私有：trigger 垂直浮起带小投影，不抽取。
// interactive 变体的 item 已通过 brutalHoverLiftSm 整体浮起，trigger 不再叠加位移，
// 避免父子同时上移造成"双重浮起"，并与 open 状态的位移叠加。
const triggerHoverLift = 'hover:bg-brutal-muted hover:shadow-brutal-sm hover:-translate-y-0.5'

export const accordionTriggerVariants = cva(
    [
        'flex flex-1 items-center justify-between py-4 px-6',
        'text-left font-black tracking-wide transition-all',
        brutalPress,
    ],
    {
        variants: {
            variant: {
                default: triggerHoverLift,
                flat: triggerHoverLift,
                ghost: triggerHoverLift,
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
