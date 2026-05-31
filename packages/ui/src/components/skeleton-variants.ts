import { cva } from 'class-variance-authority'

export const skeletonVariants = cva(
    ['animate-pulse', 'border-3 border-black dark:border-white'],
    {
        variants: {
            variant: {
                default: 'bg-gray-200 dark:bg-gray-800',
                primary: 'bg-[#FF6B6B]/30',
                secondary: 'bg-[#4ECDC4]/30',
                accent: 'bg-[#FFE66D]/30',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
