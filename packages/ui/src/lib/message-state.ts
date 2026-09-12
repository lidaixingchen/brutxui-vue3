import { readonly, shallowRef, type DeepReadonly, type Ref } from 'vue'
import type { MessageItem } from '@/types/message'

const messageStoreRef = shallowRef<MessageItem[]>([])
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()
let changeListener: (() => void) | undefined

export const messageStore: DeepReadonly<Ref<MessageItem[]>> = readonly(messageStoreRef)

export function setMessageStoreChangeListener(listener: (() => void) | undefined): void {
    changeListener = listener
}

function clearTimer(id: string): void {
    const timer = timerMap.get(id)
    if (timer !== undefined) {
        clearTimeout(timer)
        timerMap.delete(id)
    }
}

export function appendMessage(item: MessageItem): void {
    messageStoreRef.value = [...messageStoreRef.value, item]

    if (item.duration > 0) {
        const timer = setTimeout(() => {
            timerMap.delete(item.id)
            removeMessage(item.id)
        }, item.duration)
        timerMap.set(item.id, timer)
    }
}

export function removeMessage(id: string): void {
    clearTimer(id)
    messageStoreRef.value = messageStoreRef.value.filter((message) => message.id !== id)
    changeListener?.()
}

export function clearMessageStore(): void {
    timerMap.forEach((timer) => clearTimeout(timer))
    timerMap.clear()
    messageStoreRef.value = []
}
