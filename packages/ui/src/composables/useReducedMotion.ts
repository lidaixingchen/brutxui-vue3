import { computed, onActivated, onDeactivated, onMounted, onUnmounted, readonly, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'
import { isClient, matchMedia } from '../lib/env'

export interface UseReducedMotionOptions {
    enabled?: MaybeRefOrGetter<boolean | undefined>
}

export function useReducedMotion(options: UseReducedMotionOptions = {}): Readonly<Ref<boolean>> {
    const prefersReduced = ref(false)
    const enabled = computed(() => toValue(options.enabled) !== false)
    let mediaQuery: MediaQueryList | null = null
    let isMounted = false
    let isDeactivated = false
    let listenerAttached = false

    const onChange = (e: MediaQueryListEvent) => {
        prefersReduced.value = e.matches
    }

    function addListener() {
        if (!mediaQuery || listenerAttached) return
        mediaQuery.addEventListener('change', onChange)
        listenerAttached = true
    }

    function connect() {
        if (!isClient || !enabled.value || isDeactivated || mediaQuery) return
        const mq = matchMedia('(prefers-reduced-motion: reduce)')
        if (mq) {
            mediaQuery = mq
            prefersReduced.value = mq.matches
            if (isMounted) addListener()
        }
    }

    function release() {
        if (mediaQuery && listenerAttached) {
            mediaQuery.removeEventListener('change', onChange)
            listenerAttached = false
        }
        mediaQuery = null
        prefersReduced.value = false
    }

    connect()

    onMounted(() => {
        isMounted = true
        connect()
        addListener()
    })

    onDeactivated(() => {
        isDeactivated = true
        release()
    })

    onActivated(() => {
        isDeactivated = false
        connect()
        addListener()
    })

    onUnmounted(() => {
        isMounted = false
        isDeactivated = false
        release()
    })

    watch(enabled, value => {
        if (value) connect()
        else release()
    })

    return readonly(prefersReduced)
}
