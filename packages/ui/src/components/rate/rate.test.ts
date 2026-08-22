import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Rate from './Rate.vue'

describe('Rate', () => {
    it('renders correct number of stars', () => {
        const wrapper = mount(Rate, {
            props: {
                max: 5,
                modelValue: 3
            },
            attachTo: document.body
        })

        // 应该渲染 5 个星星容器（根据 v-for i in max 渲染）
        const stars = wrapper.findAll('.relative.inline-block')
        expect(stars.length).toBe(5)
    })

    it('applies correct size styles', () => {
        const wrapper = mount(Rate, {
            props: {
                size: 'lg'
            },
            attachTo: document.body
        })

        const stars = wrapper.findAll('.relative.inline-block')
        // lg 时应该有 h-9 w-9 类
        expect(stars[0].classes()).toContain('h-9')
        expect(stars[0].classes()).toContain('w-9')
    })

    it('emits event on star click', async () => {
        const wrapper = mount(Rate, {
            props: {
                max: 5,
                modelValue: 2
            },
            attachTo: document.body
        })

        const stars = wrapper.findAll('.relative.inline-block')
        // 找到第 4 个星星的事件交互层（当 allowHalf 为 false 时，只有一个交互层）
        const interactArea = stars[3].find('.rate-interactive-area')
        expect(interactArea.exists()).toBe(true)

        await interactArea.trigger('click')

        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
        expect(updateEvents![0][0]).toBe(4)

        const changeEvents = wrapper.emitted('change')
        expect(changeEvents).toBeTruthy()
        expect(changeEvents![0][0]).toBe(4)
    })

    it('supports allowHalf prop', async () => {
        const wrapper = mount(Rate, {
            props: {
                max: 5,
                modelValue: 2,
                allowHalf: true
            },
            attachTo: document.body
        })

        const stars = wrapper.findAll('.relative.inline-block')
        // 当 allowHalf 为 true 时，有 2 个半星交互层
        // 找第 4 个星星 (星级为 3.5 或 4) 的左半边交互层
        const leftHalf = stars[3].find('.rate-interactive-area-left')
        expect(leftHalf.exists()).toBe(true)

        await leftHalf.trigger('click')

        const updateEvents = wrapper.emitted('update:modelValue')
        expect(updateEvents).toBeTruthy()
        expect(updateEvents![0][0]).toBe(3.5)
    })

    it('ignores clicks when readonly=true', async () => {
        const wrapper = mount(Rate, {
            props: {
                max: 5,
                modelValue: 2,
                readonly: true
            },
            attachTo: document.body
        })

        const stars = wrapper.findAll('.relative.inline-block')
        // 只读模式下，不应该渲染交互层，即不存在 cursor-pointer 的 hover 动作
        expect(stars[0].classes()).not.toContain('cursor-pointer')

        // 尝试点击，不会触发 update:modelValue 事件
        const star = stars[2]
        await star.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('handles keyboard navigation and ARIA attributes', async () => {
        const wrapper = mount(Rate, {
            props: {
                max: 5,
                modelValue: 2,
            },
            attachTo: document.body,
        })

        const slider = wrapper.find('[role="slider"]')
        expect(slider.attributes('aria-valuenow')).toBe('2')
        expect(slider.attributes('aria-valuetext')).toBe('2 / 5')

        await slider.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([3])

        await slider.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('update:modelValue')![1]).toEqual([0])
    })
})

describe('Rate 图腾图标与敲印动效', () => {
    it('默认渲染星形图标（lucide Star）', () => {
        const wrapper = mount(Rate, { props: { max: 3 } })
        expect(wrapper.findAll('svg[viewBox="0 0 100 100"]').length).toBe(0)
    })

    it('icon=lightning 时以 BrutalShape 渲染图腾', () => {
        const wrapper = mount(Rate, {
            props: { max: 3, icon: 'lightning' },
            attachTo: document.body,
        })
        const glyphs = wrapper.findAll('svg[viewBox="0 0 100 100"]')
        expect(glyphs.length).toBeGreaterThanOrEqual(6)
        wrapper.unmount()
    })

    it('无效 icon 名称回退为默认星形渲染', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const wrapper = mount(Rate, {
            props: { max: 2, icon: 'nonexistent' },
            attachTo: document.body,
        })
        expect(wrapper.findAll('svg[viewBox="0 0 100 100"]').length).toBe(0)
        warnSpy.mockRestore()
        wrapper.unmount()
    })

    it('点击评分触发 Stamp Impact 动效类并在动画结束后清除', async () => {
        vi.useFakeTimers()
        const wrapper = mount(Rate, {
            props: { max: 5, modelValue: 0 },
            attachTo: document.body,
        })
        await vi.advanceTimersByTimeAsync(0)
        const areas = wrapper.findAll('.rate-interactive-area')
        await areas[2]!.trigger('click')
        expect(wrapper.html()).toContain('animate-brutal-stamp')

        const stamped = wrapper.find('.animate-brutal-stamp')
        await stamped.trigger('animationend')
        expect(wrapper.html()).not.toContain('animate-brutal-stamp')
        vi.useRealTimers()
        wrapper.unmount()
    })
})
