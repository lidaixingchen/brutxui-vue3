import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { isClient, matchMedia } from '../lib/env'

export function useReducedMotion(): Ref<boolean> {
    const prefersReduced = ref(false)
    let mediaQuery: MediaQueryList | null = null

    const onChange = (e: MediaQueryListEvent) => {
        prefersReduced.value = e.matches
    }

    onMounted(() => {
        if (isClient) {
            const mq = matchMedia('(prefers-reduced-motion: reduce)')
            if (mq) {
                mediaQuery = mq
                prefersReduced.value = mq.matches
                mq.addEventListener('change', onChange)
            }
        }
    })

    onUnmounted(() => {
        mediaQuery?.removeEventListener('change', onChange)
    })

    return prefersReduced
}
