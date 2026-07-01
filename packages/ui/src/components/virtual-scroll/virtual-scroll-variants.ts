import { cva } from 'class-variance-authority'

/**
 * Variant configurations for VirtualScroll root container
 * Defines height constraints based on size prop
 */
export const virtualScrollRootVariants = cva(
    [
        'virtual-scroll-root',
        'relative overflow-auto',
    ],
    {
        variants: {
            size: {
                sm: 'max-h-64',
                default: 'max-h-96',
                lg: 'max-h-[32rem]',
                xl: 'max-h-[48rem]',
                full: 'max-h-full',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

/**
 * Variant configurations for VirtualScroll list items
 * Defines styling variations for different visual presentations
 */
export const virtualScrollItemVariants = cva(
    [
        'virtual-scroll-item',
        'flex items-center',
    ],
    {
        variants: {
            variant: {
                default: '',
                striped: '',
                bordered: 'border-b-2 border-brutal',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
)