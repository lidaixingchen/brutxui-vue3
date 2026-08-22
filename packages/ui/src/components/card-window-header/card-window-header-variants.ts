import { cva } from 'class-variance-authority'

/** 工控窗口顶栏容器：muted 底 + 实体粗线与卡身分隔 */
export const cardWindowHeaderVariants = cva(
    [
        'flex items-center justify-between gap-3',
        'border-b-3 border-brutal',
        'bg-brutal-muted',
        'px-4 py-2',
    ],
    {
        variants: {},
        defaultVariants: {},
    },
)

/** 三色微型指示方块组（红黄绿，语义令牌着色）：纯装饰层，由组件打 aria-hidden */
export const cardWindowHeaderLampVariants = cva(['size-3 border-2 border-brutal'], {
    variants: {},
    defaultVariants: {},
})
