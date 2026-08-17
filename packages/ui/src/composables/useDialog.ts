import { ref, readonly, onUnmounted, getCurrentInstance, type Ref, type DeepReadonly } from 'vue'
import { showDialog, type ShowDialogOptions, type DialogInstance } from '@/components/dialog/functional'

export type { ShowDialogOptions, DialogInstance }

export interface UseDialogReturn {
    show: (options?: ShowDialogOptions) => DialogInstance
    open: (options?: ShowDialogOptions) => DialogInstance
    close: () => void
    isOpen: DeepReadonly<Ref<boolean>> | Readonly<Ref<boolean>>
}

/**
 * 组合式 Dialog 管理接口
 */
export function useDialog(): UseDialogReturn {
    const isOpen = ref(false)
    let currentInstance: DialogInstance | null = null

    const show = (options?: ShowDialogOptions): DialogInstance => {
        if (currentInstance) {
            currentInstance.close()
        }
        let instance: DialogInstance
        try {
            instance = showDialog(options)
        } catch (error) {
            // showDialog 同步抛错时恢复状态
            currentInstance = null
            isOpen.value = false
            throw error
        }
        currentInstance = instance
        isOpen.value = true
        const cleanup = () => {
            if (currentInstance === instance) {
                isOpen.value = false
                currentInstance = null
            }
        }
        instance.promise.then(cleanup, cleanup)
        return instance
    }

    const close = (): void => {
        if (currentInstance) {
            isOpen.value = false
            currentInstance.close()
        }
    }

    if (getCurrentInstance()) {
        onUnmounted(() => {
            currentInstance?.close()
        })
    }

    return {
        show,
        open: show,
        close,
        isOpen: readonly(isOpen),
    }
}
