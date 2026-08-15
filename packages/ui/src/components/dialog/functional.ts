/* eslint-disable vue/one-component-per-file */
import { createVNode, render, ref, h, defineComponent, watch, computed, isVNode } from 'vue'
import type { Component, VNode } from 'vue'
import { DialogRoot } from 'reka-ui'
import DialogEnhanced from './DialogEnhanced.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'
import DialogFooter from './DialogFooter.vue'
import Button from '../button/Button.vue'
import Input from '../input/Input.vue'
import { useLocale } from '@/composables/useLocale'
import { DEFAULT_DIALOG_TRANSITION_MS } from '@/lib/defaults'
import { canUseDocumentBody, getDocument } from '@/lib/env'
import { getGlobalAppContext } from '@/plugin'

export type RenderableContent = string | Component | VNode | (() => string | Component | VNode | null)

export type DialogSize = 'sm' | 'default' | 'lg' | 'xl' | 'full'

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: '',
}

export interface ShowDialogOptions {
    title?: string
    content?: RenderableContent
    footer?: RenderableContent
    draggable?: boolean
    dragHandle?: string | HTMLElement
    bounds?: 'parent' | 'viewport' | { top: number; left: number; right: number; bottom: number }
    initialPosition?: { x: number; y: number }
    resizable?: boolean
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
    aspectRatio?: number
    showCloseButton?: boolean
    forceMount?: boolean
    fullscreen?: boolean
    beforeClose?: () => boolean | Promise<boolean>
    destroyOnClose?: boolean
    zIndex?: number
    class?: string
    size?: DialogSize
    onConfirm?: () => void
    onCancel?: () => void
}

export interface MessageBoxOptions extends ShowDialogOptions {
    message?: string
    type?: 'info' | 'success' | 'warning' | 'error'
    showCancelButton?: boolean
    cancelButtonText?: string
    confirmButtonText?: string
    confirmButtonClass?: string
    cancelButtonClass?: string
    showInput?: boolean
    inputPlaceholder?: string
    inputValue?: string
    inputPattern?: RegExp
    inputErrorMessage?: string
}

function getDialogEnhancedProps(options: ShowDialogOptions): Record<string, unknown> {
    const keys: Array<keyof ShowDialogOptions> = [
        'draggable',
        'dragHandle',
        'bounds',
        'initialPosition',
        'resizable',
        'minWidth',
        'minHeight',
        'maxWidth',
        'maxHeight',
        'aspectRatio',
        'showCloseButton',
        'forceMount',
        'fullscreen',
        'beforeClose',
        'destroyOnClose',
        'zIndex',
        'class'
    ]
    const props: Record<string, unknown> = {}
    for (const key of keys) {
        if (options[key] !== undefined) {
            props[key] = options[key]
        }
    }

    // size='full' 映射到 fullscreen；其余 size 合并为 class 透传给 DialogEnhanced
    const size = options.size
    if (size === 'full') {
        props.fullscreen = true
    } else if (size) {
        const sizeClass = DIALOG_SIZE_CLASSES[size]
        const existingClass = (props.class as string) || ''
        props.class = existingClass ? `${existingClass} ${sizeClass}` : sizeClass
    }

    return props
}

