import { ref, inject, provide, getCurrentScope, onScopeDispose, type InjectionKey, type Ref } from 'vue'
import { isClient } from '../lib/env'
import { MAX_TOASTS } from '../lib/defaults'
import type { VariantProps } from 'class-variance-authority'
import { toastVariants } from '../components/toast/toast-variants'

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
    const timerMap = new Map<string, ReturnType<typeof setTimeout>>()
    const globalGrouping = globalOptions?.grouping ?? false

    function clearTimer(id: string) {
        const timerId = timerMap.get(id)
        if (timerId !== undefined) {
            clearTimeout(timerId)
            timerMap.delete(id)
        }
    }

    function addToast(toast: Omit<ToastItem, 'id'>) {
        const isGroupingEnabled = toast.grouping ?? globalGrouping
        if (isGroupingEnabled) {
            const existingIndex = toasts.value.findIndex(
                (t) => t.title === toast.title && t.variant === toast.variant
            )
            if (existingIndex !== -1) {
                const existing = toasts.value[existingIndex]
                const updatedCount = (existing.count ?? 1) + 1
                clearTimer(existing.id)

                const updatedToast: ToastItem = {
                    ...existing,
                    ...toast,
                    id: existing.id,
                    count: updatedCount,
                }
                const newToasts = [...toasts.value]
                newToasts[existingIndex] = updatedToast
                toasts.value = newToasts

                const duration = toast.duration ?? existing.duration ?? DEFAULT_TOAST_DURATION
                if (duration > 0 && isClient) {
                    const timerId = window.setTimeout(() => removeToast(existing.id), duration)
                    timerMap.set(existing.id, timerId)
                }
                return existing.id
            }
        }

        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        if (toasts.value.length >= MAX_TOASTS) {
            const removed = toasts.value[0]
            if (removed) {
                clearTimer(removed.id)
            }
            toasts.value = toasts.value.slice(1)
        }
        toasts.value = [...toasts.value, { ...toast, id, count: toast.count ?? 1 }]
        const duration = toast.duration ?? DEFAULT_TOAST_DURATION
        if (duration > 0 && isClient) {
            const timerId = window.setTimeout(() => removeToast(id), duration)
            timerMap.set(id, timerId)
        }
        return id
    }

    function removeToast(id: string) {
        clearTimer(id)
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    function clearAllTimers() {
        timerMap.forEach((timerId) => clearTimeout(timerId))
        timerMap.clear()
    }

    function clearToasts() {
        clearAllTimers()
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

if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', destroyFallback)
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
