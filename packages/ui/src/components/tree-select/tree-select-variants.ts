import { cva } from 'class-variance-authority'
import { brutalHoverLiftSm, brutalHoverLiftSmNoX } from '@/lib/brutal-interaction-variants'
import { treeNodeBaseClasses, treeSelectedClass } from '@/lib/tree-variants'

export const treeSelectTriggerVariants = cva(
    [
        'flex items-center justify-between w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg font-semibold',
        'transition-all duration-150',
        brutalHoverLiftSmNoX,
        'focus:outline-none focus:ring-2 focus:ring-brutal-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
    ],
    {
        variants: {
            size: {
                sm: 'h-8 px-2 text-xs',
                default: 'h-10 px-3 text-sm',
                lg: 'h-12 px-4 text-base',
            },
        },
        defaultVariants: {
            size: 'default',
        },
    }
)

export const treeSelectNodeVariants = cva(
    [
        ...treeNodeBaseClasses,
        `hover:border-brutal ${brutalHoverLiftSm}`,
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:shadow-none disabled:hover:translate-x-0 disabled:hover:translate-y-0',
    ],
    {
        variants: {
            selected: {
                true: treeSelectedClass,
                false: '', // no-op: unselected state
            },
        },
        defaultVariants: {
            selected: false,
        },
    }
)
