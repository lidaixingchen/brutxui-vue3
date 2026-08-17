import {
    showMessageBox,
    showConfirm,
    showAlert,
    showPrompt,
    type MessageBoxOptions,
    type MessageBoxResult,
    type MessageBoxInstance,
} from '@/components/message-box/functional'

export type { MessageBoxOptions, MessageBoxResult, MessageBoxInstance }

export interface UseMessageBoxReturn {
    show: (options?: MessageBoxOptions) => MessageBoxInstance
    confirm: (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions) => Promise<boolean>
    alert: (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions) => Promise<void>
    prompt: (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions) => Promise<MessageBoxResult>
}

/**
 * 组合式 MessageBox 接口
 */
export function useMessageBox(): UseMessageBoxReturn {
    const show = (options?: MessageBoxOptions): MessageBoxInstance => {
        return showMessageBox(options)
    }

    const confirm = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<boolean> => {
        return showConfirm(optionsOrMessage, options)
    }

    const alert = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<void> => {
        return showAlert(optionsOrMessage, options)
    }

    const prompt = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<MessageBoxResult> => {
        return showPrompt(optionsOrMessage, options)
    }

    return {
        show,
        confirm,
        alert,
        prompt,
    }
}
