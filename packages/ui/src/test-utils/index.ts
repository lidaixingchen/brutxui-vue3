import { mount, type MountingOptions } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'
import { vi } from 'vitest'

export { expectNoA11yViolations, getA11yResults } from './a11y'

/**
 * 带默认配置的组件挂载函数
 *
 * 封装 @vue/test-utils 的 mount，提供统一的挂载入口。
 * 支持泛型，保持类型安全。
 *
 * @param component - 要挂载的 Vue 组件
 * @param options - 挂载选项（props、slots、attrs 等）
 * @returns Vue Test Utils 的 VueWrapper 实例
 *
 * @example
 * ```ts
 * const wrapper = mountComponentWithDefaults(Input, {
 *   props: { modelValue: 'hello' },
 * })
 * ```
 */
export function mountComponentWithDefaults<Props = Record<string, unknown>>(
    component: Component,
    options?: MountingOptions<Props>,
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mount(component, options as any)
}

/**
 * 等待下一个 Vue tick
 *
 * 等价于 `await nextTick()`，用于等待 DOM 更新。
 *
 * @example
 * ```ts
 * await wrapper.setProps({ variant: 'error' })
 * await waitForNextTick()
 * expect(wrapper.find('.error').exists()).toBe(true)
 * ```
 */
export async function waitForNextTick(): Promise<void> {
    await nextTick()
}

/**
 * 刷新所有待处理的 promises
 *
 * 通过 setTimeout 将回调推入宏任务队列，
 * 确保所有微任务（Promise 回调）在继续执行前完成。
 *
 * @example
 * ```ts
 * fetchData() // 异步操作
 * await flushAllPromises()
 * expect(result.value).toBeDefined()
 * ```
 */
export async function flushAllPromises(): Promise<void> {
    return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

/**
 * 创建 mock 事件
 *
 * 用于模拟 DOM 事件，支持自定义事件属性。
 *
 * @param type - 事件类型（如 'click'、'input'、'mouseenter'）
 * @param properties - 额外的事件属性
 * @returns 构造好的 Event 对象
 *
 * @example
 * ```ts
 * const clickEvent = createMockEvent('click')
 * const inputEvent = createMockEvent('input', { bubbles: true })
 * ```
 */
export function createMockEvent(
    type: string,
    properties?: Record<string, unknown>,
): Event {
    return new Event(type, properties)
}

/**
 * 创建 mock 的 MouseEvent
 *
 * 鼠标事件专用，支持 clientX/clientY 等鼠标坐标属性。
 *
 * @param type - 鼠标事件类型（如 'click'、'mousedown'、'mouseenter'）
 * @param properties - 额外的鼠标事件属性
 * @returns 构造好的 MouseEvent 对象
 *
 * @example
 * ```ts
 * const clickEvent = createMockMouseEvent('click')
 * const moveEvent = createMockMouseEvent('mousemove', { clientX: 100, clientY: 200 })
 * ```
 */
export function createMockMouseEvent(
    type: string,
    properties?: Record<string, unknown>,
): MouseEvent {
    return new MouseEvent(type, properties)
}

/**
 * 创建 mock 的 KeyboardEvent
 *
 * 键盘事件专用，支持 key、code 等键盘属性。
 *
 * @param type - 键盘事件类型（如 'keydown'、'keyup'、'keypress'）
 * @param properties - 额外的键盘事件属性
 * @returns 构造好的 KeyboardEvent 对象
 *
 * @example
 * ```ts
 * const enterEvent = createMockKeyboardEvent('keydown', { key: 'Enter' })
 * const escapeEvent = createMockKeyboardEvent('keydown', { key: 'Escape' })
 * ```
 */
export function createMockKeyboardEvent(
    type: string,
    properties?: Record<string, unknown>,
): KeyboardEvent {
    return new KeyboardEvent(type, properties)
}

/**
 * Mock window.matchMedia
 *
 * 在测试环境中模拟 window.matchMedia API，
 * 避免 "window.matchMedia is not a function" 错误。
 *
 * @returns Mock 函数，可用于断言调用参数
 *
 * @example
 * ```ts
 * const matchMediaMock = mockWindowMatchMedia()
 *
 * // 测试组件是否调用了 matchMedia
 * expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
 *
 * // 清理（通常在 afterEach 中调用）
 * matchMediaMock.mockRestore()
 * ```
 */
export function mockWindowMatchMedia(): ReturnType<typeof vi.fn> {
    const matchMediaMock = vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))

    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMediaMock,
    })

    return matchMediaMock
}

/**
 * Mock window.setTimeout / window.clearTimeout
 *
 * 在测试环境中模拟 setTimeout/clearTimeout，
 * 避免异步测试中的时序问题。
 *
 * @returns 包含 setTimeout 和 clearTimeout 的 mock 对象
 *
 * @example
 * ```ts
 * const { setTimeoutMock, clearTimeoutMock } = mockWindowTimers()
 *
 * // 手动推进定时器
 * setTimeoutMock.mock.calls[0][0]()
 *
 * // 清理
 * restoreWindowTimers()
 * ```
 */
export function mockWindowTimers(): {
    setTimeoutMock: ReturnType<typeof vi.fn>
    clearTimeoutMock: ReturnType<typeof vi.fn>
} {
    const setTimeoutMock = vi.fn().mockReturnValue(123)
    const clearTimeoutMock = vi.fn()

    Object.defineProperty(window, 'setTimeout', {
        writable: true,
        value: setTimeoutMock,
    })

    Object.defineProperty(window, 'clearTimeout', {
        writable: true,
        value: clearTimeoutMock,
    })

    return { setTimeoutMock, clearTimeoutMock }
}

/**
 * 恢复 window 原始定时器
 *
 * 在 mockWindowTimers 后恢复原始的 setTimeout/clearTimeout。
 *
 * @example
 * ```ts
 * afterEach(() => {
 *   restoreWindowTimers()
 * })
 * ```
 */
export function restoreWindowTimers(): void {
    // Vitest 的 vi.useFakeTimers() 会自动恢复
    // 此函数作为显式恢复的便捷方法
    vi.useRealTimers()
}

/**
 * Mock ResizeObserver
 *
 * 在测试环境中模拟 ResizeObserver API，
 * 避免 "ResizeObserver is not defined" 错误。
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   mockResizeObserver()
 * })
 * ```
 */
export function mockResizeObserver(): void {
    globalThis.ResizeObserver = class ResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
    }
}

/**
 * Mock IntersectionObserver
 *
 * 在测试环境中模拟 IntersectionObserver API，
 * 避免 "IntersectionObserver is not defined" 错误。
 *
 * @example
 * ```ts
 * beforeEach(() => {
 *   mockIntersectionObserver()
 * })
 * ```
 */
export function mockIntersectionObserver(): void {
    globalThis.IntersectionObserver = class IntersectionObserver {
        root = null
        rootMargin = ''
        thresholds: ReadonlyArray<number> = []

        constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        takeRecords = vi.fn().mockReturnValue([])
    } as unknown as typeof IntersectionObserver
}
