import { cva } from 'class-variance-authority'
import { brutalHighlightLift, brutalPress } from '@/lib/brutal-interaction-variants'

export const commandInputWrapperVariants = cva(
    [
        'flex h-12 items-center gap-3 px-4',
        'border-b-3 border-brutal',
        'bg-brutal-accent',
    ]
)

export const commandItemVariants = cva(
    [
        'relative flex cursor-pointer items-center gap-3 px-3 py-2',
        'text-sm font-semibold',
        'select-none outline-none',
        'border-3 border-transparent',
        'data-[highlighted]:bg-brutal-secondary data-[highlighted]:text-brutal-fg',
        'data-[highlighted]:border-brutal data-[highlighted]:font-black',
        brutalHighlightLift,
        brutalPress,
        'transition-all',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    ]
)
