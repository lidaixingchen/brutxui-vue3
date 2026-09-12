import { cva } from 'class-variance-authority'
import { inverseFloatingSurfaceClasses, tooltipFloatingAnimationClasses } from '@/lib/floating-content-variants'

export const tooltipContentVariants = cva(
    [
        'z-tooltip max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-auto px-3 py-1.5',
        'text-sm font-bold',
        ...inverseFloatingSurfaceClasses,
        ...tooltipFloatingAnimationClasses,
    ]
)
