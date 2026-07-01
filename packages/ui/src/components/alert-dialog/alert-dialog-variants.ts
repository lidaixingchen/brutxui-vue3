import { cva } from 'class-variance-authority'
import { baseModalContentClasses } from '@/lib/modal-variants'

export const alertDialogContentVariants = cva(
    [
        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
        'p-6 text-brutal-fg',
        ...baseModalContentClasses,
        'duration-200',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
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