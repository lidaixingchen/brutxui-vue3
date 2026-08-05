import type { App, MaybeRef, AppContext } from 'vue'
import type { Locale } from './locales/types'
import { LOCALE_INJECTION_KEY } from './composables/useLocale'
import { zhCN } from './locales/zh-CN'
import { vLoading } from './directives/loading'

export interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
}

// 模块私有变量：仅通过受控 setter 写入，避免外部模块随意改写全局 App 引用
let globalApp: App | null = null

function setGlobalApp(app: App): void {
    // 重复安装时告警，避免命令式 API 静默绑定到最后一个 App，旧 App 引用无法释放
    if (globalApp && globalApp !== app) {
        console.warn('[BrutxUI] 检测到重复安装 BrutxUIPlugin，命令式 API 将绑定到最新的 App 实例。')
    }
    globalApp = app
}

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
        setGlobalApp(app)

        const locale = options.locale ?? zhCN
        app.provide(LOCALE_INJECTION_KEY, locale)

        // 注册全局 v-loading 指令
        app.directive('loading', vLoading)
    },
}
