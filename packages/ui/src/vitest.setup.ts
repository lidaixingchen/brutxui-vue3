import { config } from '@vue/test-utils'
import axeCore from 'axe-core'
import type { AxeResults } from 'axe-core'
import { afterAll, vi } from 'vitest'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'

// 全局提供默认 locale，避免每个使用 useLocale() 的测试都要手动 provide。
// 深拷贝注入：防止测试修改共享语言包对象后跨测试文件污染全局状态。
;(config.global.provide as Record<symbol, unknown>)[LOCALE_INJECTION_KEY as symbol] = structuredClone(zhCN)

// happy-dom/jsdom 缺少真实 ResizeObserver，提供可记录的 mock：
// 构造器保存回调、observe 记录 target 并触发一次初始通知、disconnect 清理。
class ResizeObserverMock implements ResizeObserver {
    private callback: ResizeObserverCallback
    // 观察目标集合：保持与真实 ResizeObserver 一致的 observe/unobserve 语义，
    // 供需要断言观察目标或模拟尺寸变更的用例使用
    private observedTargets = new Set<Element>()

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback
    }

    observe(target: Element): void {
        this.observedTargets.add(target)
        // 立即触发一次初始尺寸通知，让依赖 ResizeObserver 的组件在测试中收到回调
        this.callback([], this as unknown as ResizeObserver)
    }

    unobserve(target: Element): void {
        this.observedTargets.delete(target)
    }

    disconnect(): void {
        this.observedTargets.clear()
    }
}

globalThis.ResizeObserver = ResizeObserverMock

// 将原生 scrollIntoView 替换为空实现，避免 happy-dom 下滚动行为干扰测试。
// 使用 vi.spyOn 而非直接覆盖原型：不永久污染全局，且由 vitest 管理生命周期。
const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
afterAll(() => {
    scrollIntoViewSpy.mockRestore()
})

// 导出配置好的 axe 函数供测试使用
// 直接基于 axe-core，不依赖 vitest-axe 的 matcher 增强（Vitest 4.x 兼容性问题）
const AXE_OPTIONS = {
    rules: {
        'color-contrast': { enabled: false },  // happy-dom 不支持真实计算样式
        'link-name': { enabled: false },         // happy-dom 下链接检测不准确
    },
} as const

/**
 * 对元素运行 axe-core 可访问性检测。
 *
 * 已在 document 中的元素直接检测，避免克隆造成 id 重复（document 中出现重复 id）
 * 以及 aria-labelledby/aria-describedby/aria-owns 等指向容器外元素的引用丢失；
 * 对 detached 元素（@vue/test-utils mount 结果）克隆到临时容器并移除 id 后检测，
 * 降低 axe 误报。注意克隆检测的 nodes[].target 指向克隆节点，断言定位需按 html 匹配。
 */
export async function axe(element: Element): Promise<AxeResults> {
    if (document.contains(element)) {
        return axeCore.run(element, AXE_OPTIONS)
    }
    const container = document.createElement('div')
    const clone = element.cloneNode(true) as Element
    clone.removeAttribute('id')
    container.appendChild(clone)
    document.body.appendChild(container)
    try {
        return await axeCore.run(container, AXE_OPTIONS)
    } finally {
        document.body.removeChild(container)
    }
}
