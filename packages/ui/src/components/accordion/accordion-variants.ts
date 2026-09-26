import { cva } from 'class-variance-authority'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

const itemShadowClasses = [
    'mb-4',
    'data-[state=closed]:shadow-brutal-sm',
    'data-[state=open]:shadow-brutal',
]

export const accordionItemVariants = cva(
    [
        'border-3 bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: ['border-brutal', ...itemShadowClasses],
                flat: ['border-brutal', 'shadow-none mb-4'],
                ghost: ['border-transparent', 'shadow-none mb-2'],
                interactive: ['border-brutal', ...itemShadowClasses, 'hover:shadow-brutal'],
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
        'text-left font-black tracking-wide transition-colors',
        'hover:bg-brutal-muted',
        FOCUS_RING_CLASSES,
    ],
    {
        variants: {
            variant: {
                default: '',
                flat: '',
                ghost: '',
                interactive: '',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

// 组件私有：trigger 图标外观（边框/背景/阴影），与 iconSizeVariants（尺寸）组合使用。
// 与 item/content 的样式定义保持同一维护入口。
export const accordionTriggerIconClasses =
    'shrink-0 transition-transform duration-200 border-3 border-brutal rounded-brutal bg-brutal-bg p-0.5 shadow-brutal-sm'

export const accordionContentVariants = cva(
    'border-t-3 p-6 text-brutal-fg',
    {
        variants: {
            variant: {
                /* 展开内容应用 muted 次级背景：与收起态的 bg-brutal-bg 形成明暗分层 */
                default: 'border-brutal bg-brutal-muted',
                flat: 'border-brutal bg-brutal-muted/30',
                ghost: 'border-transparent',
                interactive: 'border-brutal bg-brutal-muted hover:bg-brutal-muted/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
