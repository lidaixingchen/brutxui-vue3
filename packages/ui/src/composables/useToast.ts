import { ref, inject, provide, type InjectionKey } from 'vue'
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
}

const TOAST_KEY: InjectionKey<ReturnType<typeof createToast>> = Symbol('brutx-toast')
const DEFAULT_TOAST_DURATION = 5000

export function createToast() {
    const toasts = ref<ToastItem[]>([])
    const MAX_TOASTS = 10
    const timerMap = new Map<string, number>()

    function addToast(toast: Omit<ToastItem, 'id'>) {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        if (toasts.value.length >= MAX_TOASTS) {
            toasts.value = toasts.value.slice(1)
        }
        toasts.value = [...toasts.value, { ...toast, id }]
        const duration = toast.duration ?? DEFAULT_TOAST_DURATION
        if (duration > 0 && typeof window !== 'undefined') {
            const timerId = window.setTimeout(() => removeToast(id), duration)
            timerMap.set(id, timerId)
        }
        return id
    }

    function removeToast(id: string) {
        const timerId = timerMap.get(id)
        if (timerId !== undefined) {
            clearTimeout(timerId)
            timerMap.delete(id)
        }
        toasts.value = toasts.value.filter((t) => t.id !== id)
    }

    function clearToasts() {
        timerMap.forEach((timerId) => clearTimeout(timerId))
        timerMap.clear()
        toasts.value = []
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

    return {
        toasts,
        addToast,
        removeToast,
        clearToasts,
        success,
        error,
        warning,
        info,
    }
}

export function provideToast() {
    const toast = createToast()
    provide(TOAST_KEY, toast)
    return toast
}

export function useToast() {
    const toast = inject(TOAST_KEY)
    if (toast) return toast
    if (typeof console !== 'undefined') {
        console.warn('[BrutxUI] useToast() called without provideToast(). Falling back to isolated instance. Call provideToast() in your root component.')
    }
    return createToast()
}
