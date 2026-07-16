import { config } from '@vue/test-utils'
import axeCore from 'axe-core'
import type { AxeResults } from 'axe-core'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'

// 全局提供默认 locale，避免每个使用 useLocale() 的测试都要手动 provide
;(config.global.provide as Record<symbol, unknown>)[LOCALE_INJECTION_KEY as symbol] = zhCN

class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

Element.prototype.scrollIntoView = function scrollIntoView() {}

// 导出配置好的 axe 函数供测试使用
// 直接基于 axe-core，不依赖 vitest-axe 的 matcher 增强（Vitest 4.x 兼容性问题）
const AXE_OPTIONS = {
    rules: {
        'color-contrast': { enabled: false },  // happy-dom 不支持真实计算样式
        'link-name': { enabled: false },         // happy-dom 下链接检测不准确
    },
} as const

// axe-core 要求被检测的元素在 document 树中，但 @vue/test-utils mount 的元素是 detached 的
// 这里复刻 vitest-axe 的行为：创建临时容器挂到 body，clone 元素后检测，再移除
export async function axe(element: Element): Promise<AxeResults> {
    const container = document.createElement('div')
    container.appendChild(element.cloneNode(true))
    document.body.appendChild(container)
    try {
        return await axeCore.run(container, AXE_OPTIONS)
    } finally {
        document.body.removeChild(container)
    }
}


