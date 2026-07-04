import type { App, MaybeRef, AppContext } from 'vue'
import type { Locale } from './locales/types'
import { LOCALE_INJECTION_KEY } from './composables/useLocale'
import { zhCN } from './locales/zh-CN'
import { vLoading } from './directives/loading'

export interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
}

export let globalAppContext: AppContext | null = null

export const BrutxUIPlugin = {
    install(app: App, options: BrutxUIPluginOptions = {}) {
        globalAppContext = app._context
        
        const locale = options.locale ?? zhCN
        app.provide(LOCALE_INJECTION_KEY, locale)

        // 注册全局 v-loading 指令
        app.directive('loading', vLoading)
    },
}
