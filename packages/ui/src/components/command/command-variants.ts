import { cva } from 'class-variance-authority'

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
        'data-[highlighted=true]:bg-brutal-secondary data-[highlighted=true]:text-brutal-fg',
        'data-[highlighted=true]:border-brutal data-[highlighted=true]:font-black',
        'data-[highlighted=true]:shadow-brutal-sm',
        'active:translate-y-[var(--brutal-pressed-offset,2px)] active:shadow-none transition-all',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    ]
)
