import { cva } from 'class-variance-authority'
import { floatingContentAnimationClasses } from '@/lib/floating-animation-classes'
import { brutalFloatingSurfaceClasses } from '@/lib/floating-content-variants'

export const popoverContentVariants = cva(
    [
        'z-50 w-72 p-4',
        ...brutalFloatingSurfaceClasses,
        'outline-none',
        ...floatingContentAnimationClasses,
    ]
)
