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

    it('三色指示方块默认引用语义令牌且整体打 aria-hidden', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T' } })
        const lamps = wrapper.find('[aria-hidden="true"]')
        expect(lamps.exists()).toBe(true)
        expect(lamps.find('.bg-brutal-destructive').exists()).toBe(true)
        expect(lamps.find('.bg-brutal-accent').exists()).toBe(true)
        expect(lamps.find('.bg-brutal-status-success').exists()).toBe(true)
    })

    it('默认渲染 ASCII 窗口控制符且为装饰层（无 button 元素）', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T' } })
        expect(wrapper.text()).toContain('[ _ ] [ X ]')
        expect(wrapper.findAll('button')).toHaveLength(0)
        expect(wrapper.findAll('[aria-hidden="true"]')).toHaveLength(2)
    })

    it('showControls=false 时不渲染控制符', () => {
        const wrapper = mount(CardWindowHeader, { props: { title: 'T', showControls: false } })
        expect(wrapper.text()).not.toContain('[ _ ] [ X ]')
    })

    it('actions 插槽替换默认控制符', () => {
        const wrapper = mount(CardWindowHeader, {
            props: { title: 'T', closable: true },
            slots: { actions: '<button id="custom-action">OK</button>' },
        })
        expect(wrapper.find('#custom-action').exists()).toBe(true)
        expect(wrapper.text()).not.toContain('[ X ]')
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

    describe('交互模式与无障碍', () => {
        it('开启 closable、minimizable、maximizable 时渲染可交互 button', async () => {
            const wrapper = mount(CardWindowHeader, {
                props: {
                    title: 'Terminal',
                    minimizable: true,
                    maximizable: true,
                    closable: true,
                },
            })

            const buttons = wrapper.findAll('button')
            expect(buttons).toHaveLength(3)

            expect(buttons[0].text()).toBe('[ _ ]')
            expect(buttons[0].attributes('aria-label')).toBe('最小化')

            expect(buttons[1].text()).toBe('[ □ ]')
            expect(buttons[1].attributes('aria-label')).toBe('最大化')

            expect(buttons[2].text()).toBe('[ X ]')
            expect(buttons[2].attributes('aria-label')).toBe('关闭')

            await buttons[0].trigger('click')
            expect(wrapper.emitted('minimize')).toHaveLength(1)

            await buttons[1].trigger('click')
            expect(wrapper.emitted('maximize')).toHaveLength(1)

            await buttons[2].trigger('click')
            expect(wrapper.emitted('close')).toHaveLength(1)
        })

        it('支持自定义 aria-label 属性覆盖默认语言包', () => {
            const wrapper = mount(CardWindowHeader, {
                props: {
                    title: 'Terminal',
                    closable: true,
                    closeAriaLabel: '关闭控制台',
                },
            })
            const closeBtn = wrapper.find('button')
            expect(closeBtn.attributes('aria-label')).toBe('关闭控制台')
        })

        it('键盘 Enter / Space 触发按钮动作', async () => {
            const wrapper = mount(CardWindowHeader, {
                props: {
                    title: 'Terminal',
                    closable: true,
                },
            })
            const closeBtn = wrapper.find('button')
            await closeBtn.trigger('keydown.enter')
            expect(wrapper.emitted('close')).toHaveLength(1)

            await closeBtn.trigger('keydown.space')
            expect(wrapper.emitted('close')).toHaveLength(2)
        })

        it('开启 interactiveLamps 时左侧指示灯升级为可点击 button', async () => {
            const wrapper = mount(CardWindowHeader, {
                props: {
                    title: 'Terminal',
                    interactiveLamps: true,
                },
            })

            const lamps = wrapper.findAll('button')
            expect(lamps).toHaveLength(3)
            expect(lamps[0].attributes('aria-label')).toBe('关闭窗口')
            expect(lamps[1].attributes('aria-label')).toBe('最小化窗口')
            expect(lamps[2].attributes('aria-label')).toBe('最大化窗口')

            await lamps[0].trigger('click')
            expect(wrapper.emitted('close')).toHaveLength(1)

            await lamps[1].trigger('click')
            expect(wrapper.emitted('minimize')).toHaveLength(1)

            await lamps[2].trigger('click')
            expect(wrapper.emitted('maximize')).toHaveLength(1)
        })
    })
})
