import { afterAll, vi } from 'vitest'

// 浏览器环境（vitest browser mode）已提供真实 ResizeObserver，不做替换，
// 避免掩盖真实布局/滚动行为；仅在 API 缺失的环境（happy-dom/jsdom）提供可记录的 mock。
class ResizeObserverMock implements ResizeObserver {
    private callback: ResizeObserverCallback
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

if (typeof ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = ResizeObserverMock
}

// 将原生 scrollIntoView 替换为空实现，避免浏览器环境下滚动干扰测试。
// 使用 vi.spyOn 而非直接覆盖原型：不永久污染全局，且由 vitest 管理生命周期。
const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
afterAll(() => {
    scrollIntoViewSpy.mockRestore()
})
