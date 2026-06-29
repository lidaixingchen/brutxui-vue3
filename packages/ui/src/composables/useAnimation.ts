import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export function useAnimation(animationClass: MaybeRefOrGetter<string> = '') {
    const prefersReduced = useReducedMotion()
    const resolvedClass = computed(() => {
        if (prefersReduced.value) return ''
        return toValue(animationClass)
    })
    return { animationClass: resolvedClass, prefersReduced }
}
