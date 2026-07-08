import { ref, onUnmounted, type Ref } from 'vue'
import { showDialog, type ShowDialogOptions } from '@/components/dialog/functional'

export type { ShowDialogOptions }

type DialogInstance = { close: () => void; promise: Promise<void>; destroy: () => void }

export interface UseDialogReturn {
    show: (options?: ShowDialogOptions) => DialogInstance
    open: (options?: ShowDialogOptions) => DialogInstance
    close: () => void
    isOpen: Ref<boolean>
}

export function useDialog(): UseDialogReturn {
    const isOpen = ref(false)
    let currentInstance: DialogInstance | null = null

    const show = (options?: ShowDialogOptions): DialogInstance => {
        const instance = showDialog(options)
        currentInstance = instance
        isOpen.value = true
        instance.promise.finally(() => {
            if (currentInstance === instance) {
                isOpen.value = false
                currentInstance = null
            }
        })
        return instance
    }

    const close = (): void => {
        if (currentInstance) {
            currentInstance.close()
        }
    }

    onUnmounted(() => {
        currentInstance?.close()
    })

    return {
        show,
        open: show,
        close,
        isOpen,
    }
}
