import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { expect } from 'vitest'
import { axe } from '../vitest.setup'

/**
 * 检测组件无 accessibility 违规
 *
 * 使用 axe-core 对渲染后的组件进行可访问性检测，
 * 确保没有违反 WCAG 标准的问题。
 *
 * @param component - 要测试的 Vue 组件
 * @param options - 挂载选项（props、slots、attrs 等）
 * @returns Vue Test Utils 的 VueWrapper 实例
 *
 * @example
 * ```ts
 * import Button from '../button/Button.vue'
 * import { expectNoA11yViolations } from '@/test-utils/a11y'
 *
 * it('should have no accessibility violations', async () => {
 *   await expectNoA11yViolations(Button, {
 *     props: { variant: 'primary' },
 *     slots: { default: 'Click me' },
 *   })
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function expectNoA11yViolations(
    component: Component,
    options?: Record<string, any>,
) {
    const wrapper = mount(component, options as any)
    const results = await axe(wrapper.element)
    // vitest-axe augments expect with toHaveNoViolations at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(expect(results) as any).toHaveNoViolations()
    return wrapper
}

/**
 * 获取组件的可访问性检测结果
 *
 * 返回 axe 检测结果而不自动断言，适用于需要自定义处理的场景。
 *
 * @param component - 要测试的 Vue 组件
 * @param options - 挂载选项
 * @returns axe 检测结果
 *
 * @example
 * ```ts
 * const results = await getA11yResults(Button, { props: { disabled: true } })
 * expect(results.violations).toHaveLength(0)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getA11yResults(
    component: Component,
    options?: Record<string, any>,
) {
    const wrapper = mount(component, options as any)
    const results = await axe(wrapper.element)
    return { wrapper, results }
}
