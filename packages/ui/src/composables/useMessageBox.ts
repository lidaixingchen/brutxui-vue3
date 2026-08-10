import { showMessageBox, type MessageBoxOptions } from '@/components/dialog/functional'
import { canUseDocumentBody } from '@/lib/env'

export type { MessageBoxOptions }

type MessageBoxInstance = { close: () => void; promise: Promise<{ value: string } | undefined>; destroy: () => void }

export interface UseMessageBoxReturn {
    show: (options?: MessageBoxOptions) => MessageBoxInstance
    confirm: (options?: MessageBoxOptions) => Promise<boolean>
}

export function useMessageBox(): UseMessageBoxReturn {
    const show = (options?: MessageBoxOptions): MessageBoxInstance => {
        return showMessageBox(options)
    }

    const confirm = async (options?: MessageBoxOptions): Promise<boolean> => {
        // SSR / 无 DOM 时无法展示对话框，视为取消，避免 confirm 误判为已确认
        if (!canUseDocumentBody()) return false

        const instance = showMessageBox(options)
        try {
            // showMessageBox 契约：promise 兑现即表示用户点击了确认（有/无输入均兑现），reject 表示取消或关闭
            await instance.promise
            return true
        } catch {
            // 用户点击取消或关闭
            return false
        } finally {
            // 显式清理 DOM 容器，不依赖底层 close→过渡动画→自动 destroy 的定时机制
            // （对已销毁的实例幂等）
            instance.destroy()
        }
    }

    return {
        show,
        confirm,
    }
}
