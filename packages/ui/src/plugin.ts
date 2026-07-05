import type { App, MaybeRef, AppContext } from 'vue'
import type { Locale } from './locales/types'
import { LOCALE_INJECTION_KEY } from './composables/useLocale'
import { zhCN } from './locales/zh-CN'
import { vLoading } from './directives/loading'

export interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
}

export let globalApp: App | null = null

/**
 * 获取全局 App 上下文，使命令式 API 能继承 i18n/theme 的 provide 链。
 *
 * 注意：Vue 暂未公开 AppContext 的获取方式，此处通过 app 实例间接访问内部字段。
 * 集中在此处便于未来 Vue 公开 API 后统一升级。
 */
export function getGlobalAppContext(): AppContext | null {
    if (!globalApp) return null
    return (globalApp as unknown as { _context: AppContext })._context ?? null
}

export const BrutxUIPlugin = {
    install(app: App, options: BrutxUIPluginOptions = {}) {
        globalApp = app

        const locale = options.locale ?? zhCN
        app.provide(LOCALE_INJECTION_KEY, locale)

        // 注册全局 v-loading 指令
        app.directive('loading', vLoading)
    },
}
