import type { App, AppContext } from 'vue'
import { isClient } from './env'

let globalApp: App | null = null

export function setGlobalApp(app: App): void {
    if (!isClient) return
    if (globalApp && globalApp !== app) {
        console.warn('[BrutxUI] 检测到重复安装 BrutxUIPlugin，命令式 API 将绑定到最新的 App 实例。')
    }
    globalApp = app
    if (typeof app.onUnmount === 'function') {
        app.onUnmount(() => {
            if (globalApp === app) {
                globalApp = null
            }
        })
    }
}

export function getGlobalAppContext(): AppContext | null {
    if (!isClient || !globalApp) return null
    const ctx = (globalApp as unknown as { _context?: unknown })._context
    return typeof ctx === 'object' && ctx !== null ? (ctx as AppContext) : null
}

