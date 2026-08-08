import { floatingContentAnimationClasses } from './floating-animation-classes'

export const floatingContentSideOffsets = {
    popover: 8,
    dropdownMenu: 6,
    tooltip: 6,
} as const

// 浮动表面共用框架（边框/阴影/圆角），供正/反两种配色变体复用，单一事实来源
export const floatingSurfaceFrameClasses = [
    'border-3 border-brutal rounded-brutal shadow-brutal',
] as const

export const brutalFloatingSurfaceClasses = [
    'bg-brutal-bg text-brutal-fg',
    ...floatingSurfaceFrameClasses,
] as const

export const inverseFloatingSurfaceClasses = [
    'bg-brutal-fg text-brutal-bg',
    ...floatingSurfaceFrameClasses,
] as const

// 直接复用共享动画类：进入动画统一带 data-[state=open]: 前缀（避免关闭态/forceMount 时
// 无条件进入动画与退场动画叠加），与 floating-animation-classes.ts 保持一致，消除两套写法漂移
export const tooltipFloatingAnimationClasses = floatingContentAnimationClasses
