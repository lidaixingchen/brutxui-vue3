import { expect } from 'vitest'
import { configureAxe } from 'vitest-axe'

// 注册 axe matcher
import('vitest-axe/matchers').then((matchers) => {
    expect.extend(matchers)
})

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
