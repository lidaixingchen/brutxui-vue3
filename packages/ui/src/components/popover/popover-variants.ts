import { cva } from 'class-variance-authority'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'

export const popoverContentVariants = cva(
    [
        'z-50 w-72 p-4',
        'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
        'outline-none',
        ...floatingContentAnimationClasses,
    ]
)
