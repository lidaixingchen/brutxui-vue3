import { ref, onMounted, onUnmounted, type Ref } from 'vue'

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

export function useInfiniteScroll(
    targetRef: Ref<HTMLElement | null>,
    options: UseInfiniteScrollOptions
) {
    const {
        distance = 100,
        delay = 200,
        disabled = false,
        immediate = true,
        onLoad,
    } = options

    const isLoading = ref(false)
    const observer = ref<IntersectionObserver | null>(null)
    const loadTimer = ref<ReturnType<typeof setTimeout> | null>(null)

    function shouldLoad(): boolean {
        if (disabled) return false
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
            onLoad()
        }, delay)
    }

    function setupObserver() {
        if (!targetRef.value) return

        observer.value = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry.isIntersecting) {
                    triggerLoad()
                }
            },
            {
                root: null,
                rootMargin: `${distance}px`,
                threshold: 0,
            }
        )

        observer.value.observe(targetRef.value)
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
        if (!disabled) {
            setupObserver()

            if (immediate) {
                triggerLoad()
            }
        }
    })

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
