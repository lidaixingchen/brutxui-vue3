import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { isClient } from '../lib/env'

export function useReducedMotion(): Ref<boolean> {
    const prefersReduced = ref(false)
    let mediaQuery: MediaQueryList | null = null

    const onChange = (e: MediaQueryListEvent) => {
        prefersReduced.value = e.matches
    }

    onMounted(() => {
        if (isClient) {
            mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
            prefersReduced.value = mediaQuery.matches
            mediaQuery.addEventListener('change', onChange)
        }
    })

    onUnmounted(() => {
        mediaQuery?.removeEventListener('change', onChange)
    })

    return prefersReduced
}
