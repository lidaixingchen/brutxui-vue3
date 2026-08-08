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
    // Vue 3.5+：App unmount 时解除对 App 实例的强引用，避免长驻导致组件树与 provide 数据无法 GC；
    // 重复安装同一 App 多次注册回调时，引用比较保证只释放当前 App
    app.onUnmount(() => {
        if (globalApp === app) {
            globalApp = null
        }
    })
}

/**
 * 获取全局 App 上下文，使命令式 API 能继承 i18n/theme 的 provide 链。
 *
 * 注意：Vue 暂未公开 AppContext 的获取方式（锁定 Vue 3.5.x），此处通过 app 实例
 * 访问内部字段 `_context`。访问前做能力探测，字段缺失（未来版本调整内部实现）
 * 时降级返回 null 而非静默返回错误上下文；待 Vue 公开 AppContext 获取 API 后统一替换。
 */
export function getGlobalAppContext(): AppContext | null {
    if (!globalApp) return null
    const ctx = (globalApp as unknown as { _context?: unknown })._context
    return typeof ctx === 'object' && ctx !== null ? (ctx as AppContext) : null
}

export const BrutxUIPlugin = {
    install(app: App, options: BrutxUIPluginOptions = {}) {
        setGlobalApp(app)

        const locale = options.locale ?? zhCN
        // 注入原始 MaybeRef<Locale>（而非 unref 后的快照）：useLocale 通过 computed + unref 消费，
        // 保持 Ref 更新后的响应式传导；任何直接 inject(LOCALE_INJECTION_KEY) 的调用方需自行 unref。
        app.provide(LOCALE_INJECTION_KEY, locale)

        // 注册全局 v-loading 指令
        app.directive('loading', vLoading)
    },
}
