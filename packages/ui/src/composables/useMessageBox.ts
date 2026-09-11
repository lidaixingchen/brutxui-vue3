import { getCurrentInstance } from 'vue'
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
    const instanceContext = getCurrentInstance()?.appContext

    const mergeOptions = (opts?: MessageBoxOptions): MessageBoxOptions => {
        return {
            ...opts,
            appContext: opts?.appContext ?? instanceContext,
        }
    }

    const show = (options?: MessageBoxOptions): MessageBoxInstance => {
        return showMessageBox(mergeOptions(options))
    }

    const confirm = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<boolean> => {
        const resolvedOptions = mergeOptions(options)
        if (typeof optionsOrMessage === 'string') {
            return showConfirm(optionsOrMessage, resolvedOptions)
        }
        return showConfirm(mergeOptions(optionsOrMessage), resolvedOptions)
    }

    const alert = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<void> => {
        const resolvedOptions = mergeOptions(options)
        if (typeof optionsOrMessage === 'string') {
            return showAlert(optionsOrMessage, resolvedOptions)
        }
        return showAlert(mergeOptions(optionsOrMessage), resolvedOptions)
    }

    const prompt = (optionsOrMessage: string | MessageBoxOptions, options?: MessageBoxOptions): Promise<MessageBoxResult> => {
        const resolvedOptions = mergeOptions(options)
        if (typeof optionsOrMessage === 'string') {
            return showPrompt(optionsOrMessage, resolvedOptions)
        }
        return showPrompt(mergeOptions(optionsOrMessage), resolvedOptions)
    }

    return {
        show,
        confirm,
        alert,
        prompt,
    }
}
