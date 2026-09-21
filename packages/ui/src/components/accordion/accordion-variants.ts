import { cva } from 'class-variance-authority'
import { brutalHoverLiftSm } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

// default 与 interactive 共享的布局/阴影类，避免后续修改 default 时遗漏 interactive 导致样式漂移。
// 开合保持位置稳定，不增加额外位移。
const itemBaseClasses = [
    'mb-4',
    'shadow-brutal-sm',
]

export const accordionItemVariants = cva(
    [
        'border-3 bg-brutal-bg text-brutal-fg rounded-brutal overflow-hidden',
        'transition-all duration-150 motion-reduce:transition-none',
    ],
    {
        variants: {
            variant: {
                default: ['border-brutal', ...itemBaseClasses],
                flat: ['border-brutal', 'shadow-none mb-4'],
                ghost: ['border-transparent', 'shadow-none mb-2'],
                interactive: ['border-brutal', ...itemBaseClasses, brutalHoverLiftSm],
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
        'text-left font-bold tracking-tight leading-snug transition-all duration-150 motion-reduce:transition-none',
        'border-b-3 border-transparent',
        'bg-brutal-bg text-brutal-fg hover:bg-brutal-muted',
        FOCUS_RING_CLASSES,
    ],
    {
        variants: {
            variant: {
                default: [
                    'data-[state=open]:bg-brutal-primary data-[state=open]:text-brutal-primary-foreground',
                    'data-[state=open]:border-brutal',
                ],
                flat: [
                    'data-[state=open]:bg-brutal-muted data-[state=open]:text-brutal-fg',
                    'data-[state=open]:border-brutal',
                ],
                ghost: [
                    'data-[state=open]:bg-brutal-muted data-[state=open]:text-brutal-fg',
                    'data-[state=open]:border-transparent',
                ],
                interactive: [
                    'data-[state=open]:bg-brutal-primary data-[state=open]:text-brutal-primary-foreground',
                    'data-[state=open]:border-brutal',
                ],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

// Trigger 图标外观：基于状态旋转与平滑过渡，内置减弱动画适配
export const accordionTriggerIconClasses =
    'shrink-0 transition-transform duration-200 motion-reduce:transition-none'

export const accordionContentVariants = cva(
    'p-6 text-brutal-fg',
    {
        variants: {
            variant: {
                /* 展开内容应用 muted 次级背景：与收起态的 bg-brutal-bg 形成明暗分层 */
                default: 'bg-brutal-muted',
                flat: 'bg-brutal-muted/30',
                ghost: '',
                interactive: 'bg-brutal-muted hover:bg-brutal-muted/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
