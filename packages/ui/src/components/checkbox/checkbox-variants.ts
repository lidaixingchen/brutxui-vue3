import { cva } from 'class-variance-authority'
import { formToggleBaseClasses, formToggleVariantColors } from '@/lib/form-toggle-base'

export const checkboxVariants = cva(
    [
        'peer shrink-0',
        'bg-brutal-bg',
        'flex items-center justify-center',
        ...formToggleBaseClasses,
    ],
    {
        variants: {
            variant: {
                default: formToggleVariantColors.default,
                primary: formToggleVariantColors.primary,
                secondary: formToggleVariantColors.secondary,
                accent: formToggleVariantColors.accent,
                danger: formToggleVariantColors.danger,
            },
            size: {
                sm: 'h-5 w-5',
                default: 'h-6 w-6',
                lg: 'h-7 w-7',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const checkboxIndicatorVariants = cva(
    [
        'flex items-center justify-center text-current',
        'stroke-[3]',
    ]
)
