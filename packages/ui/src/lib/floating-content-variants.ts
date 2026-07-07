export const floatingContentSideOffsets = {
    popover: 8,
    dropdownMenu: 6,
    tooltip: 6,
} as const

export const brutalFloatingSurfaceClasses = [
    'bg-brutal-bg text-brutal-fg border-3 border-brutal shadow-brutal rounded-brutal',
] as const

export const inverseFloatingSurfaceClasses = [
    'bg-brutal-fg text-brutal-bg',
    'border-3 border-brutal rounded-brutal shadow-brutal',
] as const

export const tooltipFloatingAnimationClasses = [
    'animate-in fade-in-0 zoom-in-95',
    'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
] as const
