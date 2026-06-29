import { cva } from 'class-variance-authority'

export const colorPickerTriggerVariants = cva(
    [
        'flex items-center gap-2 w-full',
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
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const colorPickerSwatchVariants = cva(
    [
        'inline-flex items-center justify-center',
        'border-2 border-brutal',
        'cursor-pointer',
        'transition-transform duration-100',
        'hover:scale-110',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
    ],
    {
        variants: {
            size: {
                sm: 'w-5 h-5',
                default: 'w-6 h-6',
                lg: 'w-8 h-8',
            },
            selected: {
                true: 'ring-2 ring-brutal-ring ring-offset-2 ring-offset-brutal-bg',
                false: '', // no-op: unselected uses base swatch style
            },
        },
        defaultVariants: {
            size: 'default',
            selected: false,
        },
    }
)

export const colorPickerPanelVariants = cva([
    'p-4',
    'border-3 border-brutal rounded-brutal',
    'bg-brutal-bg',
    'shadow-brutal-lg',
    'w-64',
])

export const colorPickerInputVariants = cva(
    [
        'w-full px-2 py-1 text-sm font-mono',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'shadow-brutal-sm',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brutal-ring',
    ]
)
