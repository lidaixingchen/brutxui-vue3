import { cva } from 'class-variance-authority'
import { baseModalContentClasses, modalCloseButtonVariants } from '@/lib/modal-variants'
import { fadeZoomAnimationClasses } from '@/lib/floating-animation-classes'

export const dialogContentVariants = cva(
    [
        'fixed left-[50%] top-[50%] z-dialog translate-x-[-50%] translate-y-[-50%]',
        'w-full p-6',
        ...baseModalContentClasses,
        'text-brutal-fg',
    ],
    {
        variants: {
            size: {
                sm: 'max-w-sm',
                default: 'max-w-lg',
                lg: 'max-w-2xl',
                xl: 'max-w-4xl',
                full: 'max-w-[calc(100vw-2rem)]',
            },
            /* 入场动效形态：fade-zoom 流体淡入（默认）/ shutter 百叶窗机械展开 */
            entrance: {
                'fade-zoom': [
                    'data-[state=open]:animate-in data-[state=closed]:animate-out',
                    'duration-200',
                    ...fadeZoomAnimationClasses,
                ],
                shutter: [
                    // 百叶窗入场经 styles.css 转义选择器实现（手写 utilities 类不带变体修饰符）；
                    // 退场沿用 animate-out 体系保持关闭反馈一致
                    'data-[state=closed]:animate-out duration-150',
                    'data-[state=open]:animate-brutal-shutter',
                ],
            },
        },
        defaultVariants: {
            size: 'default',
            entrance: 'fade-zoom',
        },
    }
)

// 直接复用 modalCloseButtonVariants（默认 placement='dialog'），
// 去掉冗余的 cva 包裹层，保留底层 placement/motion 变体能力
export const dialogCloseVariants = modalCloseButtonVariants
