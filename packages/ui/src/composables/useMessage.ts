import { shallowRef } from 'vue'
import { renderImperative, type RenderImperativeReturn } from '../lib/render-imperative'
import { isClient } from '../lib/env'
import { DEFAULT_MESSAGE_DURATION_MS, MESSAGE_GRACE_PERIOD_MS, DEFAULT_DIALOG_TRANSITION_MS } from '../lib/defaults'
import MessageContainer from '../components/message/MessageContainer.vue'

export type MessageType = 'info' | 'success' | 'warning' | 'error'

export interface MessageItem {
    id: string
    type: MessageType
    title: string
    description?: string
    duration: number
    closable: boolean
}

export interface MessageOptions {
    type?: MessageType
    title?: string
    description?: string
    duration?: number
    closable?: boolean
}

export interface UseMessageReturn {
    info: (title: string, description?: string) => () => void
    success: (title: string, description?: string) => () => void
    warning: (title: string, description?: string) => () => void
    error: (title: string, description?: string) => () => void
    show: (options: MessageOptions) => () => void
}

export const messageStore = shallowRef<MessageItem[]>([])

let instance: RenderImperativeReturn | null = null
let graceTimer: ReturnType<typeof setTimeout> | null = null
let messageIdCounter = 0
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

function clearTimer(id: string): void {
    const timer = timerMap.get(id)
    if (timer !== undefined) {
        clearTimeout(timer)
        timerMap.delete(id)
    }
}

export function removeMessage(id: string): void {
    clearTimer(id)
    messageStore.value = messageStore.value.filter(m => m.id !== id)
    scheduleGC()
}

function scheduleGC(): void {
    if (graceTimer) {
        clearTimeout(graceTimer)
        graceTimer = null
    }
    if (messageStore.value.length > 0) return
    graceTimer = setTimeout(() => {
        graceTimer = null
        if (messageStore.value.length === 0 && instance) {
            instance.destroy()
            instance = null
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
    instance = renderImperative(MessageContainer, {}, {
        transitionDuration: DEFAULT_DIALOG_TRANSITION_MS,
        onClose: () => {
            instance = null
        },
    })
}

function addMessage(options: MessageOptions): () => void {
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

    messageStore.value = [...messageStore.value, item]
    ensureMounted()

    if (item.duration > 0) {
        const timer = setTimeout(() => {
            timerMap.delete(id)
            removeMessage(id)
        }, item.duration)
        timerMap.set(id, timer)
    }

    return () => {
        clearTimer(id)
        removeMessage(id)
    }
}

export function useMessage(): UseMessageReturn {
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

export function destroyMessageSystem(): void {
    timerMap.forEach((timer) => clearTimeout(timer))
    timerMap.clear()
    cancelGraceTimer()
    messageStore.value = []
    messageIdCounter = 0
    if (instance) {
        instance.destroy()
        instance = null
    }
}
