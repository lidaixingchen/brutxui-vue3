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
    // 防止组件在挂载/卸载钩子中重复触发 close 时，options.onClose 副作用被多次执行
    let isClosing = false

    const handleClose = () => {
        if (isClosing) return
        isClosing = true
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

    // 先入 DOM 再渲染：确保组件 mounted 生命周期中容器真实存在于文档流（可做布局/DOM 测量），
    // 且组件挂载期同步触发 onClose 时，destroy 的容器移除不会先于 appendChild 变成空操作而泄漏节点
    doc.body!.appendChild(container)
    render(vnode, container)

    function destroy() {
        if (isDestroyed) return
        isDestroyed = true

        const delay = options.transitionDuration ?? DEFAULT_DIALOG_TRANSITION_MS
        if (delay > 0) {
            // 延迟到关闭动效结束后再卸载组件并移除容器：立即 render(null) 会让 Vue 的
            // leave 过渡动画无法播放，与"组件关闭动效结束后提供 GC 销毁"的契约不符
            setTimeout(() => {
                render(null, container)
                container.remove()
            }, delay)
        } else {
            render(null, container)
            container.remove()
        }
    }

    return {
        destroy,
    }
}
