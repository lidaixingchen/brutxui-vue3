import { readonly, shallowRef, type DeepReadonly, type Ref } from 'vue'
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

const messageStoreRef = shallowRef<MessageItem[]>([])
// 只读视图：消息列表仅能经 useMessage()/removeMessage/destroyMessageSystem 修改，
// 外部直写会绕过 duration 定时器与 GC，故导出 readonly 代理
export const messageStore: DeepReadonly<Ref<MessageItem[]>> = readonly(messageStoreRef)

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
    messageStoreRef.value = messageStoreRef.value.filter(m => m.id !== id)
    scheduleGC()
}

function scheduleGC(): void {
    if (graceTimer) {
        clearTimeout(graceTimer)
        graceTimer = null
    }
    if (messageStoreRef.value.length > 0) return
    graceTimer = setTimeout(() => {
        graceTimer = null
        if (messageStoreRef.value.length === 0 && instance) {
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
    })
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

    messageStoreRef.value = [...messageStoreRef.value, item]
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
    messageStoreRef.value = []
    // 注意：messageIdCounter 保持单调递增，不归零——旧消息 close() 闭包捕获的 id（msg-N）
    // 若在新消息创建后才被调用，归零会使其按相同 id 误删无关的新消息，破坏数据完整性
    if (instance) {
        instance.destroy()
        instance = null
    }
}
