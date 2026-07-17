import { createVNode, render, type Component, type AppContext } from 'vue'
import { canUseDocumentBody, getDocument } from './env'
import { DEFAULT_DIALOG_TRANSITION_MS } from './defaults'
import { getGlobalAppContext } from '../plugin'

export interface RenderImperativeOptions {
    appContext?: AppContext
    onClose?: () => void
    transitionDuration?: number
}

export interface RenderImperativeReturn {
    destroy: () => void
}

/**
 * 命令式渲染挂载组件的辅助工具（函数式 API 基础）
 * 解决脱离 Vue 主应用树导致 provide/inject 上下文（如 i18n, Pinia）丢失问题，
 * 并在组件关闭动效结束后提供自动垃圾回收（GC）销毁机制。
 */
export function renderImperative(
    component: Component,
    props: Record<string, unknown> = {},
    options: RenderImperativeOptions = {}
): RenderImperativeReturn {
    if (!canUseDocumentBody()) {
        return {
            destroy: () => {},
        }
    }

    const doc = getDocument()!
    const container = doc.createElement('div')
    let isDestroyed = false
    // 跟踪未触发的 removeContainer timer，避免快速导航场景下多个 timeout 堆积
    let pendingRemoveTimer: ReturnType<typeof setTimeout> | null = null

    const handleClose = () => {
        try {
            options.onClose?.()
        } finally {
            destroy()
        }
    }

    const vnode = createVNode(component, {
        ...props,
        onClose: handleClose,
        onDestroy: handleClose,
    })

    // 继承全局 App Context 或是手动传入的上下文，防止 i18n / theme 丢失
    vnode.appContext = options.appContext || getGlobalAppContext()

    render(vnode, container)

    // 挂载整个容器而非仅 firstElementChild，避免多根 fragment 场景下丢失其他根节点
    doc.body!.appendChild(container)

    function destroy() {
        if (isDestroyed) return
        isDestroyed = true

        render(null, container)

        const removeContainer = () => {
            pendingRemoveTimer = null
            container.remove()
        }

        const delay = options.transitionDuration ?? DEFAULT_DIALOG_TRANSITION_MS
        if (delay > 0) {
            // 防御性清理：isDestroyed 已防止重复进入 destroy，但显式跟踪 timer
            // 可在 isDestroyed 逻辑变更时仍保证不堆积，符合通用 timer 管理最佳实践
            if (pendingRemoveTimer !== null) {
                clearTimeout(pendingRemoveTimer)
            }
            pendingRemoveTimer = setTimeout(removeContainer, delay)
        } else {
            removeContainer()
        }
    }

    return {
        destroy,
    }
}
