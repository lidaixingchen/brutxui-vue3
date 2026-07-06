import { cva } from 'class-variance-authority'
import { baseModalContentClasses, modalCloseButtonVariants } from '@/lib/modal-variants'
import { centeredModalAnimationClasses } from '@/lib/floating-animation-classes'

export const dialogContentVariants = cva(
    [
        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
        'w-full p-6',
        ...baseModalContentClasses,
        'text-brutal-fg',
        ...centeredModalAnimationClasses,
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
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const dialogCloseVariants = cva(modalCloseButtonVariants({ placement: 'dialog' }))
