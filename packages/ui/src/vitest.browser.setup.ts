import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

Element.prototype.scrollIntoView = function scrollIntoView() {}

export const LOCALE_KEY = LOCALE_INJECTION_KEY
export const LOCALE_VALUE = zhCN
