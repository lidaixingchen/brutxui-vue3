import type { App, MaybeRef } from 'vue'
import type { Locale } from './locales/types'
import { LOCALE_INJECTION_KEY } from './composables/useLocale'
import { zhCN } from './locales/zh-CN'
import { vLoading } from './directives/loading'
import { isClient } from './lib/env'
import { setGlobalApp } from './lib/app-context'
export { getGlobalAppContext } from './lib/app-context'
import { createToast, TOAST_KEY } from './composables/useToast'
import { createTheme, THEME_KEY, type ThemeOptions } from './composables/useTheme'

export interface BrutxUIPluginOptions {
    locale?: MaybeRef<Locale>
    toast?: { grouping?: boolean }
    theme?: ThemeOptions
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
