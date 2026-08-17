import { cva } from 'class-variance-authority'

/**
 * Variant configurations for VirtualScroll root container
 * Defines height constraints based on size prop
 */
export const virtualScrollRootVariants = cva(
    [
        'virtual-scroll-root',
        'relative overflow-auto',
    ],
    {
        variants: {
            size: {
                sm: 'max-h-64',
                default: 'max-h-96',
                lg: 'max-h-[32rem]',
                xl: 'max-h-[48rem]',
                // full 模式依赖父容器具有确定高度约束（如 h-screen/h-96）
                full: 'max-h-full',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

/**
 * Variant configurations for VirtualScroll list items
 * Defines styling variations for different visual presentations
 */
export const virtualScrollItemVariants = cva(
    [
        'virtual-scroll-item',
        'flex items-center',
    ],
    {
        variants: {
            variant: {
                default: '',
                // striped 变体背景由组件根据 virtualRow.index % 2 === 1 动态附加 bg-brutal-muted/50
                striped: '',
                bordered: 'border-b-3 border-brutal',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)