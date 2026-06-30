import { mount, type MountingOptions } from '@vue/test-utils'
import { nextTick, type Component } from 'vue'

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
