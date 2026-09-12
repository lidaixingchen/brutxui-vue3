import type { App, MaybeRef, AppContext } from 'vue'
import type { Locale } from './locales/types'
import { LOCALE_INJECTION_KEY } from './composables/useLocale'
import { zhCN } from './locales/zh-CN'
import { vLoading } from './directives/loading'
import { isClient } from './lib/env'
import { createToast, TOAST_KEY } from './composables/useToast'
import { createTheme, THEME_KEY, type ThemeOptions } from './composables/useTheme'

export interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
    toast?: { grouping?: boolean }
    theme?: ThemeOptions
}

let globalApp: App | null = null

function setGlobalApp(app: App): void {
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

export const BrutxUIPlugin = {
    install(app: App, options: BrutxUIPluginOptions = {}) {
        setGlobalApp(app)

        const locale = options.locale ?? zhCN
        app.provide(LOCALE_INJECTION_KEY, locale)

        const toast = createToast(false, options.toast)
        app.provide(TOAST_KEY, toast)

        const theme = createTheme(options.theme)
        app.provide(THEME_KEY, theme)

        if (isClient && typeof app.onUnmount === 'function') {
            app.onUnmount(() => {
                theme.destroy()
                toast.clearToasts()
            })
        }

        app.directive('loading', vLoading)
    },
}
