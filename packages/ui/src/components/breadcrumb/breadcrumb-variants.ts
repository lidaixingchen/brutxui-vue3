import { cva } from 'class-variance-authority'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const breadcrumbListVariants = cva(
    'list-none flex flex-wrap items-center gap-2.5 break-words text-sm font-medium text-brutal-fg sm:gap-4',
    {
        variants: {
            /* 档案插片形态：链接渲染为文件夹标签插片（等宽大写、底边开口形成插片感）。
               当前页由 BreadcrumbPage 独立组件渲染，保持实心高亮章形态不做插片化 */
            variant: {
                default: '',
                folder:
                    '[&_a]:font-mono [&_a]:uppercase [&_a]:tracking-widest [&_a]:text-xs [&_a]:border-3 [&_a]:border-b-transparent [&_a]:border-brutal [&_a]:bg-brutal-muted [&_a:hover]:bg-brutal-secondary-subtle [&_a]:shadow-none [&_a]:rounded-none [&_a]:px-3 [&_a]:py-1',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
)

export const breadcrumbItemVariants = cva(
    'list-none inline-flex items-center gap-1.5'
)

export const breadcrumbLinkVariants = cva(
    [
        'inline-flex items-center justify-center px-3 py-1',
        'border-3 border-brutal rounded-brutal bg-brutal-bg text-brutal-fg shadow-brutal',
        'font-semibold transition-[translate,box-shadow,background-color] hover:bg-brutal-secondary-subtle cursor-pointer',
        FOCUS_RING_CLASSES,
        brutalPress,
    ]
)

export const breadcrumbPageVariants = cva(
    'inline-flex items-center justify-center font-black text-brutal-fg bg-brutal-accent px-3 py-1 border-3 border-brutal rounded-brutal shadow-brutal-sm select-none'
)

export const breadcrumbSeparatorVariants = cva(
    'list-none [&>svg]:w-3.5 [&>svg]:h-3.5 font-bold text-brutal-fg/60'
)

export const breadcrumbEllipsisVariants = cva(
    // 折叠省略为纯展示指示（role=presentation），无交互态，故不含 hover/press 按钮化样式，
    // 避免视觉暗示可交互却无 role=button/键盘支持；如需可交互省略号请自行包裹 DropdownMenu 等
    'flex h-7 w-7 items-center justify-center border-3 border-brutal bg-brutal-bg text-brutal-fg shadow-brutal-sm rounded-brutal select-none'
)
