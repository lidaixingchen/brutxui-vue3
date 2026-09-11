import { h, defineComponent, isVNode, type Component, type VNode, type AppContext } from 'vue'
import { DialogRoot } from 'reka-ui'
import DialogEnhanced from './DialogEnhanced.vue'
import DialogHeader from './DialogHeader.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'
import DialogFooter from './DialogFooter.vue'
import { mountOverlay, type OverlayInstanceHandle } from '@/lib/render-imperative'

export type RenderableContent = string | Component | VNode | (() => string | Component | VNode | null)

export type DialogSize = 'sm' | 'default' | 'lg' | 'xl' | 'full'

const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    default: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: '',
}

export type DialogAction = 'confirm' | 'cancel' | 'close' | 'destroy'

export interface DialogResult<T = unknown> {
    action: DialogAction
    data?: T
}

export interface ShowDialogOptions<T = unknown> {
    title?: string
    description?: string
    content?: RenderableContent
    footer?: RenderableContent | ((context: { close: (result?: DialogResult<T>) => void }) => RenderableContent)
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
    appContext?: AppContext
    transitionDuration?: number
    onCancel?: () => void
}

export type DialogInstance<T = unknown> = OverlayInstanceHandle<DialogResult<T>>

function renderSlot(slotVal: RenderableContent | undefined): VNode | null {
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

function getDialogEnhancedProps<T>(options: ShowDialogOptions<T>): Record<string, unknown> {
    const keys: Array<keyof ShowDialogOptions<T>> = [
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
        'class',
    ]
    const props: Record<string, unknown> = {}
    for (const key of keys) {
        if (options[key] !== undefined) {
            props[key] = options[key]
        }
    }

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

/**
 * 命令式展示通用 Dialog 容器
 */
export function showDialog<T = unknown>(options: ShowDialogOptions<T> = {}): DialogInstance<T> {
    let overlayContext: {
        close: (result?: DialogResult<T>) => void
        destroy: (result?: DialogResult<T>) => void
    } | null = null

    const DialogImperativeWrapper = defineComponent({
        name: 'DialogImperativeWrapper',
        props: {
            open: { type: Boolean, default: true },
            zIndex: { type: Number, default: undefined },
        },
        emits: ['update:open'],
        setup(props, { emit }) {
            const handleFooterSlot = () => {
                if (!options.footer) return null
                if (typeof options.footer === 'function') {
                    const renderFn = options.footer as (ctx: { close: (result?: DialogResult<T>) => void }) => RenderableContent
                    const res = renderFn({
                        close: (result = { action: 'close' }) => overlayContext?.close(result),
                    })
                    return renderSlot(res)
                }
                return renderSlot(options.footer as RenderableContent)
            }

            return () => {
                return h(
                    DialogRoot,
                    {
                        open: props.open,
                        'onUpdate:open': (val: boolean) => {
                            emit('update:open', val)
                        },
                    },
                    {
                        default: () =>
                            h(
                                DialogEnhanced,
                                {
                                    ...getDialogEnhancedProps(options),
                                    zIndex: props.zIndex ?? options.zIndex,
                                    'onUpdate:open': (val: boolean) => {
                                        emit('update:open', val)
                                    },
                                },
                                {
                                    default: () => [
                                        options.title
                                            ? h(DialogHeader, null, {
                                                  default: () =>
                                                      h(DialogTitle, null, {
                                                          default: () => options.title,
                                                      }),
                                              })
                                            : null,
                                        options.description
                                            ? h(DialogDescription, null, {
                                                  default: () => options.description,
                                              })
                                            : null,
                                        options.content
                                            ? h('div', { class: 'py-4' }, [
                                                  renderSlot(options.content),
                                              ])
                                            : null,
                                        options.footer
                                            ? h(DialogFooter, null, {
                                                  default: handleFooterSlot,
                                              })
                                            : null,
                                    ],
                                }
                            ),
                    }
                )
            }
        },
    })

    const handle = mountOverlay<Record<string, unknown>, DialogResult<T>>(
        DialogImperativeWrapper,
        (context) => {
            overlayContext = context
            return {
                open: context.isOpen.value,
                zIndex: options.zIndex ?? context.zIndex,
                'onUpdate:open': (val: boolean) => {
                    if (!val) {
                        options.onCancel?.()
                        context.close({ action: 'cancel' })
                    }
                },
            }
        },
        {
            appContext: options.appContext,
            transitionDuration: options.transitionDuration,
            zIndex: options.zIndex,
        }
    )

    return {
        ...handle,
        close: (result = { action: 'close' }) => {
            if (result.action === 'cancel') {
                options.onCancel?.()
            }
            handle.close(result)
        },
        destroy: (result = { action: 'destroy' }) => {
            if (result.action === 'cancel') {
                options.onCancel?.()
            }
            handle.destroy(result)
        },
    }
}
