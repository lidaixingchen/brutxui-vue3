import { getCurrentInstance, onUnmounted } from 'vue'

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
    /**
     * 节流后的函数。签名与原函数参数一致，但返回类型为 `ReturnType<T> | void`——
     * 节流实现会丢弃被抑制的调用及其返回值，直接声明原返回类型不健全。
     */
    throttled: (...args: Parameters<T>) => ReturnType<T> | void
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

        const isFirstCall = lastCallTime === 0
        if (isFirstCall) lastCallTime = now

        const remaining = delay - (now - lastCallTime)

        // 前缘分支：窗口已过（含 delay 为 0），或 leading 且为首次调用
        if (remaining <= 0 || (isFirstCall && leading)) {
            if (timeoutId !== null) {
                clearTimeout(timeoutId)
                timeoutId = null
            }
            if (leading) {
                // 前缘执行：立即调用并刷新窗口
                lastArgs = null
                fn(...args)
                lastCallTime = now
            } else if (trailing) {
                // leading:false：即使空闲超过 delay，也只允许尾部执行——
                // 记录参数并安排定时器，而不是在前缘立即调用 fn
                lastArgs = args
                lastCallTime = now
                timeoutId = setTimeout(() => {
                    timeoutId = null
                    invokeTrailing()
                }, delay)
            } else {
                // leading:false && trailing:false：永不执行，仅刷新窗口时间
                lastArgs = null
                lastCallTime = now
            }
            return
        }

        // 窗口内调用：记录最新参数供尾部定时器消费；trailing:false 时该调用应被丢弃，
        // 清空 lastArgs 避免 flush() 误执行本应丢弃的调用
        lastArgs = args
        if (trailing && timeoutId === null) {
            timeoutId = setTimeout(() => {
                timeoutId = null
                invokeTrailing()
            }, remaining)
        } else if (!trailing) {
            lastArgs = null
        }
    })

    // 仅在组件 setup 上下文中注册卸载清理；非组件上下文（普通工具函数/模块级复用）
    // 不会触发 Vue 的「onUnmounted 无活动组件实例」警告，清理交由调用方显式 cancel()
    if (getCurrentInstance()) {
        onUnmounted(() => {
            cancel()
        })
    }

    return {
        throttled,
        cancel,
        flush,
    }
}
