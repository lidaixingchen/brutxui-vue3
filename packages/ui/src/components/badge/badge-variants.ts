import { cva } from 'class-variance-authority'
import { chipBaseClasses, chipColorVariants } from '@/lib/chip-variants'

export const badgeVariants = cva(
    [
        ...chipBaseClasses,
        'font-bold tracking-wide',
        'transition-colors',
    ],
    {
        variants: {
            variant: {
                default: 'bg-brutal-bg text-brutal-fg shadow-brutal-sm',
                primary: `${chipColorVariants.primary} shadow-brutal-sm`,
                secondary: `${chipColorVariants.secondary} shadow-brutal-sm`,
                accent: `${chipColorVariants.accent} shadow-brutal-sm`,
                danger: 'bg-brutal-destructive text-brutal-destructive-foreground shadow-brutal-sm',
                success: 'bg-brutal-success text-brutal-success-foreground shadow-brutal-sm',
                outline: 'bg-transparent text-brutal-fg',
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
