import { cva } from 'class-variance-authority'
import { baseModalContentClasses } from '@/lib/modal-variants'
import { centeredModalAnimationClasses } from '@/lib/floating-animation-classes'

export const alertDialogContentVariants = cva(
    [
        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
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