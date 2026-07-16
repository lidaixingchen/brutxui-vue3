import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { hasIntersectionObserver, getIntersectionObserverCtor } from '@/lib/env'

export interface UseInfiniteScrollOptions {
    /** 触发距离阈值 (px) */
    distance?: number
    /** 防抖延迟 (ms) */
    delay?: number
    /** 是否禁用 */
    disabled?: boolean
    /** 是否立即检查 */
    immediate?: boolean
    /** 加载回调 */
    onLoad: () => void
}

const DEFAULT_DISTANCE = 100
const DEFAULT_DELAY = 200
type ObserverSetupResult = 'observed' | 'unsupported' | 'missing-target'

export function useInfiniteScroll(
    targetRef: Ref<HTMLElement | null>,
    options: UseInfiniteScrollOptions
) {
    // 使用 getter 读取最新值，避免在 setup 时静态捕获导致后续变更不生效
    const getDistance = (): number => options.distance ?? DEFAULT_DISTANCE
    const getDelay = (): number => options.delay ?? DEFAULT_DELAY
    const getDisabled = (): boolean => options.disabled ?? false

    const isLoading = ref(false)
    const observer = ref<IntersectionObserver | null>(null)
    const loadTimer = ref<ReturnType<typeof setTimeout> | null>(null)

    function shouldLoad(): boolean {
        if (getDisabled()) return false
        if (isLoading.value) return false
        return true
    }

    function triggerLoad() {
        if (!shouldLoad()) return

        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
        }

        loadTimer.value = setTimeout(() => {
            isLoading.value = true
            options.onLoad()
        }, getDelay())
    }

    function setupObserver(): ObserverSetupResult {
        if (!targetRef.value) return 'missing-target'
        if (!hasIntersectionObserver) return 'unsupported'

        const Ctor = getIntersectionObserverCtor()
        if (!Ctor) return 'unsupported'

        observer.value = new Ctor(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting) {
                    triggerLoad()
                }
            },
            {
                root: null,
                rootMargin: `${getDistance()}px`,
                threshold: 0,
            }
        )

        observer.value.observe(targetRef.value)
        return 'observed'
    }

    function cleanupObserver() {
        if (observer.value) {
            observer.value.disconnect()
            observer.value = null
        }
    }

    function resetLoading() {
        isLoading.value = false
    }

    onMounted(() => {
        if (!getDisabled()) {
            const observerResult = setupObserver()

            if ((options.immediate ?? true) || observerResult === 'unsupported') {
                triggerLoad()
            }
        }
    })

    // 监听 distance 变化，重新创建 observer 以应用新的 rootMargin
    watch(
        () => options.distance,
        () => {
            if (observer.value) {
                cleanupObserver()
                if (!getDisabled()) {
                    setupObserver()
                }
            }
        }
    )

    // 监听 disabled 变化，动态启停 observer
    watch(
        () => options.disabled,
        (newDisabled) => {
            if (newDisabled) {
                cleanupObserver()
            } else if (!observer.value && targetRef.value) {
                const observerResult = setupObserver()
                if (observerResult === 'unsupported') {
                    triggerLoad()
                }
            }
        }
    )

    onUnmounted(() => {
        cleanupObserver()
        if (loadTimer.value) {
            clearTimeout(loadTimer.value)
        }
    })

    return {
        isLoading,
        resetLoading,
    }
}
