import { onUnmounted } from 'vue'

/**
 * useThrottle 选项
 */
export interface UseThrottleOptions {
    /** 是否在首次调用时立即执行 */
    leading?: boolean
    /** 是否在节流结束后执行最后一次调用 */
    trailing?: boolean
}

/**
 * useThrottle 返回类型
 */
export interface UseThrottleReturn<T extends (...args: never[]) => unknown> {
    /** 节流后的函数 */
    throttled: T
    /** 取消待执行的尾部调用 */
    cancel: () => void
    /** 立即执行待执行的尾部调用 */
    flush: () => void
}

/**
 * 创建节流函数，在 delay 毫秒内多次调用只执行一次。
 *
 * @param fn - 需要节流的函数
 * @param delay - 节流间隔（毫秒）
 * @param options - 配置选项
 * @returns 包含节流函数、cancel 和 flush 方法的对象
 *
 * @example
 * ```ts
 * const { throttled, cancel } = useThrottle(handleScroll, 200)
 *
 * // 使用节流函数
 * throttled(event)
 *
 * // 取消待执行的尾部调用
 * cancel()
 * ```
 */
export function useThrottle<T extends (...args: never[]) => unknown>(
    fn: T,
    delay: number,
    options: UseThrottleOptions = {},
): UseThrottleReturn<T> {
    const { leading = true, trailing = true } = options

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: Parameters<T> | null = null
    let lastCallTime = 0

    function cancel(): void {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        lastArgs = null
        lastCallTime = 0
    }

    function flush(): void {
        if (lastArgs !== null) {
            const args = lastArgs
            cancel()
            fn(...args)
        } else {
            cancel()
        }
    }

    function invokeTrailing(): void {
        if (lastArgs !== null) {
            const args = lastArgs
            lastArgs = null
            fn(...args)
            lastCallTime = Date.now()
        }
    }

    const throttled = ((...args: Parameters<T>) => {
        const now = Date.now()

        if (!leading && lastCallTime === 0) {
            // 首次调用不执行时，记录时间并等待
            lastCallTime = now
        }

        const remaining = delay - (now - lastCallTime)
        lastArgs = args

        if (remaining <= 0 || remaining > delay) {
            // 超过间隔，立即执行
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            fn(...args)
            lastCallTime = now
            lastArgs = null
        } else if (trailing && timeoutId === null) {
            // 在间隔内，设置尾部执行
            timeoutId = setTimeout(() => {
                timeoutId = null
                invokeTrailing()
            }, remaining)
        }
    }) as T

    onUnmounted(() => {
        cancel()
    })

    return {
        throttled,
        cancel,
        flush,
    }
}
