import { ref } from 'vue'

export function useToast() {
    const toasts = ref<Array<{ id: number; message: string; type: string }>>([])

    function toast(message: string, type: string = 'default') {
        const id = Date.now()
        toasts.value.push({ id, message, type })
        setTimeout(() => {
            toasts.value = toasts.value.filter((t) => t.id !== id)
        }, 3000)
    }

    return { toasts, toast }
}
