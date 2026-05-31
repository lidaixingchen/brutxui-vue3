import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
    [
        'inline-flex items-center',
        'border-2 border-black dark:border-white',
        'font-bold tracking-wide',
        'transition-colors',
    ],
    {
        variants: {
            variant: {
                default: 'bg-white text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                primary: 'bg-[#FF6B6B] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                secondary: 'bg-[#4ECDC4] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                accent: 'bg-[#FFE66D] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                danger: 'bg-[#EF476F] text-white shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                success: 'bg-[#7FB069] text-black shadow-[2px_2px_0px_0px_#000000] dark:shadow-[2px_2px_0px_0px_#FFFFFF]',
                outline: 'bg-transparent text-black dark:text-white',
            },
            size: {
                sm: 'px-2 py-0.5 text-xs',
                default: 'px-3 py-1 text-sm',
                lg: 'px-4 py-1.5 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)
