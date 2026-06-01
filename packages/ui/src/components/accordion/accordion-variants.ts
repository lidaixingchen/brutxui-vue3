import { cva } from 'class-variance-authority'

export const accordionItemVariants = cva(
    [
        'border-3 border-brutal bg-brutal-bg text-brutal-fg',
        'transition-all duration-150',
    ],
    {
        variants: {
            variant: {
                default: 'shadow-brutal mb-4',
                flat: 'shadow-none mb-4',
                ghost: 'border-transparent shadow-none mb-2',
                interactive: [
                    'shadow-brutal mb-4',
                    'hover:shadow-brutal-lg hover:-translate-x-0.5 hover:-translate-y-0.5',
                ],
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)
