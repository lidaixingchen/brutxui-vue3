import { cva } from 'class-variance-authority'
import { baseModalContentClasses } from '@/lib/modal-variants'

const SHEET_SIZE_CLASSES = 'h-full w-3/4 sm:max-w-sm'

export const sheetVariants = cva(
    [
        'fixed z-50 gap-4 p-6 text-brutal-fg transition ease-in-out',
        ...baseModalContentClasses,
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:duration-300 data-[state=open]:duration-500',
    ],
    {
        variants: {
            side: {
                top: 'inset-x-0 top-0 border-b-3 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
                bottom: 'inset-x-0 bottom-0 border-t-3 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
                left: `inset-y-0 left-0 ${SHEET_SIZE_CLASSES} border-r-3 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left`,
                right: `inset-y-0 right-0 ${SHEET_SIZE_CLASSES} border-l-3 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right`,
            },
        },
        defaultVariants: {
            side: 'right',
        },
    }
)