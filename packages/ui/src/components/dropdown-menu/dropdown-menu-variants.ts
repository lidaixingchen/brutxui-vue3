import { cva } from 'class-variance-authority'
import { brutalPress } from '@/lib/brutal-interaction-variants'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'

const dropdownMenuContentBaseStyles = [
    'z-50 min-w-[8rem] overflow-hidden p-1',
    'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
    ...floatingContentAnimationClasses,
]

export const dropdownMenuContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuSubContentVariants = cva(dropdownMenuContentBaseStyles)

export const dropdownMenuItemVariants = cva(
    [
        'relative flex cursor-pointer select-none items-center px-3 py-2',
        'font-bold outline-none transition-all rounded-brutal',
        'focus:bg-brutal-accent focus:text-brutal-fg',
        'hover:shadow-brutal-sm',
        'focus-visible:ring-2 focus-visible:ring-brutal-ring',
        brutalPress,
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ]
)
