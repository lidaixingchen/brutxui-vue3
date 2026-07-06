import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalHoverLiftSm, brutalPress } from '@/lib/brutal-interaction-variants'

export const overlayVariants = cva([
    'fixed inset-0 z-50 bg-brutal-overlay',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
])

export const sectionHeaderVariants = cva([
    'flex flex-col space-y-2 pb-4 border-b-3 border-brutal',
])

export const sectionFooterVariants = cva([
    'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-4 border-t-3 border-brutal',
])

export const CLOSE_BUTTON_BASE_CLASSES = [
    'h-8 w-8 flex items-center justify-center',
    'border-3 border-brutal bg-brutal-bg text-brutal-fg',
    'shadow-brutal-sm',
    'transition-all duration-150',
    'hover:bg-brutal-destructive hover:text-brutal-fg',
    brutalPress,
    'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
]

export const modalCloseButtonVariants = cva(CLOSE_BUTTON_BASE_CLASSES, {
    variants: {
        placement: {
            dialog: 'absolute right-4 top-4',
            'sheet-left': 'absolute left-4 top-4',
            'sheet-right': 'absolute right-4 top-4',
        },
        motion: {
            default: brutalHoverLift,
            sm: brutalHoverLiftSm,
        },
    },
    defaultVariants: {
        placement: 'dialog',
        motion: 'default',
    },
})

export const baseModalContentClasses = [
    'bg-brutal-bg',
    'border-3 border-brutal',
    'shadow-brutal-xl',
    'rounded-brutal',
]
