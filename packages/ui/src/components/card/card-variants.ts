import { cva } from 'class-variance-authority'
import { brutalHoverLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const cardVariants = cva(
    [
        'border-3 border-brutal',
        'rounded-brutal',
        'bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: 'shadow-brutal',
                elevated: 'shadow-brutal-lg',
                flat: 'shadow-none',
                interactive: [
                    'shadow-brutal',
                    brutalHoverLift,
                    brutalPress,
                    'cursor-pointer',
                ],
                primary: 'shadow-brutal-primary border-[var(--brutal-primary)]',
                secondary: 'shadow-brutal-secondary border-[var(--brutal-secondary)]',
            },
            padding: {
                none: 'p-0',
                sm: 'p-3',
                default: 'p-5',
                lg: 'p-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            padding: 'default',
        },
    }
)
