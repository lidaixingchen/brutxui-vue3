import { cva } from 'class-variance-authority'
import { CLOSE_BUTTON_BASE_CLASSES } from '../../lib/modal-variants'

export const dialogContentVariants = cva(
    [
        'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
        'w-full p-6',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal-xl rounded-brutal',
        'duration-200',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
        'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
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

export const dialogCloseVariants = cva(
    [
        ...CLOSE_BUTTON_BASE_CLASSES,
        'absolute right-4 top-4',
        'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
    ]
)
