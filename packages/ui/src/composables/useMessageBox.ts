import { showMessageBox, type MessageBoxOptions } from '@/components/dialog/functional'

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
        const instance = showMessageBox(options)
        try {
            // showMessageBox 契约：promise 兑现即表示用户点击了确认（有/无输入均兑现），reject 表示取消或关闭
            await instance.promise
            return true
        } catch {
            // 用户点击取消或关闭
            return false
        }
    }

    return {
        show,
        confirm,
    }
}
