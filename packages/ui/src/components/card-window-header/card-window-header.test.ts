import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardWindowHeader from './CardWindowHeader.vue'

describe('CardWindowHeader', () => {
    it('渲染等宽大写标题', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'terminal_shell' } })
        expect(wrapper.text()).toContain('terminal_shell')
        const titleEl = wrapper.findAll('span')[1]
        expect(titleEl.classes()).toContain('font-mono')
        expect(titleEl.classes()).toContain('uppercase')
    })

    it('三色指示方块全部引用语义令牌且整体打 aria-hidden', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T' } })
        const lamps = wrapper.find('[aria-hidden="true"]')
        expect(lamps.exists()).toBe(true)
        expect(lamps.find('.bg-brutal-destructive').exists()).toBe(true)
        expect(lamps.find('.bg-brutal-accent').exists()).toBe(true)
        expect(lamps.find('.bg-brutal-status-success').exists()).toBe(true)
    })

    it('默认渲染 ASCII 窗口控制符且为装饰层', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T' } })
        expect(wrapper.text()).toContain('[ _ ] [ X ]')
        expect(wrapper.findAll('[aria-hidden="true"]')).toHaveLength(2)
    })

    it('showControls=false 时不渲染控制符', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T', showControls: false } })
        expect(wrapper.text()).not.toContain('[ _ ] [ X ]')
    })

    it('actions 插槽替换默认 ASCII 控制符', () => {
        const wrapper = mount(CardWindowHeader, {
            props: { title: 'T' },
            slots: { actions: '<button>OK</button>' },
        })
        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.text()).not.toContain('[ _ ] [ X ]')
    })

    it('顶栏容器与卡身之间为实体粗线分隔', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T' } })
        expect(wrapper.classes()).toContain('border-b-3')
        expect(wrapper.classes()).toContain('border-brutal')
    })

    it('支持自定义 class 合并', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T', class: 'custom-class' } })
        expect(wrapper.classes()).toContain('custom-class')
    })
})
