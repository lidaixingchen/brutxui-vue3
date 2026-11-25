import { ref, inject, provide, readonly, getCurrentScope, onScopeDispose, type InjectionKey, type DeepReadonly, type Ref } from 'vue'
import { MAX_TOASTS, DEFAULT_TOAST_DURATION } from '../lib/defaults'
import type { VariantProps } from 'class-variance-authority'
import { toastVariants } from '../components/toast/toast-variants'
import { isClient } from '../lib/env'
import { createFallbackManager } from '../lib/fallback-manager'

export { DEFAULT_TOAST_DURATION }


type ToastVariantProps = VariantProps<typeof toastVariants>

export interface ToastItem {
    id: string
    variant?: NonNullable<ToastVariantProps['variant']>
    size?: NonNullable<ToastVariantProps['size']>
    title?: string
    description?: string
    duration?: number
    count?: number
    grouping?: boolean
}

export interface ToastStackOptions {
    maxVisible?: number
    gap?: number
    expandDirection?: 'down' | 'up'
}

export type ToastPosition =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | { x: number; y: number; anchor?: 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right' }

export interface PromiseToastOptions<T> {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
    duration?: number
    loadingVariant?: NonNullable<ToastVariantProps['variant']>
    successVariant?: NonNullable<ToastVariantProps['variant']>
    errorVariant?: NonNullable<ToastVariantProps['variant']>
}

export interface UseToastReturn {
    /** 只读视图：修改请经 addToast / removeToast / clearToasts */
    toasts: DeepReadonly<Ref<readonly ToastItem[]>>
    addToast: (toast: Omit<ToastItem, 'id'>) => string
    removeToast: (id: string) => void
    clearToasts: () => void
    clearAllTimers: () => void
    success: (title: string, description?: string) => string
    error: (title: string, description?: string) => string
    warning: (title: string, description?: string) => string
    info: (title: string, description?: string) => string
    promise: <T>(promiseOrFn: Promise<T> | (() => Promise<T>), options: PromiseToastOptions<T>) => Promise<T>
}

export const TOAST_KEY: InjectionKey<UseToastReturn> = Symbol('brutx-toast')

function createToastInstance(globalOptions?: { grouping?: boolean }) {
    const toasts = ref<ToastItem[]>([])
    const globalGrouping = globalOptions?.grouping ?? false
    const loadingToastIds = new Set<string>()
    let destroyed = false

    // 注意：useToast 层不再启动自动移除定时器。离场倒计时由渲染层（Toast.vue）的
    // duration 定时器驱动，Toast.vue 在动画完成后 emit('close')，调用方通过
    // @close="removeToast(toast.id)" 触发状态层移除。这样：
    // 1. 避免双定时器冲突（useToast + Toast.vue 各起一个 setTimeout）
    // 2. pauseOnHover 自然生效（仅 Toast.vue 控制 pause/resume）
    // 3. 离场动画能正常播放（useToast 不会提前从数组移除导致组件卸载）

    function addToast(toast: Omit<ToastItem, 'id'>) {
        return enqueueToast(toast)
    }

    function replaceToast(index: number, toast: ToastItem) {
        const nextToasts = [...toasts.value]
        nextToasts[index] = toast
        toasts.value = nextToasts
    }

    function enqueueToast(toast: Omit<ToastItem, 'id'>, isLoading = false) {
        const isGroupingEnabled = toast.grouping ?? globalGrouping
        if (isGroupingEnabled) {
            // 匹配键包含 description/size，避免标题与变体相同但内容不同的 toast 被误合并
            const existingIndex = toasts.value.findIndex(
                (t) => loadingToastIds.has(t.id) === isLoading
                    && t.title === toast.title
                    && t.variant === toast.variant
                    && t.description === toast.description
                    && t.size === toast.size
            )
            // 已有 toast 自身关闭分组（grouping: false）时不强行合并
            if (existingIndex !== -1 && toasts.value[existingIndex].grouping !== false) {
                const existing = toasts.value[existingIndex]
                const updatedCount = (existing.count ?? 1) + 1

                // 仅覆盖新 toast 显式提供的字段：description/size/duration 等未提供时
                // 保留已有值，避免被 undefined 覆盖造成信息丢失
                // （key 为联合类型时索引赋值需经 Record 断言，TS 无法逐键窄化 value）
                const mergedFields = (Object.keys(toast) as (keyof Omit<ToastItem, 'id'>)[])
                    .reduce<Partial<Omit<ToastItem, 'id'>>>((acc, key) => {
                        const value = toast[key]
                        if (value !== undefined) {
                            (acc as Record<string, unknown>)[key] = value
                        }
                        return acc
                    }, {})

                replaceToast(existingIndex, {
                    ...existing,
                    ...mergedFields,
                    id: existing.id,
                    count: updatedCount,
                })

                return existing.id
            }
        }

        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        let nextToasts = toasts.value
        if (nextToasts.length >= MAX_TOASTS) {
            loadingToastIds.delete(nextToasts[0].id)
            nextToasts = nextToasts.slice(1)
        }
        if (isLoading) loadingToastIds.add(id)
        toasts.value = [...nextToasts, { ...toast, id, count: toast.count ?? 1 }]

        return id
    }

    function removeToast(id: string) {
        loadingToastIds.delete(id)
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    function releaseLoadingToast(id: string) {
        if (!loadingToastIds.has(id)) return
        const index = toasts.value.findIndex((toast) => toast.id === id)
        const toast = toasts.value[index]
        const count = toast.count ?? 1
        if (count === 1) removeToast(id)
        else replaceToast(index, { ...toast, count: count - 1 })
    }

    function clearAllTimers() {}

    function clearToasts() {
        loadingToastIds.clear()
        toasts.value = []
    }

    function destroy() {
        destroyed = true
        clearToasts()
    }

    function success(title: string, description?: string) {
        return addToast({ variant: 'success', title, description })
    }

    function error(title: string, description?: string) {
        return addToast({ variant: 'error', title, description })
    }

    function warning(title: string, description?: string) {
        return addToast({ variant: 'warning', title, description })
    }

    function info(title: string, description?: string) {
        return addToast({ variant: 'info', title, description })
    }

    function runPromiseToastEffect<T>(effect: () => T): T | undefined {
        if (destroyed) return undefined
        try {
            return effect()
        } catch (error) {
            console.error('[BrutxUI] Failed to update a promise toast.', error)
            return undefined
        }
    }

    function settlePromiseToast(loadingId: string | undefined, getToast: () => Omit<ToastItem, 'id'>) {
        runPromiseToastEffect(() => {
            if (loadingId !== undefined) releaseLoadingToast(loadingId)
            if (destroyed) return
            const result = getToast()
            if (!destroyed) addToast(result)
        })
    }

    async function promise<T>(
        promiseOrFn: Promise<T> | (() => Promise<T>),
        options: PromiseToastOptions<T>
    ): Promise<T> {
        // 函数形态经 Promise.resolve().then() 求值：同步抛错被转为 rejection 由下方 catch 捕获，
        // 保证 loading/error toast 都会展示（若在 try 外直接调用，同步异常会绕过 toast 反馈层）
        const promiseValue = typeof promiseOrFn === 'function'
            ? Promise.resolve().then(promiseOrFn)
            : Promise.resolve(promiseOrFn)
        const loadingId = runPromiseToastEffect(() => enqueueToast({
            variant: options.loadingVariant ?? 'default',
            title: options.loading,
            duration: 0,
        }, true))

        let data: T
        try {
            data = await promiseValue
        } catch (err) {
            settlePromiseToast(loadingId, () => ({
                variant: options.errorVariant ?? 'error',
                title: typeof options.error === 'function'
                    ? options.error(err instanceof Error ? err : new Error(String(err)))
                    : options.error,
                duration: options.duration,
            }))
            throw err
        }

        settlePromiseToast(loadingId, () => ({
            variant: options.successVariant ?? 'success',
            title: typeof options.success === 'function' ? options.success(data) : options.success,
            duration: options.duration,
        }))
        return data
    }

    const toast: UseToastReturn = {
        toasts: readonly(toasts),
        addToast,
        removeToast,
        clearToasts,
        clearAllTimers,
        success,
        error,
        warning,
        info,
        promise,
    }
    return { toast, destroy }
}

export function createToast(isFallback = false, globalOptions?: { grouping?: boolean }): UseToastReturn {
    const { toast, destroy } = createToastInstance(globalOptions)
    if (!isFallback && getCurrentScope()) onScopeDispose(destroy)
    return toast
}

// 共享 fallback 单例：懒创建 + 引用计数清理 + beforeunload 注册/移除统一由 lib/fallback-manager 管理
const fallbackManager = createFallbackManager({
    name: 'useToast',
    isClient,
    createInstance: () => createToastInstance(),
    destroyInstance: ({ destroy }) => destroy(),
})

export function destroyFallback() {
    fallbackManager.destroy()
}

export function provideToast(globalOptions?: { grouping?: boolean }): UseToastReturn {
    const toast = createToast(false, globalOptions)
    provide(TOAST_KEY, toast)
    return toast
}

export function useToast(): UseToastReturn {
    const toast = inject(TOAST_KEY, null)
    if (toast) return toast
    if (isClient && typeof console !== 'undefined') {
        console.warn('[BrutxUI] useToast() called without provideToast(). Falling back to shared singleton. Call provideToast() in your root component.')
    }
    return fallbackManager.acquire().toast
}
