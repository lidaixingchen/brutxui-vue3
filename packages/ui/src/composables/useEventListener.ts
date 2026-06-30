import { onMounted, onUnmounted, watch, isRef, type Ref } from 'vue'

type EventTargetLike = EventTarget | Window | Document | HTMLElement

export interface UseEventListenerOptions {
    /** 是否在组件挂载后才添加监听器（默认 true） */
    immediate?: boolean
}

/**
 * 统一管理事件监听器的 composable，确保在组件卸载时自动清理
 *
 * @param target - 事件目标（支持 Ref 或直接对象）
 * @param event - 事件名称
 * @param handler - 事件处理函数
 * @param options - addEventListener 选项
 * @param composableOptions - composable 自身选项
 */
export function useEventListener<K extends keyof WindowEventMap>(
    target: Ref<EventTargetLike | null> | EventTargetLike,
    event: K,
    handler: (e: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
    composableOptions?: UseEventListenerOptions,
): void

export function useEventListener<K extends keyof DocumentEventMap>(
    target: Ref<Document | null> | Document,
    event: K,
    handler: (e: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
    composableOptions?: UseEventListenerOptions,
): void

export function useEventListener<K extends keyof HTMLElementEventMap>(
    target: Ref<HTMLElement | null> | HTMLElement,
    event: K,
    handler: (e: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
    composableOptions?: UseEventListenerOptions,
): void

export function useEventListener(
    target: Ref<EventTargetLike | null> | EventTargetLike,
    event: string,
    handler: (e: Event) => void,
    options?: boolean | AddEventListenerOptions,
    composableOptions?: UseEventListenerOptions,
): void

export function useEventListener(
    target: Ref<EventTargetLike | null> | EventTargetLike,
    event: string,
    handler: (e: Event) => void,
    options?: boolean | AddEventListenerOptions,
    composableOptions: UseEventListenerOptions = {},
): void {
    const { immediate = true } = composableOptions

    let currentTarget: EventTargetLike | null = null

    function cleanup(): void {
        if (currentTarget) {
            currentTarget.removeEventListener(event, handler, options)
            currentTarget = null
        }
    }

    function add(): void {
        cleanup()

        const el = isRef(target) ? target.value : target
        if (el) {
            currentTarget = el
            el.addEventListener(event, handler, options)
        }
    }

    if (isRef(target)) {
        // 响应式目标：监听变化
        watch(target, (_newVal, _oldVal) => {
            add()
        }, { immediate })
    } else {
        // 静态目标：在挂载时添加
        if (immediate) {
            onMounted(() => {
                add()
            })
        } else {
            add()
        }
    }

    onUnmounted(() => {
        cleanup()
    })
}
