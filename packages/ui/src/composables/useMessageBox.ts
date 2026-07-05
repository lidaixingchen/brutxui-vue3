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
            const result = await instance.promise
            // 有返回值表示确认（输入框场景），无返回值表示无确认操作
            return result !== undefined
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
