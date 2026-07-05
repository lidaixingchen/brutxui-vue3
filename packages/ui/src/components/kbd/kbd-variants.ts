import { cva } from 'class-variance-authority'
import { chipBaseClasses, chipColorVariants } from '@/lib/chip-variants'

export const kbdVariants = cva(
    [
        ...chipBaseClasses,
        'justify-center',
        'font-mono font-black',
        'shadow-brutal-sm',
        'select-none whitespace-nowrap',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-muted text-brutal-fg',
                primary: chipColorVariants.primary,
                secondary: chipColorVariants.secondary,
                accent: chipColorVariants.accent,
            },
            size: {
                sm: 'px-1.5 py-0.5 text-xs min-w-[1.25rem]',
                md: 'px-2 py-1 text-sm min-w-[1.75rem]',
                lg: 'px-3 py-1.5 text-base min-w-[2.25rem]',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
)
