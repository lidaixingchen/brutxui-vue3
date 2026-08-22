import { mount } from '@vue/test-utils'
import { vi, beforeEach } from 'vitest'
import Switch from './Switch.vue'
import { switchRootVariants, switchThumbVariants } from './switch-variants'

const hapticsMocks = vi.hoisted(() => {
    const snap = vi.fn()
    const click = vi.fn()
    const beep = vi.fn()
    const useBrutalHaptics = vi.fn(() => ({ snap, click, beep }))
    return { snap, click, beep, useBrutalHaptics }
})

vi.mock('@/composables/useBrutalHaptics', () => ({
    useBrutalHaptics: hapticsMocks.useBrutalHaptics,
}))

describe('Switch', () => {
    beforeEach(() => {
        hapticsMocks.snap.mockClear()
        hapticsMocks.useBrutalHaptics.mockClear()
        hapticsMocks.useBrutalHaptics.mockImplementation(() => ({
            snap: hapticsMocks.snap,
            click: hapticsMocks.click,
            beep: hapticsMocks.beep,
        }))
    })

    it('renders with switch role', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').exists()).toBe(true)
    })

    it('emits update:modelValue when toggled', async () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Switch, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('disabled')).toBeDefined()
    })

    it('applies custom class', () => {
        const wrapper = mount(Switch, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').classes()).toContain('custom-class')
    })

    it('applies variant classes', () => {
        const wrapper = mount(Switch, {
            props: { variant: 'primary' },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        const expected = switchRootVariants({ variant: 'primary' })
        expected.split(' ').forEach((cls) => {
            if (cls) expect(el.classes()).toContain(cls)
        })
    })

    it('applies size classes to root and thumb', () => {
        const wrapper = mount(Switch, {
            props: { size: 'lg' },
            attachTo: document.body,
        })
        const root = wrapper.find('[role="switch"]')
        const thumb = root.find('span')
        const expectedRoot = switchRootVariants({ size: 'lg' })
        const expectedThumb = switchThumbVariants({ size: 'lg' })
        expectedRoot.split(' ').forEach((cls) => {
            if (cls) expect(root.classes()).toContain(cls)
        })
        expectedThumb.split(' ').forEach((cls) => {
            if (cls) expect(thumb.classes()).toContain(cls)
        })
    })

    it('uses default variant and size when not specified', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        const expected = switchRootVariants({ variant: 'default', size: 'default' })
        expected.split(' ').forEach((cls) => {
            if (cls) expect(el.classes()).toContain(cls)
        })
    })

    it('provides default aria-label from locale', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').attributes('aria-label')).toBe('开关')
    })

    it('uses custom ariaLabel when provided', () => {
        const wrapper = mount(Switch, {
            props: { ariaLabel: '通知开关' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').attributes('aria-label')).toBe('通知开关')
    })

    it('falls back to default aria-label when ariaLabel is empty string', () => {
        const wrapper = mount(Switch, {
            props: { ariaLabel: '   ' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').attributes('aria-label')).toBe('开关')
    })

    it('emits false when clicking on checked switch (modelValue=true)', async () => {
        const wrapper = mount(Switch, {
            props: { modelValue: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('supports defaultChecked in uncontrolled mode', () => {
        const wrapper = mount(Switch, {
            props: { defaultChecked: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('aria-checked')).toBe('true')
    })

    it('supports defaultValue in uncontrolled mode', () => {
        const wrapper = mount(Switch, {
            props: { defaultValue: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('aria-checked')).toBe('true')
    })

    it('prioritizes defaultValue over defaultChecked', () => {
        const wrapper = mount(Switch, {
            props: { defaultValue: true, defaultChecked: false },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('aria-checked')).toBe('true')
    })

    it('handles modelValue: null as controlled false state and resets properly', async () => {
        const wrapper = mount(Switch, {
            props: { modelValue: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('aria-checked')).toBe('true')

        // 父组件重置表单传入 null
        await wrapper.setProps({ modelValue: null })
        expect(el.attributes('aria-checked')).toBe('false')
    })
})

describe('Switch 翘板凹槽轨道与机械动效', () => {
    it('轨道应用冲压凹槽阴影且脱离外凸交互反馈', () => {
        const classTokens = switchRootVariants().split(/\s+/)
        expect(classTokens).toContain('shadow-brutal-inset')
        expect(classTokens).not.toContain('shadow-brutal-sm')
        expect(classTokens).not.toContain('hover:-translate-y-0.5')
        expect(classTokens).not.toContain('active:translate-x-[var(--brutal-shadow-offset-x,4px)]')
    })

    it('滑块以 bounce 缓动完成翘板吸合（120ms 机械段落）', () => {
        const classTokens = switchThumbVariants().split(/\s+/)
        expect(classTokens).toContain('ease-brutal-bounce')
        expect(classTokens).toContain('duration-[120ms]')
    })

    it('滑块携带防滑凸棱纹理（背景色挖槽线条叠加在前景色上）', () => {
        const classTokens = switchThumbVariants().split(/\s+/)
        expect(
            classTokens.some(c => c.startsWith('bg-[image:repeating-linear-gradient') && c.includes('var(--brutal-bg')),
        ).toBe(true)
    })

    it('sound=true 时切换触发 snap 音效，sound 选项随 prop 传递', async () => {
        const wrapper = mount(Switch, {
            props: { sound: true },
            attachTo: document.body,
        })
        expect(hapticsMocks.useBrutalHaptics).toHaveBeenCalledWith({ sound: true })
        await wrapper.find('[role="switch"]').trigger('click')
        expect(hapticsMocks.snap).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('默认静音：sound 缺省时以 false 传递给门面（发声短路由门面契约承担）', async () => {
        hapticsMocks.snap.mockClear()
        const wrapper = mount(Switch, { attachTo: document.body })
        expect(hapticsMocks.useBrutalHaptics).toHaveBeenCalledWith({ sound: false })
        await wrapper.find('[role="switch"]').trigger('click')
        // 组件层始终上报切换事件；是否真正发声由 useBrutalHaptics 门面的 opt-in 短路决定
        expect(hapticsMocks.snap).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })
})
