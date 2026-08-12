import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, readonly, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from 'vue'
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
    // KeepAlive 停用标记：停用期间禁止启动 autoplay 定时器，避免隐藏故障效果继续空转
    const isDeactivated = ref(false)
    const autoplayTimer = shallowRef<ReturnType<typeof setInterval> | null>(null)
    const autoplayStopTimer = shallowRef<ReturnType<typeof setTimeout> | null>(null)

    const trigger = computed(() => toValue(options.trigger) ?? 'hover')
    const isDisabled = computed(() => !!toValue(options.disabled))
    const isGlitching = computed(() => isActive.value && !prefersReducedMotion.value)

    // 禁用时停止 autoplay 并复位激活态；解除禁用后按 trigger 恢复 autoplay
    watch(isDisabled, (disabled) => {
        if (disabled) {
            stopAutoplay()
            isActive.value = false
        } else if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    })

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
        // 禁用时不启动 autoplay，避免定时器持续 tick 占用资源
        if (isDisabled.value) return
        // 用户开启「减少动态效果」时不启动：回调只会因 prefersReducedMotion 提前 return，
        // 定时器会在组件整个生命周期内空转，纯浪费定时器资源
        if (prefersReducedMotion.value) return
        // KeepAlive 停用期间不启动定时器，避免隐藏故障效果继续翻转 isActive
        if (isDeactivated.value) return
        stopAutoplay()
        // interval 下界同时钳制为激活时长：若 interval 小于激活时长，tick 会反复清掉未到期的 stop
        // 定时器并重新调度，isActive 永远无法置回 false，故障效果将持续开启
        const interval = Math.max(
            Number(toValue(options.interval)) || DEFAULT_AUTOPLAY_INTERVAL_MS,
            GLITCH_MIN_INTERVAL_MS,
            GLITCH_AUTOPLAY_ACTIVE_DURATION_MS,
        )
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

    /**
     * 无条件开启故障效果：编程强制接口，不受 disabled / trigger 限制
     * （与 onClick/onMouseEnter 等事件处理器的拦截逻辑不同，供外部程序化控制使用）。
     */
    function play() {
        isActive.value = true
    }

    /**
     * 无条件关闭故障效果：编程强制接口，不受 disabled / trigger 限制
     * （与 onClick/onMouseEnter 等事件处理器的拦截逻辑不同，供外部程序化控制使用）。
     */
    function stop() {
        isActive.value = false
    }

    onMounted(() => {
        if (trigger.value === 'autoplay') {
            startAutoplay()
        }
    })

    onDeactivated(() => {
        // KeepAlive 缓存停用时停止 autoplay 定时器并复位激活态，避免隐藏故障效果继续翻转 isActive
        isDeactivated.value = true
        stopAutoplay()
        isActive.value = false
    })

    onActivated(() => {
        // 重新激活时恢复：与 onMounted 对称，trigger 为 autoplay 时重启（startAutoplay 内部复核 disabled / reduced / deactivated 条件）
        isDeactivated.value = false
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
        isActive: readonly(isActive),
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
