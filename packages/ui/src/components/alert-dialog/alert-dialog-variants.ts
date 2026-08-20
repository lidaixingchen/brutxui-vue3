import { cva } from 'class-variance-authority'
import { baseModalContentClasses } from '@/lib/modal-variants'
import { centeredModalAnimationClasses } from '@/lib/floating-animation-classes'

// 以下三个变体仅含静态类、未声明 variants/compoundVariants/defaultVariants，调用方恒以无参方式调用。
// 按全库惯例（dialog/sheet/modal 等镜像组件一致）保留 cva 函数形式以统一变体 API 表面，
// 勿据"可 cva 无参调用"误以为支持变体扩展；若确需变体请显式声明 variants。
export const alertDialogContentVariants = cva(
    [
        // grid 使 gap-4 生效：Header/Description/Footer 等子块在内容容器内形成间距（与 Dialog 的块级布局等价）
        'fixed left-[50%] top-[50%] z-dialog grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
        'p-6 text-brutal-fg',
        ...baseModalContentClasses,
        ...centeredModalAnimationClasses,
    ],
)

export const alertDialogTitleVariants = cva(
    [
        'text-lg font-black tracking-tight text-brutal-fg',
    ],
)

export const alertDialogDescriptionVariants = cva(
    [
        'text-sm text-brutal-muted-foreground font-medium',
    ],
)