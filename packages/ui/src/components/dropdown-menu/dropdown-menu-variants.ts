import { cva } from 'class-variance-authority'

const dropdownMenuContentBaseStyles = [
    'z-50 min-w-[8rem] overflow-hidden p-1',
    'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
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
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    ]
)
