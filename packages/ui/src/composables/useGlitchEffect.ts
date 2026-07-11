import { computed, onBeforeUnmount, onMounted, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { DEFAULT_AUTOPLAY_INTERVAL_MS, GLITCH_AUTOPLAY_ACTIVE_DURATION_MS, GLITCH_MIN_INTERVAL_MS } from '@/lib/defaults'
import { useReducedMotion } from './useReducedMotion'

export type GlitchTrigger = 'hover' | 'click' | 'autoplay' | 'none'

export interface UseGlitchEffectOptions {
    trigger?: MaybeRefOrGetter<GlitchTrigger | undefined>
    interval?: MaybeRefOrGetter<number | undefined>
    disabled?: MaybeRefOrGetter<boolean | undefined>
}

export function useGlitchEffect(options: UseGlitchEffectOptions = {}) {
    const isActive = shallowRef(false)
    const prefersReducedMotion = useReducedMotion()
    const autoplayTimer = shallowRef<ReturnType<typeof setInterval> | null>(null)
    const autoplayStopTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)

    const trigger = computed(() => toValue(options.trigger) ?? 'hover')
    const isDisabled = computed(() => !!toValue(options.disabled))
    const isGlitching = computed(() => isActive.value && !prefersReducedMotion.value)

    function stopAutoplay() {
        if (autoplayTimer.value) {
            clearInterval(autoplayTimer.value)
            autoplayTimer.value = null
        }
        if (autoplayStopTimer.value) {
            clearTimeout(autoplayStopTimer.value)
            autoplayStopTimer.value = null
        }
    }

    function startAutoplay() {
        stopAutoplay()
        const interval = Math.max(Number(toValue(options.interval)) || DEFAULT_AUTOPLAY_INTERVAL_MS, GLITCH_MIN_INTERVAL_MS)
        autoplayTimer.value = setInterval(() => {
            if (prefersReducedMotion.value) return
            isActive.value = true
            if (autoplayStopTimer.value) {
                clearTimeout(autoplayStopTimer.value)
            }
            autoplayStopTimer.value = setTimeout(() => {
                isActive.value = false
            }, GLITCH_AUTOPLAY_ACTIVE_DURATION_MS)
        }, interval)
    }

    function onMouseEnter() {
        if (isDisabled.value) return
        if (trigger.value === 'hover') {
            isActive.value = true
        } else if (trigger.value === 'autoplay') {
            isActive.value = false
            stopAutoplay()
        }
    }

    function onMouseLeave() {
        if (isDisabled.value) return
        if (trigger.value === 'hover') {
            isActive.value = false
        } else if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    }

    function onClick() {
        if (isDisabled.value) return
        if (trigger.value === 'click') {
            isActive.value = !isActive.value
        }
    }

    function play() {
        isActive.value = true
    }

    function stop() {
        isActive.value = false
    }

    onMounted(() => {
        if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    })

    onBeforeUnmount(() => {
        stopAutoplay()
    })

    watch(trigger, (newTrigger, oldTrigger) => {
        if (oldTrigger === 'autoplay') {
            stopAutoplay()
            isActive.value = false
        }
        if (newTrigger === 'autoplay') {
            startAutoplay()
        }
    })

    watch(() => toValue(options.interval), () => {
        if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    })

    watch(prefersReducedMotion, (prefersReduced) => {
        if (prefersReduced) {
            isActive.value = false
            if (trigger.value === 'autoplay') {
                stopAutoplay()
            }
        } else if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    })

    return {
        isActive,
        isGlitching,
        prefersReducedMotion,
        onMouseEnter,
        onMouseLeave,
        onClick,
        play,
        stop,
        startAutoplay,
        stopAutoplay,
    }
}
