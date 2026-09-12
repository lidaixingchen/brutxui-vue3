import { cva } from 'class-variance-authority'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'

export const popoverContentVariants = cva(
    [
        'z-popover w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto p-4',
        ...brutalFloatingSurfaceClasses,
        ...floatingContentAnimationClasses,
    ]
)
