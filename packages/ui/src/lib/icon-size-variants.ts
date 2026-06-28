import { cva, type VariantProps } from 'class-variance-authority'

export const iconSizeVariants = cva('', {
    variants: {
        size: {
            xs: 'h-2.5 w-2.5',
            sm: 'h-3 w-3',
            default: 'h-4 w-4',
            lg: 'h-5 w-5',
            xl: 'h-6 w-6',
            '2xl': 'h-8 w-8',
        },
    },
    defaultVariants: { size: 'default' },
})

export type IconSize = NonNullable<VariantProps<typeof iconSizeVariants>['size']>
