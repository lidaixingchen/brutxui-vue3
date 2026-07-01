import { cva } from 'class-variance-authority'
import { formToggleBaseClasses, formToggleVariantColors } from '@/lib/form-toggle-base'

export const switchRootVariants = cva(
    [
        'peer inline-flex shrink-0 cursor-pointer items-center',
        'rounded-brutal',
        ...formToggleBaseClasses,
    ],
    {
        variants: {
            variant: {
                default: `${formToggleVariantColors.default} data-[state=unchecked]:bg-brutal-bg`,
                primary: `${formToggleVariantColors.primary} data-[state=unchecked]:bg-brutal-bg`,
                secondary: `${formToggleVariantColors.secondary} data-[state=unchecked]:bg-brutal-bg`,
                accent: `${formToggleVariantColors.accent} data-[state=unchecked]:bg-brutal-bg`,
                danger: `${formToggleVariantColors.danger} data-[state=unchecked]:bg-brutal-bg`,
            },
            size: {
                sm: 'h-6 w-10',
                default: 'h-7 w-12',
                lg: 'h-9 w-16',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

export const switchThumbVariants = cva(
    [
        'pointer-events-none block bg-brutal-fg shadow-brutal-sm transition-transform duration-150 rounded-brutal',
    ],
    {
        variants: {
            size: {
                sm: 'h-4 w-4 data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]',
                default: 'h-5 w-5 data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]',
                lg: 'h-7 w-7 data-[state=checked]:translate-x-[28px] data-[state=unchecked]:translate-x-[2px]',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)