export function showDialog(options: ShowDialogOptions = {}) {
    const doc = getDocument()
    if (!doc || !doc.body) {
        return {
            close: () => {},
            promise: Promise.resolve(),
            destroy: () => {},
        }
    }

    const container = doc.createElement('div')
    doc.body.appendChild(container)

    const isOpen = ref(true)

    let resolvePromise: () => void
    const promise = new Promise<void>((resolve) => {
        resolvePromise = () => resolve()
    })

    const close = () => {
        isOpen.value = false
    }

    let destroyTimer: ReturnType<typeof setTimeout> | undefined
    let isDestroyed = false

    const destroy = () => {
        // 幂等守卫：过渡定时器触发后再手动 destroy、或重复调用时跳过重复清理
        if (isDestroyed) return
        isDestroyed = true
        // 取消已排定的关闭过渡定时器，避免手动 destroy 后定时器再次执行
        if (destroyTimer) {
            clearTimeout(destroyTimer)
            destroyTimer = undefined
        }
        stopWatch()
        render(null, container)
        container.remove()
        resolvePromise()
    }

    const stopWatch = watch(isOpen, (newVal) => {
        if (!newVal) {
            destroyTimer = setTimeout(destroy, DEFAULT_DIALOG_TRANSITION_MS)
        }
    })

    const renderSlot = (slotVal: RenderableContent | undefined) => {
        if (!slotVal) return null
        if (typeof slotVal === 'string') {
            return h('div', { class: 'text-sm font-medium leading-relaxed' }, slotVal)
        }
        if (typeof slotVal === 'function') {
            return renderSlot((slotVal as () => RenderableContent)())
        }
        if (isVNode(slotVal)) {
            return slotVal
        }
        return h(slotVal as Component)
    }

    const component = defineComponent({
        setup() {
            const { t } = useLocale()

            return () => {
                // 当未显式传入 footer 但提供了 onConfirm/onCancel 时，自动生成确认/取消按钮
                const hasAutoFooter = !options.footer && (options.onConfirm || options.onCancel)
                const autoFooter = hasAutoFooter ? h(DialogFooter, { class: 'flex justify-end gap-3 mt-4' }, {
                    default: () => [
                        options.onCancel ? h(Button, {
                            variant: 'outline',
                            onClick: () => {
                                options.onCancel?.()
                                close()
                            }
                        }, {
                            default: () => t('dialog.cancel')
                        }) : null,
                        options.onConfirm ? h(Button, {
                            variant: 'default',
                            onClick: () => {
                                options.onConfirm?.()
                                close()
                            }
                        }, {
                            default: () => t('dialog.confirm')
                        }) : null,
                    ]
                }) : null

                return h(DialogRoot, {
                    open: isOpen.value,
                    'onUpdate:open': (val: boolean) => {
                        isOpen.value = val
                    }
                }, {
                    default: () => h(DialogEnhanced, {
                        ...getDialogEnhancedProps(options),
                        'onUpdate:open': (val: boolean) => {
                            isOpen.value = val
                        }
                    }, {
                        default: () => [
                            options.title ? h(DialogHeader, null, {
                                default: () => h(DialogTitle, null, { default: () => options.title })
                            }) : null,
                            options.content ? h('div', { class: 'py-4' }, [renderSlot(options.content)]) : null,
                            options.footer ? h(DialogFooter, null, {
                                default: () => renderSlot(options.footer)
                            }) : autoFooter
                        ]
                    })
                })
            }
        }
    })

    const vnode = createVNode(component)
    vnode.appContext = getGlobalAppContext()
    render(vnode, container)

    return {
        close,
        promise,
        destroy,
    }
}

export type MessageBoxResult = {
    /** 关闭路径：confirm=确认按钮；cancel=取消/ESC/遮罩/关闭按钮；destroy=手动销毁 */
    action: 'confirm' | 'cancel' | 'destroy'
    /** 输入框确认时的值（showInput 场景） */
    value?: string
}

