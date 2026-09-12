import { cva } from 'class-variance-authority'
import { brutalHoverLiftSm, brutalHoverLiftSmNoX } from '@/lib/brutal-interaction-variants'
import { treeNodeBaseClasses, treeNodeDisabledClass, treeNodeFocusedClass, treeNodeUnselectedClass } from '@/lib/tree-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

export const treeSelectTriggerVariants = cva(
    [
        'flex items-center justify-between w-full',
        'border-3 border-brutal rounded-brutal',
        'bg-brutal-bg text-brutal-fg font-semibold',
        'shadow-brutal',
        'transition-all duration-150',
        brutalHoverLiftSmNoX,
        FOCUS_RING_CLASSES,
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0',
    ],
    {
        variants: {
            size: {
                sm: 'h-9 px-3 text-sm',
                default: 'h-11 px-4 text-base',
                lg: 'h-14 px-5 text-lg',
            },
            disabled: {
                true: 'opacity-50 cursor-not-allowed shadow-none hover:shadow-none hover:translate-y-0 active:translate-x-0 active:translate-y-0 active:shadow-none',
                false: '',
            },
        },
        defaultVariants: {
            size: 'default',
            disabled: false,
        },
    }
)

export const treeSelectNodeVariants = cva(
    [
        ...treeNodeBaseClasses,
        'hover:border-brutal',
        brutalHoverLiftSm,
    ],
    {
        variants: {
            variant: {
                default: '',
                primary: '',
                secondary: '',
            },
            selected: {
                true: '',
                false: treeNodeUnselectedClass,
            },
            disabled: {
                true: treeNodeDisabledClass,
                false: '',
            },
            focused: {
                true: treeNodeFocusedClass,
                false: '',
            },
        },
        compoundVariants: [
            {
                variant: 'default',
                selected: true,
                disabled: false,
                class: 'bg-brutal-accent text-brutal-accent-foreground border-brutal shadow-brutal',
            },
            {
                variant: 'primary',
                selected: true,
                disabled: false,
                class: 'bg-brutal-primary text-brutal-primary-foreground border-brutal shadow-brutal',
            },
            {
                variant: 'secondary',
                selected: true,
                disabled: false,
                class: 'bg-brutal-secondary text-brutal-secondary-foreground border-brutal shadow-brutal',
            },
        ],
        defaultVariants: {
            variant: 'default',
            selected: false,
            disabled: false,
            focused: false,
        },
    }
)
