import { expect } from 'vitest'
import { configureAxe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import { config } from '@vue/test-utils'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'

// 同步注册 axe matcher，避免异步加载导致测试启动前未注册的竞态
expect.extend(matchers)

// 全局提供默认 locale，避免每个使用 useLocale() 的测试都要手动 provide
;(config.global.provide as Record<symbol, unknown>)[LOCALE_INJECTION_KEY as symbol] = zhCN

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

Element.prototype.scrollIntoView = function scrollIntoView() {}

// 导出配置好的 axe 实例供测试使用
export const axe = configureAxe({
    rules: {
        'color-contrast': { enabled: false },  // happy-dom 不支持真实计算样式
        'link-name': { enabled: false },         // happy-dom 下链接检测不准确
    },
}) as (html: Element | string) => Promise<unknown>
