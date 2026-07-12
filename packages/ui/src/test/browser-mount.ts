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
    const host = options.attachTo ?? document.body.appendChild(document.createElement('div'))
    const app = createApp(component, options.props)
    app.mount(host)
    const element = (host.firstChild ?? host) as HTMLElement
    return {
        vm: app._instance?.proxy as Record<string, unknown> | undefined,
        element,
        unmount: () => {
            app.unmount()
            if (host !== options.attachTo && host.parentNode) {
                host.parentNode.removeChild(host)
            }
        },
        app,
    }
}
