import type { AppContext } from 'vue'
import { mountOverlay, type OverlayInstanceHandle } from '@/lib/render-imperative'
import MessageBox, { type MessageBoxProps } from './MessageBox.vue'
import type { MessageBoxType } from './message-box-variants'
import { canUseDocumentBody } from '@/lib/env'

export type { MessageBoxType }

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
    const { appContext, transitionDuration, enableEsc, ...componentProps } = options

    return mountOverlay<MessageBoxProps, MessageBoxResult>(
        MessageBox,
        (context) => ({
            ...componentProps,
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
            appContext,
            transitionDuration,
            zIndex: options.zIndex,
            enableEsc,
        }
    )
}

function normalizeMessageBoxOptions(
    optionsOrMessage: string | MessageBoxOptions,
    extraOptions: MessageBoxOptions = {},
    fallbackType: MessageBoxType = 'info'
): MessageBoxOptions {
    const base: MessageBoxOptions = typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage, ...extraOptions }
        : { ...extraOptions, ...optionsOrMessage }

    return {
        type: fallbackType,
        ...base,
    }
}

/**
 * 便捷确认对话框（Promise 兑现为 boolean）
 */
export async function showConfirm(
    optionsOrMessage: string | MessageBoxOptions,
    options: MessageBoxOptions = {}
): Promise<boolean> {
    if (!canUseDocumentBody()) return false

    const mergedOptions = normalizeMessageBoxOptions(optionsOrMessage, options, 'warning')
    const instance = showMessageBox(mergedOptions)

    const result = (await instance.promise) ?? { action: 'cancel' }
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

    const mergedOptions = normalizeMessageBoxOptions(
        optionsOrMessage,
        { showCancelButton: false, ...options },
        'info'
    )
    const instance = showMessageBox(mergedOptions)

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

    const mergedOptions = normalizeMessageBoxOptions(
        optionsOrMessage,
        { showInput: true, ...options },
        'info'
    )
    const instance = showMessageBox(mergedOptions)

    const result = (await instance.promise) ?? { action: 'cancel' }
    return result
}
