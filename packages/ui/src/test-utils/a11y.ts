import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { expect, vi } from 'vitest'
import { axe } from '../vitest.setup'

// FIXME(vitest-axe): vitest-axe ^0.1.0 的模块增强（vitest-axe.d.ts 中 4 个 module target 的 augmentation）
// 无法覆盖 Vitest 4.x 的 expect 类型，导致 toHaveNoViolations matcher 在类型系统中不可见。
// 短期方案：下方 expect(results) 使用 as unknown as 强转绕过类型检查。
// 长期方案：升级 vitest-axe 到与 Vitest 4.x 兼容的版本，或切换到社区 fork，然后移除强转。

/**
 * 检测组件无 accessibility 违规
 *
 * 使用 axe-core 对渲染后的组件进行可访问性检测，
 * 确保没有违反 WCAG 标准的问题。
 *
 * @param component - 要测试 My Vue 组件
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
export async function expectNoA11yViolations(
    component: Component,
    options?: Record<string, unknown>,
) {
    // 强制使用真实定时器，防止外部 vi.useFakeTimers 污染导致 axe 挂起超时
    vi.useRealTimers()
    const wrapper = mount(component, options as unknown as Parameters<typeof mount>[1])
    try {
        const results = await axe(wrapper.element)
        // vitest-axe augments expect with toHaveNoViolations at runtime
        ;(expect(results) as unknown as { toHaveNoViolations: () => void }).toHaveNoViolations()
        return wrapper
    } finally {
        wrapper.unmount()
    }
}
