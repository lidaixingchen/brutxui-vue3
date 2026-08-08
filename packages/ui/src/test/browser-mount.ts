import { createApp, type Component, type App } from 'vue'

interface MountOptions {
    props?: Record<string, unknown>
    attachTo?: HTMLElement
}

interface MountResult {
    vm: Record<string, unknown> | undefined
    element: HTMLElement
    unmount: () => void
    app: App
}

export function mount(component: Component, options: MountOptions = {}): MountResult {
    // 容器所有权：仅在本函数自动创建时，unmount 后才移除 host；调用方传入的 attachTo 由调用方管理
    const createdHost = options.attachTo === undefined
    const host = createdHost
        ? document.body.appendChild(document.createElement('div'))
        : options.attachTo!

    const app = createApp(component, options.props)

    let root: ReturnType<App['mount']> | undefined
    try {
        root = app.mount(host)
    } catch (err) {
        // mount 失败时移除自动创建的 host，避免残留污染后续测试 DOM
        if (createdHost && host.parentNode) {
            host.parentNode.removeChild(host)
        }
        throw err
    }

    // 优先使用根组件实例的 $el：对多根节点（fragment）/文本/注释根同样可靠；
    // 非 HTMLElement（如仅渲染文本）时回退到 host 容器
    const element = root?.$el instanceof HTMLElement ? root.$el : host

    return {
        // app.mount 返回值即根组件实例（ComponentPublicInstance），无需访问 app._instance 私有字段
        vm: root as unknown as Record<string, unknown> | undefined,
        element,
        unmount: () => {
            app.unmount()
            if (createdHost && host.parentNode) {
                host.parentNode.removeChild(host)
            }
        },
        app,
    }
}
