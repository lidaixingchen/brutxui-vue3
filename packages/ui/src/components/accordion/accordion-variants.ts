import { cva } from 'class-variance-authority'
import { brutalPress, brutalHoverLiftSm } from '@/lib/brutal-interaction-variants'

// default 与 interactive 共享的布局/阴影类，避免后续修改 default 时遗漏 interactive 导致样式漂移。
// border-color 刻意不入 base：ghost 需用 border-transparent 覆盖，若 base 与变体各写一个
// border-color 类，最终生效颜色由 Tailwind 产物 CSS 排序决定而非类名顺序，覆盖不可靠。
const itemLiftClasses = [
    'mb-4',
    'data-[state=closed]:shadow-brutal-sm',
    'data-[state=open]:shadow-brutal',
    'data-[state=open]:-translate-x-0.5',
    'data-[state=open]:-translate-y-0.5',
]

export const accordionItemVariants = cva(
    [
        'border-3 bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: ['border-brutal', ...itemLiftClasses],
                flat: ['border-brutal', 'shadow-none mb-4'],
                ghost: ['border-transparent', 'shadow-none mb-2'],
                interactive: ['border-brutal', ...itemLiftClasses, brutalHoverLiftSm],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)

// 组件私有：trigger 垂直浮起带小投影，不抽取。
// 仅 default 变体使用：flat/ghost 语义为"平、无阴影"，hover 只变色不上浮；
// interactive 变体的 item 已通过 brutalHoverLiftSm 整体浮起，trigger 不再叠加位移，
// 避免父子同时上移造成"双重浮起"，并与 open 状态的位移叠加。
const triggerHoverLift = 'hover:shadow-brutal-sm hover:-translate-y-0.5'

export const accordionTriggerVariants = cva(
    [
        'flex flex-1 items-center justify-between py-4 px-6',
        'text-left font-black tracking-wide transition-all',
        'hover:bg-brutal-muted',
        brutalPress,
    ],
    {
        variants: {
            variant: {
                default: triggerHoverLift,
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
    'border-t-3 p-6 bg-brutal-bg text-brutal-fg',
    {
        variants: {
            variant: {
                default: 'border-brutal',
                flat: 'border-brutal bg-brutal-muted/30',
                ghost: 'border-transparent',
                interactive: 'border-brutal hover:bg-brutal-muted/20',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
