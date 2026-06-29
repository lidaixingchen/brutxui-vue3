import { cva } from 'class-variance-authority'

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
    'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
    'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
]
