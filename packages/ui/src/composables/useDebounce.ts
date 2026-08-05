import { onUnmounted } from 'vue'

/**
 * useDebounce 选项
 */
export interface UseDebounceOptions {
    /** 是否在首次调用时立即执行（leading-edge：delay 窗口内的后续调用被忽略，可用 flush 主动补执行） */
    immediate?: boolean
}

/**
 * useDebounce 返回类型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 这里使用 any 是必要的：需要接受任意参数签名的函数，Parameters<T> 仍会推导出具体参数类型
export interface UseDebounceReturn<T extends (...args: any[]) => unknown> {
    /** 防抖后的函数 */
    debounced: T
    /** 取消待执行的防抖调用 */
    cancel: () => void
    /** 立即执行待执行的防抖调用 */
    flush: () => void
}

/**
 * 创建防抖函数，在 delay 毫秒内多次调用只执行最后一次。
 *
 * @param fn - 需要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @param options - 配置选项
 * @returns 包含防抖函数、cancel 和 flush 方法的对象
 *
 * @example
 * ```ts
 * const { debounced, cancel } = useDebounce(fetchData, 300)
 *
 * // 使用防抖函数
 * debounced('search term')
 *
 * // 取消待执行的调用
 * cancel()
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 使用 any 是必要的：约束需接受任意参数签名的函数，Parameters<T> 仍会推导出具体参数类型
export function useDebounce<T extends (...args: any[]) => unknown>(
    fn: T,
    delay: number,
    options: UseDebounceOptions = {},
): UseDebounceReturn<T> {
    const { immediate = false } = options

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastArgs: Parameters<T> | null = null

    function cancel(): void {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
            timeoutId = null
        }
        lastArgs = null
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

    const debounced = ((...args: Parameters<T>) => {
        lastArgs = args

        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }

        if (immediate && timeoutId === null) {
            fn(...args)
        }

        timeoutId = setTimeout(() => {
            if (!immediate) {
                fn(...args)
            }
            timeoutId = null
            lastArgs = null
        }, delay)
    }) as T

    onUnmounted(() => {
        cancel()
    })

    return {
        debounced,
        cancel,
        flush,
    }
}
