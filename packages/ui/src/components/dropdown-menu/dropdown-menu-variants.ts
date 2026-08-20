import { cva } from 'class-variance-authority'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'
import { FOCUS_RING_CLASSES } from '@/lib/utils'

const dropdownMenuContentBaseStyles = [
    'z-dropdown min-w-[8rem] overflow-hidden p-1',
    ...brutalFloatingSurfaceClasses,
    ...floatingContentAnimationClasses,
]

export const dropdownMenuContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuSubContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuItemVariants = cva(
    [
        'relative flex cursor-pointer select-none items-center px-3 py-2',
        'font-bold transition-all rounded-brutal',
        'focus:bg-brutal-accent focus:text-brutal-fg',
        'hover:shadow-brutal-sm',
        FOCUS_RING_CLASSES,
        brutalPress,
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ],
    {
        variants: {
            inset: {
                true: 'pl-8',
                false: '',
            },
        },
        defaultVariants: {
            inset: false,
        },
    }
)
