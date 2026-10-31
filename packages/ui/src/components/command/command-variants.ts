import { cva } from 'class-variance-authority'
import { collectionItemVariants } from '@/lib/collection-item-variants'

export const commandInputWrapperVariants = cva(
    [
        'flex h-12 items-center gap-3 px-4',
        'border-b-3 border-brutal',
        'bg-brutal-bg text-brutal-fg',
        // 容器为 div（不可聚焦），内层 input 聚焦须用 focus-within:* 才可见（与 input 容器同模式）
        'focus-within:ring-2 focus-within:ring-brutal-ring focus-within:ring-offset-2 focus-within:ring-offset-brutal-bg focus-within:outline-hidden',
    ]
)

export const commandItemVariants = cva(
    [
        'relative flex min-w-0 cursor-pointer items-center gap-3 px-3 py-2',
        'text-sm font-semibold',
        // Reka 管理列表导航，共享行样式读取其当前项与焦点呈现状态
        'select-none',
        'border-3 border-transparent',
        collectionItemVariants(),
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    ]
)
