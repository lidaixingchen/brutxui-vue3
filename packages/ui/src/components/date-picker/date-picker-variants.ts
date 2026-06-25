import { cva } from 'class-variance-authority'

export const datePickerTriggerVariants = cva(
    [
        'flex items-center justify-between gap-2 w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'transition-all duration-150',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
    ],
    {
        variants: {
            size: {
                sm: 'h-9 px-3 text-sm',
                default: 'h-11 px-4 text-base',
                lg: 'h-14 px-5 text-lg',
            },
            variant: {
                default: '',
                error: 'border-brutal-destructive',
                success: 'border-brutal-success',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const datePickerPanelVariants = cva([
    'flex',
    'border-3 border-brutal rounded-brutal',
    'bg-brutal-bg',
    'shadow-brutal-lg',
])

export const datePickerShortcutVariants = cva(
    [
        'w-full px-3 py-2 text-left text-sm font-semibold',
        'text-brutal-fg',
        'cursor-pointer',
        'transition-all duration-100',
        'hover:bg-brutal-muted hover:-translate-x-0.5',
        'active:translate-y-[var(--brutal-pressed-offset,2px)]',
    ],
    {
        variants: {
            active: {
                true: 'bg-brutal-primary text-brutal-primary-foreground',
                false: '',
            },
        },
        defaultVariants: {
            active: false,
        },
    }
)

export const datePickerFooterVariants = cva([
    'flex items-center justify-end gap-2 p-3',
    'border-t-3 border-brutal',
])

export const timePickerVariants = cva([
    'w-12 h-9 text-center text-sm font-bold font-mono',
    'border-3 border-brutal rounded-brutal',
    'bg-brutal-bg text-brutal-fg',
    'shadow-brutal-sm',
    'transition-all duration-100',
    'hover:shadow-brutal',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring',
    'disabled:opacity-50 disabled:pointer-events-none',
])
