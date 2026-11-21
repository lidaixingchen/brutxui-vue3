import { cva } from 'class-variance-authority'
import { brutalHoverLiftSmStateOff, brutalPress, brutalPressedStateOn } from '@/lib/brutal-interaction-variants'
import { formToggleForegroundColors, formToggleVariantColors } from '@/lib/form-toggle-base'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const toggleVariants = cva(
    [
        'inline-flex max-w-full items-center justify-center gap-2 py-1 text-center text-sm font-black tracking-wide wrap-anywhere',
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
                    `data-[state=off]:hover:bg-brutal-muted ${brutalHoverLiftSmStateOff}`,
                    formToggleVariantColors.primary,
                    formToggleForegroundColors.primary,
                    brutalPressedStateOn,
                ],
                outline: [
                    'text-brutal-fg shadow-brutal-sm',
                    `data-[state=off]:hover:bg-brutal-muted ${brutalHoverLiftSmStateOff}`,
                    formToggleVariantColors.secondary,
                    'data-[state=off]:bg-transparent',
                    formToggleForegroundColors.secondary,
                    brutalPressedStateOn,
                ],
            },
            size: {
                default: 'min-h-10 px-3 min-w-10',
                sm: 'min-h-8 px-2 min-w-8 text-xs',
                lg: 'min-h-12 px-4 min-w-12',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
