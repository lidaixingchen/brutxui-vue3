import type { AppContext } from 'vue'
import { mountOverlay, type OverlayInstanceHandle } from '@/lib/render-imperative'
import MessageBox, { type MessageBoxProps } from './MessageBox.vue'
import type { MessageBoxType } from './message-box-variants'
import { canUseDocumentBody } from '@/lib/env'

export type MessageBoxAction = 'confirm' | 'cancel' | 'destroy'

export interface MessageBoxResult {
    /** 关闭路径：confirm=确认按钮；cancel=取消/ESC/遮罩/关闭按钮；destroy=手动销毁 */
    action: MessageBoxAction
    /** 输入框确认时的值（showInput / showPrompt 场景） */
    value?: string
}

export interface MessageBoxOptions extends Omit<MessageBoxProps, 'open'> {
    appContext?: AppContext
    transitionDuration?: number
    enableEsc?: boolean
}

export type MessageBoxInstance = OverlayInstanceHandle<MessageBoxResult>

/**
 * 命令式展示 MessageBox 弹层
 */
export function showMessageBox(options: MessageBoxOptions = {}): MessageBoxInstance {
    return mountOverlay<MessageBoxProps, MessageBoxResult>(
        MessageBox,
        (context) => ({
            ...options,
            open: context.isOpen.value,
            zIndex: options.zIndex ?? context.zIndex,
            'onUpdate:open': (val: boolean) => {
                if (!val) {
                    context.close({ action: 'cancel' })
                }
            },
            onConfirm: (val?: string) => {
                context.close({ action: 'confirm', value: val })
            },
            onCancel: () => {
                context.close({ action: 'cancel' })
            },
        }),
        {
            appContext: options.appContext,
            transitionDuration: options.transitionDuration,
            zIndex: options.zIndex,
            enableEsc: options.enableEsc,
        }
    )
}

/**
 * 便捷确认对话框（Promise 兑现为 boolean）
 */
export async function showConfirm(
    optionsOrMessage: string | MessageBoxOptions,
    options: MessageBoxOptions = {}
): Promise<boolean> {
    if (!canUseDocumentBody()) return false

    const mergedOptions: MessageBoxOptions = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage, ...options }
        : optionsOrMessage

    const instance = showMessageBox({
        type: 'warning',
        ...mergedOptions,
    })

    const result = await instance.promise
    return result.action === 'confirm'
}

/**
 * 便捷提示对话框（无取消按钮）
 */
export async function showAlert(
    optionsOrMessage: string | MessageBoxOptions,
    options: MessageBoxOptions = {}
): Promise<void> {
    if (!canUseDocumentBody()) return

    const mergedOptions: MessageBoxOptions = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage, ...options }
        : optionsOrMessage

    const instance = showMessageBox({
        type: 'info',
        showCancelButton: false,
        ...mergedOptions,
    })

    await instance.promise
}

/**
 * 便捷输入提示框（内置 input，Promise 兑现输入结果对象）
 */
export async function showPrompt(
    optionsOrMessage: string | MessageBoxOptions,
    options: MessageBoxOptions = {}
): Promise<MessageBoxResult> {
    if (!canUseDocumentBody()) return { action: 'cancel' }

    const mergedOptions: MessageBoxOptions = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage, ...options }
        : optionsOrMessage

    const instance = showMessageBox({
        showInput: true,
        ...mergedOptions,
    })

    return await instance.promise
}

export type { MessageBoxType }
