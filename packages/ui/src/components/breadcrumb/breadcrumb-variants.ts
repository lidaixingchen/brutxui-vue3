import { cva } from 'class-variance-authority'
import { brutalPress } from '@/lib/brutal-interaction-variants'

export const breadcrumbListVariants = cva(
    'list-none flex flex-wrap items-center gap-2.5 break-words text-sm font-medium text-brutal-fg sm:gap-4'
)

export const breadcrumbItemVariants = cva(
    'list-none inline-flex items-center gap-1.5'
)

export const breadcrumbLinkVariants = cva(
    [
        'font-semibold transition-colors hover:text-brutal-primary hover:underline hover:shadow-brutal-sm hover:-translate-y-0.5 cursor-pointer', /* 组件私有：面包屑项悬浮下划线及浮起效果，不抽取 */
        brutalPress,
    ]
)

export const breadcrumbPageVariants = cva(
    'font-black text-brutal-fg bg-brutal-accent px-2 py-0.5 border-3 border-brutal rounded-brutal shadow-brutal-sm select-none'
)

export const breadcrumbSeparatorVariants = cva(
    'list-none [&>svg]:w-3.5 [&>svg]:h-3.5 font-bold text-brutal-fg/60'
)

export const breadcrumbEllipsisVariants = cva(
    [
        'flex h-7 w-7 items-center justify-center border-3 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm rounded-brutal transition-all hover:bg-brutal-muted select-none', /* 组件私有：面包屑操作按钮悬浮背景，不抽取 */
        brutalPress,
    ]
)
