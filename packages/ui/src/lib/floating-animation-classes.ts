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
    // v4 下 translate-x/y 编译为独立 translate 属性（不再写入 transform），
    // 居中位移与动画 transform 叠加，slide-in/out 补偿会产生偏移；
    // 仅保留 fade/zoom，居中由 translate 属性本身保证
] as const
