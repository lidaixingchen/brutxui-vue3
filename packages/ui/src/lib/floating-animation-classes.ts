/** 进入/退出动画共享片段：fade + zoom，供各浮动表面数组复用，避免两处展开后漂移 */
export const fadeZoomAnimationClasses = [
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    '[animation-timing-function:var(--ease-brutal-snap)]',
] as const

export const floatingContentAnimationClasses = [
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    ...fadeZoomAnimationClasses,
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
] as const

export const centeredModalAnimationClasses = [
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'duration-200',
    ...fadeZoomAnimationClasses,
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
] as const
