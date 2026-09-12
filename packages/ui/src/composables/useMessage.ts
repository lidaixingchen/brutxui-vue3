import { getCurrentInstance, onUnmounted } from 'vue'
import { mountOverlay, type OverlayInstanceHandle } from '../lib/render-imperative'
import { getWindow, isClient } from '../lib/env'
import {
    DEFAULT_MESSAGE_DURATION_MS,
    MESSAGE_GRACE_PERIOD_MS,
} from '../lib/defaults'
import MessageContainer from '../components/message/MessageContainer.vue'
import {
    appendMessage,
    clearMessageStore,
    messageStore,
    removeMessage,
    setMessageStoreChangeListener,
} from '../lib/message-state'
import type { MessageItem, MessageOptions, UseMessageReturn } from '@/types/message'

export type { MessageItem, MessageOptions, MessageType, UseMessageReturn } from '@/types/message'
export { messageStore, removeMessage } from '../lib/message-state'

let instance: OverlayInstanceHandle<void> | null = null
let refCount = 0
let generation = 0
let graceTimer: ReturnType<typeof setTimeout> | null = null
let messageIdCounter = 0
let beforeUnloadHandler: (() => void) | null = null

function registerBeforeUnload(): void {
    if (!isClient || beforeUnloadHandler) return
    beforeUnloadHandler = () => destroyFallback()
    getWindow()?.addEventListener('beforeunload', beforeUnloadHandler)
}

function unregisterBeforeUnload(): void {
    if (beforeUnloadHandler) {
        getWindow()?.removeEventListener('beforeunload', beforeUnloadHandler)
        beforeUnloadHandler = null
    }
}

function scheduleGC(): void {
    if (graceTimer) {
        clearTimeout(graceTimer)
        graceTimer = null
    }

    // 活跃消息守卫：只要当前仍有未过期的活跃消息，容器必须维持存续，
    // 避免页面跳转或弹窗关闭卸载组件时提前杀死正在展示的提示
    if (messageStore.value.length > 0) return

    // 宿主守卫：若仍有组件处于 setup 存活周期中，保持容器常驻
    if (refCount > 0) return

    graceTimer = setTimeout(() => {
        graceTimer = null
        if (messageStore.value.length === 0 && refCount <= 0 && instance) {
            instance.destroy()
            instance = null
            unregisterBeforeUnload()
        }
    }, MESSAGE_GRACE_PERIOD_MS)
}

function cancelGraceTimer(): void {
    if (graceTimer) {
        clearTimeout(graceTimer)
        graceTimer = null
    }
}

function ensureMounted(): void {
    if (!isClient) return
    if (instance) return
    instance = mountOverlay(MessageContainer, {}, {
        modal: false,
    })
    registerBeforeUnload()
}

function addMessage(options: MessageOptions): () => void {
    // SSR 守卫：非客户端环境不写入全局 messageStore，也不启动定时器，避免跨请求共享与定时器堆积
    if (!isClient) return () => {}

    cancelGraceTimer()

    const id = `msg-${++messageIdCounter}`
    const item: MessageItem = {
        id,
        type: options.type ?? 'info',
        title: options.title ?? '',
        description: options.description,
        duration: options.duration ?? DEFAULT_MESSAGE_DURATION_MS,
        closable: options.closable ?? true,
    }

    appendMessage(item)
    ensureMounted()

    return () => {
        removeMessage(id)
    }
}

export function useMessage(): UseMessageReturn {
    if (!isClient) {
        const noop = () => () => {}
        return {
            show: noop,
            info: noop,
            success: noop,
            warning: noop,
            error: noop,
        }
    }

    if (getCurrentInstance()) {
        const currentGeneration = generation
        refCount++
        onUnmounted(() => {
            if (currentGeneration !== generation) return
            refCount--
            scheduleGC()
        })
    }

    function show(options: MessageOptions): () => void {
        return addMessage(options)
    }

    function info(title: string, description?: string): () => void {
        return addMessage({ type: 'info', title, description })
    }

    function success(title: string, description?: string): () => void {
        return addMessage({ type: 'success', title, description })
    }

    function warning(title: string, description?: string): () => void {
        return addMessage({ type: 'warning', title, description })
    }

    function error(title: string, description?: string): () => void {
        return addMessage({ type: 'error', title, description })
    }

    return { show, info, success, warning, error }
}

/**
 * 显式销毁全局 Message 系统（清空全部活跃定时器、Store 与 DOM 容器）。
 * 推荐在测试隔离、多应用同页或热更新边界调用。
 */
export function destroyFallback(): void {
    generation++
    unregisterBeforeUnload()
    cancelGraceTimer()
    clearMessageStore()
    refCount = 0
    if (instance) {
        instance.destroy()
        instance = null
    }
}

/** @deprecated 请使用 {@link destroyFallback} */
export const destroyMessageSystem = destroyFallback

setMessageStoreChangeListener(scheduleGC)