export function showMessageBox(options: MessageBoxOptions = {}) {
    if (!canUseDocumentBody()) {
        return {
            close: () => {},
            promise: Promise.resolve({ action: 'cancel' as const }),
            destroy: () => {},
        }
    }

    const doc = getDocument()!
    const container = doc.createElement('div')
    doc.body!.appendChild(container)

    const isOpen = ref(true)
    const inputValue = ref(options.inputValue || '')
    const hasValidationError = ref(false)

    let resolvePromise: (result: MessageBoxResult) => void

    const promise = new Promise<MessageBoxResult>((resolve) => {
        resolvePromise = resolve
    })

    const close = () => {
        isOpen.value = false
    }

    let destroyTimer: ReturnType<typeof setTimeout> | undefined
    let isDestroyed = false

    const destroy = (action: MessageBoxResult['action'] = 'destroy') => {
        // 幂等守卫：过渡定时器触发后再手动 destroy、或重复调用时跳过重复清理
        if (isDestroyed) return
        isDestroyed = true
        // 取消已排定的关闭过渡定时器，避免手动 destroy 后定时器再次执行
        if (destroyTimer) {
            clearTimeout(destroyTimer)
            destroyTimer = undefined
        }
        stopWatch()
        render(null, container)
        container.remove()
        resolvePromise({ action })
    }

    const stopWatch = watch(isOpen, (newVal) => {
        if (!newVal) {
            destroyTimer = setTimeout(() => destroy('cancel'), DEFAULT_DIALOG_TRANSITION_MS)
        }
    })

    const handleConfirm = () => {
        if (options.showInput) {
            if (options.inputPattern && !options.inputPattern.test(inputValue.value)) {
                hasValidationError.value = true
                return
            }
            resolvePromise({ action: 'confirm', value: inputValue.value })
        } else {
            resolvePromise({ action: 'confirm' })
        }
        close()
    }

    const handleCancel = () => {
        resolvePromise({ action: 'cancel' })
        close()
    }

    const component = defineComponent({
        setup() {
            const { t } = useLocale()

            // 默认校验错误文案保持响应式：语言切换时跟随更新（仅未自定义时使用）
            const errorMessage = computed(() => options.inputErrorMessage || t('dialog.inputError'))

            const defaultConfirmText = computed(() => t('dialog.confirm'))
            const defaultCancelText = computed(() => t('dialog.cancel'))

            return () => {
                return h(DialogRoot, {
                    open: isOpen.value,
                    'onUpdate:open': (val: boolean) => {
                        isOpen.value = val
                    }
                }, {
                    default: () => h(DialogEnhanced, {
                        ...getDialogEnhancedProps(options),
                        'onUpdate:open': (val: boolean) => {
                            isOpen.value = val
                            if (!val) {
                                resolvePromise({ action: 'cancel' })
                            }
                        }
                    }, {
                        default: () => [
                            options.title ? h(DialogHeader, null, {
                                default: () => h(DialogTitle, null, { default: () => options.title })
                            }) : null,
                            
                            h('div', { class: 'py-4 flex flex-col gap-4' }, [
                                options.message ? h(DialogDescription, null, { default: () => options.message }) : null,
                                
                                options.showInput ? h(Input, {
                                    modelValue: inputValue.value,
                                    'onUpdate:modelValue': (val: string) => {
                                        inputValue.value = val
                                        hasValidationError.value = false
                                    },
                                    placeholder: options.inputPlaceholder,
                                    variant: hasValidationError.value ? 'error' : 'default',
                                    errorMessage: hasValidationError.value ? errorMessage.value : undefined
                                }) : null
                            ]),

                            h(DialogFooter, { class: 'flex justify-end gap-3 mt-4' }, {
                                default: () => [
                                    options.showCancelButton ? h(Button, {
                                        variant: 'outline',
                                        class: options.cancelButtonClass,
                                        onClick: handleCancel
                                    }, {
                                        default: () => options.cancelButtonText || defaultCancelText.value
                                    }) : null,
                                    h(Button, {
                                        variant: 'default',
                                        class: options.confirmButtonClass,
                                        onClick: handleConfirm
                                    }, {
                                        default: () => options.confirmButtonText || defaultConfirmText.value
                                    })
                                ]
                            })
                        ]
                    })
                })
            }
        }
    })

    const vnode = createVNode(component)
    vnode.appContext = getGlobalAppContext()
    render(vnode, container)

    return {
        close,
        promise,
        destroy,
    }
}
