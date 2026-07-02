import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const datePickerTriggerVariants = cva(
    [
        'flex items-center justify-between gap-2 w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLift,
        brutalPress,
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
                default: '', // no-op: default border style (base classes)
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
                false: '', // no-op: inactive state
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

export const timePickerPanelVariants = cva(
    ['items-center gap-1 p-2 border-brutal'],
    {
        variants: {
            embedded: {
                true: 'flex border-t-3',
                false: 'inline-flex border-3 rounded-brutal bg-brutal-bg shadow-brutal-lg',
            },
        },
        defaultVariants: {
            embedded: false,
        },
    }
)

export const timePickerTriggerVariants = cva([
    'w-12 px-0 justify-center gap-0.5 font-mono text-sm rounded-brutal shadow-brutal-sm',
    'hover:shadow-brutal',
])
