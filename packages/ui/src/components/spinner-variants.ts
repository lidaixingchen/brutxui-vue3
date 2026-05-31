import { cva } from 'class-variance-authority'

export const spinnerVariants = cva(
    ['inline-block rounded-full', 'border-4 border-black dark:border-white', 'animate-spin'],
    {
        variants: {
            size: {
                sm: 'h-5 w-5 border-[3px]',
                default: 'h-8 w-8 border-4',
                lg: 'h-12 w-12 border-[5px]',
                xl: 'h-16 w-16 border-[6px]',
            },
            variant: {
                default: 'border-t-transparent border-r-transparent',
                primary: 'border-[#FF6B6B] border-t-transparent border-r-transparent',
                secondary: 'border-[#4ECDC4] border-t-transparent border-r-transparent',
                accent: 'border-[#FFE66D] border-t-[#000] border-r-[#000] dark:border-t-white dark:border-r-white',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export const blockSpinnerVariants = cva('grid grid-cols-2 gap-1', {
    variants: {
        size: {
            sm: 'h-5 w-5 gap-0.5',
            default: 'h-8 w-8 gap-1',
            lg: 'h-12 w-12 gap-1.5',
            xl: 'h-16 w-16 gap-2',
        },
    },
    defaultVariants: {
        size: 'default',
    },
})
