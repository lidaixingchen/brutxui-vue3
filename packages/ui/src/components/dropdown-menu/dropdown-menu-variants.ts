import { cva } from 'class-variance-authority'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import { collectionItemVariants } from '@/lib/collection-item-variants'

const dropdownMenuContentBaseStyles = [
    'z-dropdown min-w-[8rem] max-h-[var(--reka-dropdown-menu-content-available-height)] overflow-x-hidden overflow-y-auto p-1',
    ...brutalFloatingSurfaceClasses,
    ...floatingContentAnimationClasses,
]

export const dropdownMenuContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuSubContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuItemVariants = cva(
    [
        'relative flex cursor-pointer select-none items-center px-3 py-2',
        'font-bold rounded-brutal',
        collectionItemVariants({ variant: 'default' }),
    ],
    {
        variants: {
            tone: {
                default: '',
                danger: collectionItemVariants({ variant: 'danger' }),
            },
            inset: {
                true: 'pl-8',
                false: '',
            },
        },
        defaultVariants: {
            inset: false,
            tone: 'default',
        },
    }
)
