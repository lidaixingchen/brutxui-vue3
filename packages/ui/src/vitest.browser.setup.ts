import { afterAll, vi } from 'vitest'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// 将原生 scrollIntoView 替换为空实现，避免浏览器环境下滚动干扰测试。
// 使用 vi.spyOn 而非直接覆盖原型：不永久污染全局，且由 vitest 管理生命周期。
const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
afterAll(() => {
    scrollIntoViewSpy.mockRestore()
})

export const LOCALE_KEY = LOCALE_INJECTION_KEY
export const LOCALE_VALUE = zhCN
