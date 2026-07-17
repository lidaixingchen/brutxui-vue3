import { ref, inject, provide, getCurrentScope, onScopeDispose, type InjectionKey, type Ref } from 'vue'
import { MAX_TOASTS } from '../lib/defaults'
import type { VariantProps } from 'class-variance-authority'
import { toastVariants } from '../components/toast/toast-variants'
import { isClient, getWindow } from '../lib/env'


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
    toasts: Ref<ToastItem[]>
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

const TOAST_KEY: InjectionKey<UseToastReturn> = Symbol('brutx-toast')
export const DEFAULT_TOAST_DURATION = 5000

export function createToast(isFallback = false, globalOptions?: { grouping?: boolean }): UseToastReturn {
    const toasts = ref<ToastItem[]>([])
    const globalGrouping = globalOptions?.grouping ?? false

    // 注意：useToast 层不再启动自动移除定时器。离场倒计时由渲染层（Toast.vue）的
    // duration 定时器驱动，Toast.vue 在动画完成后 emit('close')，调用方通过
    // @close="removeToast(toast.id)" 触发状态层移除。这样：
    // 1. 避免双定时器冲突（useToast + Toast.vue 各起一个 setTimeout）
    // 2. pauseOnHover 自然生效（仅 Toast.vue 控制 pause/resume）
    // 3. 离场动画能正常播放（useToast 不会提前从数组移除导致组件卸载）

    function addToast(toast: Omit<ToastItem, 'id'>) {
        const isGroupingEnabled = toast.grouping ?? globalGrouping
        if (isGroupingEnabled) {
            const existingIndex = toasts.value.findIndex(
                (t) => t.title === toast.title && t.variant === toast.variant
            )
            if (existingIndex !== -1) {
                const existing = toasts.value[existingIndex]
                const updatedCount = (existing.count ?? 1) + 1

                const updatedToast: ToastItem = {
                    ...existing,
                    ...toast,
                    id: existing.id,
                    count: updatedCount,
                }
                const newToasts = [...toasts.value]
                newToasts[existingIndex] = updatedToast
                toasts.value = newToasts

                return existing.id
            }
        }

        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        if (toasts.value.length >= MAX_TOASTS) {
            toasts.value = toasts.value.slice(1)
        }
        toasts.value = [...toasts.value, { ...toast, id, count: toast.count ?? 1 }]

        return id
    }

    function removeToast(id: string) {
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    // 保留为 no-op 以维持 API 兼容性；定时器已迁移至 Toast.vue 渲染层
    function clearAllTimers() {}

    function clearToasts() {
        toasts.value = []
    }

    if (!isFallback && getCurrentScope()) {
        onScopeDispose(() => {
            clearToasts()
        })
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

    async function promise<T>(
        promiseOrFn: Promise<T> | (() => Promise<T>),
        options: PromiseToastOptions<T>
    ): Promise<T> {
        const promiseValue = typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn
        const loadingId = addToast({
            variant: options.loadingVariant ?? 'default',
            title: options.loading,
            duration: 0,
        })

        try {
            const data = await promiseValue
            removeToast(loadingId)
            const successMessage = typeof options.success === 'function'
                ? options.success(data)
                : options.success
            addToast({
                variant: options.successVariant ?? 'success',
                title: successMessage,
                duration: options.duration,
            })
            return data
        } catch (err) {
            removeToast(loadingId)
            const errorObj = err instanceof Error ? err : new Error(String(err))
            const errorMessage = typeof options.error === 'function'
                ? options.error(errorObj)
                : options.error
            addToast({
                variant: options.errorVariant ?? 'error',
                title: errorMessage,
                duration: options.duration,
            })
            throw err
        }
    }

    return {
        toasts,
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
}

let fallbackInstance: UseToastReturn | null = null

function destroyFallback() {
    if (fallbackInstance) {
        fallbackInstance.clearToasts()
        fallbackInstance = null
    }
}

if (isClient) {
    getWindow()?.addEventListener('beforeunload', destroyFallback)
}

export function provideToast(globalOptions?: { grouping?: boolean }): UseToastReturn {
    const toast = createToast(false, globalOptions)
    provide(TOAST_KEY, toast)
    return toast
}

export function useToast(): UseToastReturn {
    const toast = inject(TOAST_KEY)
    if (toast) return toast
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useToast() called without provideToast(). Falling back to shared singleton. Call provideToast() in your root component.')
    }
    if (!fallbackInstance) {
        fallbackInstance = createToast(true)
    }
    return fallbackInstance
}

export { destroyFallback }
