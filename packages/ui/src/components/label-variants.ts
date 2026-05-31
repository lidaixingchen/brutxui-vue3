import { cva } from 'class-variance-authority'

export const labelVariants = cva(
    [
        'text-sm font-bold tracking-wide leading-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    ],
    {
        variants: {
            variant: {
                default: 'text-black dark:text-white',
                error: 'text-[#EF476F]',
                success: 'text-[#7FB069]',
                muted: 'text-gray-500 dark:text-gray-400',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
