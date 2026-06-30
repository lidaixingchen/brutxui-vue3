import { computed, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export interface UseAnimationReturn {
    animationClass: ComputedRef<string>
    prefersReduced: Ref<boolean>
}

export function useAnimation(animationClass: MaybeRefOrGetter<string> = ''): UseAnimationReturn {
    const prefersReduced = useReducedMotion()
    const resolvedClass = computed(() => {
        if (prefersReduced.value) return ''
        return toValue(animationClass)
    })
    return { animationClass: resolvedClass, prefersReduced }
}
