import { ref } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import { toastVariants } from '../components/toast-variants'

type ToastVariantProps = VariantProps<typeof toastVariants>

export interface ToastItem {
    id: string
    variant?: NonNullable<ToastVariantProps['variant']>
    title?: string
    description?: string
    duration?: number
}

const toasts = ref<ToastItem[]>([])

function addToast(toast: Omit<ToastItem, 'id'>) {
    const id = Math.random().toString(36).substring(2, 11)
    toasts.value = [...toasts.value, { ...toast, id }]
    return id
}

function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
}

function clearToasts() {
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

export function useToast() {
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
