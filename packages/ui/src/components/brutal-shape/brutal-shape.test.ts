import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BrutalShape from './BrutalShape.vue'

describe('BrutalShape', () => {
    it('渲染已知图腾并透传尺寸与 viewBox 坐标系', () => {
        const wrapper = mount(BrutalShape, { props: { name: 'star-8', size: 48 } })
        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
        expect(svg.attributes('width')).toBe('48')
        expect(svg.attributes('height')).toBe('48')
        expect(svg.attributes('viewBox')).toBe('0 0 100 100')
        expect(svg.html()).toContain('<polygon')
    })

    it('默认填充与描边引用语义令牌以联动主题预设', () => {
        const wrapper = mount(BrutalShape, { props: { name: 'star-4' } })
        const svg = wrapper.find('svg')
        expect(svg.attributes('fill')).toBe('var(--brutal-accent)')
        expect(svg.attributes('stroke')).toBe('var(--brutal-fg)')
    })

    it('自定义颜色与描边宽度透传至根元素', () => {
        const wrapper = mount(BrutalShape, {
            props: { name: 'heart', color: 'var(--brutal-destructive)', stroke: 'var(--brutal-bg)', strokeWidth: 6 },
        })
        const svg = wrapper.find('svg')
        expect(svg.attributes('fill')).toBe('var(--brutal-destructive)')
        expect(svg.attributes('stroke')).toBe('var(--brutal-bg)')
        expect(svg.attributes('stroke-width')).toBe('6')
    })

    it('默认对读屏隐藏（纯装饰契约）', () => {
        const wrapper = mount(BrutalShape, { props: { name: 'star-8' } })
        expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
    })

    it('未知图腾不渲染并输出告警', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const wrapper = mount(BrutalShape, { props: { name: 'nonexistent' } })
        expect(wrapper.find('svg').exists()).toBe(false)
        expect(warnSpy).toHaveBeenCalled()
        warnSpy.mockRestore()
    })

    it('支持自定义 class 合并', () => {
        const wrapper = mount(BrutalShape, { props: { name: 'star-8', class: 'custom-class' } })
        expect(wrapper.classes()).toContain('custom-class')
    })
})
