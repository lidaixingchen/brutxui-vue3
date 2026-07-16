import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { vi } from 'vitest'
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
export async function expectNoA11yViolations(
    component: Component,
    options?: Record<string, unknown>,
) {
    // 强制使用真实定时器，防止外部 vi.useFakeTimers 污染导致 axe 挂起超时
    vi.useRealTimers()
    const wrapper = mount(component, options as unknown as Parameters<typeof mount>[1])
    try {
        const results = await axe(wrapper.element)
        // 自定义失败信息：仅 toHaveLength(0) 失败时只输出数量，不显示违规详情
        // 需格式化输出 rule id / help / 涉及元素，便于定位
        if (results.violations.length > 0) {
            const detail = results.violations
                .map(v => `  - ${v.id} (${v.help}): ${v.nodes.map(n => n.html).join(', ')}`)
                .join('\n')
            throw new Error(`a11y violations (${results.violations.length}):\n${detail}`)
        }
        return wrapper
    } finally {
        wrapper.unmount()
    }
}
