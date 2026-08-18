import { cva } from 'class-variance-authority'
import { brutalPress, brutalPressedStateOn } from '@/lib/brutal-interaction-variants'
import { formToggleForegroundColors, formToggleVariantColors } from '@/lib/form-toggle-base'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const toggleVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 text-sm font-black tracking-wide',
        'border-3 border-brutal rounded-brutal transition-all duration-150',
        FOCUS_RING_CLASSES,
        'disabled:pointer-events-none disabled:opacity-50',
        brutalPress,
    ],
    {
        variants: {
            variant: {
                default: [
                    'text-brutal-fg shadow-brutal-sm',
                    'data-[state=off]:hover:bg-brutal-muted data-[state=off]:hover:shadow-brutal data-[state=off]:hover:-translate-x-0.5 data-[state=off]:hover:-translate-y-0.5',
                    formToggleVariantColors.primary,
                    formToggleForegroundColors.primary,
                    brutalPressedStateOn,
                ],
                outline: [
                    'text-brutal-fg shadow-brutal-sm',
                    'data-[state=off]:hover:bg-brutal-muted data-[state=off]:hover:shadow-brutal data-[state=off]:hover:-translate-x-0.5 data-[state=off]:hover:-translate-y-0.5',
                    formToggleVariantColors.secondary,
                    'data-[state=off]:bg-transparent',
                    formToggleForegroundColors.secondary,
                    brutalPressedStateOn,
                ],
            },
            size: {
                default: 'h-10 px-3 min-w-10',
                sm: 'h-8 px-2 min-w-8 text-xs',
                lg: 'h-12 px-4 min-w-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
