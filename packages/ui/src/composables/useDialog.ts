import { ref, readonly, onUnmounted, getCurrentInstance, type Ref } from 'vue'
import {
    showDialog,
    type ShowDialogOptions,
    type DialogInstance,
    type DialogAction,
    type DialogResult,
} from '@/components/dialog/functional'

export type { ShowDialogOptions, DialogInstance, DialogAction, DialogResult }

export interface UseDialogReturn {
    show: <T = unknown>(options?: ShowDialogOptions<T>) => DialogInstance<T>
    open: <T = unknown>(options?: ShowDialogOptions<T>) => DialogInstance<T>
    close: (result?: DialogResult) => void
    isOpen: Readonly<Ref<boolean>>
}

/**
 * 组合式 Dialog 管理接口
 */
export function useDialog(): UseDialogReturn {
    const instanceContext = getCurrentInstance()?.appContext
    const isOpen = ref(false)
    let currentInstance: DialogInstance<unknown> | null = null

    const show = <T = unknown>(options?: ShowDialogOptions<T>): DialogInstance<T> => {
        if (currentInstance) {
            currentInstance.close()
        }
        let instance: DialogInstance<T>
        try {
            instance = showDialog<T>({
                appContext: options?.appContext ?? instanceContext,
                ...options,
            })
        } catch (error) {
            // showDialog 同步抛错时恢复状态
            currentInstance = null
            isOpen.value = false
            throw error
        }
        currentInstance = instance as DialogInstance<unknown>
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

    const close = (result?: DialogResult): void => {
        if (currentInstance) {
            isOpen.value = false
            currentInstance.close(result)
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
