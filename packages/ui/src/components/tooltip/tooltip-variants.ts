import { cva } from 'class-variance-authority'
import { inverseFloatingSurfaceClasses, tooltipFloatingAnimationClasses } from '@/lib/floating-content-variants'

export const tooltipContentVariants = cva(
    [
        'z-50 overflow-hidden px-3 py-1.5',
        'text-sm font-bold',
        ...inverseFloatingSurfaceClasses,
        ...tooltipFloatingAnimationClasses,
    ]
)
