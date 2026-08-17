import { showMessageBox, type MessageBoxOptions, type MessageBoxResult } from '@/components/message-box/functional'
import { canUseDocumentBody } from '@/lib/env'

export type { MessageBoxOptions }

type MessageBoxInstance = { close: () => void; promise: Promise<MessageBoxResult>; destroy: () => void }

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
            // showMessageBox 契约：promise 兑现 { action }；仅 action='confirm' 视为确认，
            // 取消/关闭/销毁均兑现 { action: 'cancel' | 'destroy' }（不再 reject，无 unhandledrejection）
            const result = await instance.promise
            return result.action === 'confirm'
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
