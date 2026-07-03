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
})
