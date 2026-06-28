import { cva } from 'class-variance-authority'

export const comboboxTriggerVariants = cva(
    [
        'w-full justify-between font-semibold',
    ],
    {
        variants: {
            hasValue: {
                true: '',
                false: 'text-brutal-muted-foreground',
            },
        },
        defaultVariants: {
            hasValue: false,
        },
    },
)

export const comboboxContentVariants = cva(
    [
        'w-[var(--reka-popover-trigger-width)] p-0',
    ],
)

export const comboboxCheckboxVariants = cva(
    [
        'mr-2 flex h-4 w-4 items-center justify-center',
        'border-3 border-brutal',
    ],
    {
        variants: {
            selected: {
                true: 'bg-brutal-secondary',
                false: 'bg-brutal-bg',
            },
        },
        defaultVariants: {
            selected: false,
        },
    },
)
