import { afterAll, vi } from 'vitest'

// vitest browser mode 运行于真实浏览器，ResizeObserver/Element 等 API 均由浏览器提供，
// 无需 mock（happy-dom/jsdom 场景的 ResizeObserverMock 见 vitest.setup.ts）

// 将原生 scrollIntoView 替换为空实现，避免浏览器环境下滚动干扰测试。
// 使用 vi.spyOn 而非直接覆盖原型：不永久污染全局，且由 vitest 管理生命周期。
const scrollIntoViewSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {})
afterAll(() => {
    scrollIntoViewSpy.mockRestore()
})
