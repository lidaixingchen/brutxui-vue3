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
        if (currentInstance) {
            currentInstance.close()
        }
        let instance: DialogInstance
        try {
            instance = showDialog(options)
        } catch (error) {
            // showDialog 同步抛错（如渲染/组件 setup 失败）时恢复状态：
            // 旧实例已被 close，调用方拿不到新实例，isOpen 不应停留在 true
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
        // then(onFulfilled, onRejected) 显式处理两种终态：
        // .finally() 返回的新 Promise 在 reject 时会产生未处理的 rejection
        instance.promise.then(cleanup, cleanup)
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
