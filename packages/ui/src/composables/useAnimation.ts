import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'
import { isClient } from '../lib/env'

export interface UseAnimationReturn {
    animationClass: ComputedRef<string>
    prefersReduced: Ref<boolean>
}

/**
 * 将动画类名与 prefers-reduced-motion 偏好绑定。
 *
 * 作用范围：仅控制本函数返回的 animationClass；调用方通过内联
 * animation/transition 样式、CSS 类组合等方式应用的动画不在本函数控制范围，
 * 需自行做减少动态处理。
 *
 * SSR/挂载前行为：matchMedia 不可用、无法获知用户偏好时（服务端渲染阶段）
 * 保守返回空类名，避免减少动态用户首屏加载时看到动画闪烁。
 */
export function useAnimation(animationClass: MaybeRefOrGetter<string> = ''): UseAnimationReturn {
    const prefersReduced = useReducedMotion()
    const resolvedClass = computed(() => {
        // SSR 阶段 prefersReduced 恒为 false（onMounted 前不查询 matchMedia），
        // 返回空类名避免减少动态用户首屏动画闪烁
        if (!isClient || prefersReduced.value) return ''
        return toValue(animationClass)
    })
    return { animationClass: resolvedClass, prefersReduced }
}
