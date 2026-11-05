import { flushPromises, mount } from '@vue/test-utils'
import { createSSRApp, h, reactive, ref } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { computeAccessibleName } from 'dom-accessibility-api'
import { vi, beforeEach } from 'vitest'
import Switch from './Switch.vue'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import { zhCN } from '@/locales/zh-CN'
import Label from '../label/Label.vue'

const accessibleName = computeAccessibleName

const hapticsMocks = vi.hoisted(() => {
    const snap = vi.fn()
    const click = vi.fn()
    const beep = vi.fn()
    const useBrutalHaptics = vi.fn((_options?: { sound?: any }) => ({ snap, click, beep }))
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

    it('prevents click and keyboard toggles while disabled', async () => {
        const wrapper = mount(Switch, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="switch"]')
        expect(el.attributes('disabled')).toBeDefined()
        await el.trigger('click')
        await el.trigger('keydown', { key: 'Enter' })
        expect(el.attributes('aria-checked')).toBe('false')
        expect(wrapper.emitted('update:modelValue')).toBeUndefined()
        expect(hapticsMocks.snap).not.toHaveBeenCalled()
    })

    it('toggles with Enter and emits the new boolean value', async () => {
        const wrapper = mount(Switch)
        const root = wrapper.get('[role="switch"]')
        await root.trigger('keydown', { key: 'Enter' })
        expect(root.attributes('aria-checked')).toBe('true')
        expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
    })

    it('applies custom class', () => {
        const wrapper = mount(Switch, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="switch"]').classes()).toContain('custom-class')
    })

    it('provides default aria-label from locale', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('开关')
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
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('开关')
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
        expect(el.attributes('aria-checked')).toBe('true')
        await wrapper.setProps({ modelValue: false })
        expect(el.attributes('aria-checked')).toBe('false')
    })

    it('supports defaultValue in uncontrolled mode', () => {
        const wrapper = mount(Switch, {
            props: { defaultValue: true },
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

    it('renders IO label marks with aria-hidden when showLabels is true', () => {
        const wrapper = mount(Switch, {
            props: { showLabels: true },
            attachTo: document.body,
        })
        const label = wrapper.find('[data-slot="switch-thumb"] [aria-hidden="true"]')
        expect(label.exists()).toBe(true)
        expect(label.text()).toBe('O')
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('开关')
    })

    it('switches custom labels with the uncontrolled state', async () => {
        const wrapper = mount(Switch, {
            props: { showLabels: true, checkedLabel: '开', uncheckedLabel: '关', ariaLabel: '自动同步' },
        })
        const root = wrapper.find('[role="switch"]')
        const label = root.find('[aria-hidden="true"]')

        expect(label.text()).toBe('关')
        await root.trigger('click')
        expect(label.text()).toBe('开')
        expect(root.attributes('aria-checked')).toBe('true')
        expect(root.attributes('aria-label')).toBe('自动同步')
        expect(label.attributes('aria-hidden')).toBe('true')
        await root.trigger('click')
        expect(label.text()).toBe('关')
        expect(root.attributes('aria-checked')).toBe('false')
    })

    it('updates label props reactively and preserves an explicit empty label', async () => {
        const wrapper = mount(Switch, {
            props: { showLabels: true, modelValue: true, checkedLabel: '开', uncheckedLabel: '关' },
        })
        const label = wrapper.find('[aria-hidden="true"]')

        await wrapper.setProps({ checkedLabel: '✓' })
        expect(label.text()).toBe('✓')
        await wrapper.setProps({ checkedLabel: '' })
        expect(label.text()).toBe('')
        await wrapper.setProps({ checkedLabel: undefined })
        expect(label.text()).toBe('I')
        await wrapper.setProps({ modelValue: false, uncheckedLabel: '×' })
        expect(label.text()).toBe('×')
        await wrapper.setProps({ uncheckedLabel: undefined })
        expect(label.text()).toBe('O')
    })

    it('shows custom labels only when showLabels is enabled', async () => {
        const wrapper = mount(Switch, {
            props: { defaultValue: true, checkedLabel: '✓', uncheckedLabel: '×' },
        })
        const thumb = wrapper.find('[data-slot="switch-thumb"]')

        expect(thumb.text()).toBe('')
        await wrapper.setProps({ showLabels: true })
        expect(thumb.text()).toBe('✓')
        await wrapper.setProps({ showLabels: false })
        expect(thumb.text()).toBe('')
    })

    it('uses locale labels with prop overrides taking priority', async () => {
        const wrapper = mount(Switch, {
            props: { showLabels: true, modelValue: false },
            global: {
                provide: {
                    [LOCALE_INJECTION_KEY as symbol]: {
                        ...zhCN,
                        switch: { toggle: '电源', checkedLabel: '通', uncheckedLabel: '断' },
                    },
                },
            },
        })
        const label = wrapper.find('[aria-hidden="true"]')

        expect(label.text()).toBe('断')
        await wrapper.setProps({ modelValue: true })
        expect(label.text()).toBe('通')
        await wrapper.setProps({ checkedLabel: '✓' })
        expect(label.text()).toBe('✓')
        await wrapper.setProps({ modelValue: false, uncheckedLabel: '×' })
        expect(label.text()).toBe('×')
        await wrapper.setProps({ uncheckedLabel: undefined })
        expect(label.text()).toBe('断')
    })

    it('falls back to built-in labels when the provided locale omits them', async () => {
        const wrapper = mount(Switch, {
            props: { showLabels: true, modelValue: false },
            global: { provide: { [LOCALE_INJECTION_KEY as symbol]: { switch: { toggle: 'Power' } } } },
        })
        const label = wrapper.find('[aria-hidden="true"]')

        expect(label.text()).toBe('O')
        await wrapper.setProps({ modelValue: true })
        expect(label.text()).toBe('I')
    })

    it.each([
        { variant: 'default' as const },
        { variant: 'primary' as const },
        { variant: 'secondary' as const },
        { variant: 'accent' as const },
        { variant: 'danger' as const },
    ])('renders the current O/I mark with the $variant track color', async ({ variant }) => {
        const wrapper = mount(Switch, {
            props: { showLabels: true, modelValue: false, variant },
            attachTo: document.body,
        })
        const root = wrapper.find('[role="switch"]')
        const thumb = root.find('[data-slot="switch-thumb"]')
        const activeLabel = thumb.find('[aria-hidden="true"]')

        expect(activeLabel.text()).toBe('O')
        expect(root.attributes('aria-checked')).toBe('false')

        await wrapper.setProps({ modelValue: true })

        expect(activeLabel.text()).toBe('I')
        expect(root.attributes('aria-checked')).toBe('true')
        expect(accessibleName(root.element)).toBe('开关')
    })

    it('renders a solid thumb when showLabels is false', () => {
        const wrapper = mount(Switch, {
            attachTo: document.body,
        })
        const thumb = wrapper.find('[data-slot="switch-thumb"]')
        expect(thumb.text()).toBe('')
        expect(thumb.find('[aria-hidden="true"]').exists()).toBe(false)
    })
})

describe('Switch 表单与标签', () => {
    beforeEach(() => hapticsMocks.snap.mockClear())

    function resetForm(form: HTMLFormElement): void {
        // 按浏览器规范先派发可取消事件；Happy DOM 的原生 reset 使用相反顺序。
        if (!form.dispatchEvent(new Event('reset', { bubbles: true, cancelable: true }))) return
        for (const input of form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
            input.checked = input.defaultChecked
        }
    }

    function mountForm(props: Record<string, unknown> = {}) {
        return mount({
            render: () => h('form', [
                h(Label, { for: 'switch-notifications' }, () => '邮件通知'),
                h('span', { id: 'notification-title' }, '通知设置'),
                h(Switch, { id: 'switch-notifications', name: 'notifications', value: 'enabled', ...props }),
            ]),
        }, { attachTo: document.body })
    }

    it('uses the associated Label as its accessible name', async () => {
        const wrapper = mountForm()
        const root = wrapper.get('[role="switch"]')
        await flushPromises()
        expect(accessibleName(root.element)).toBe('邮件通知')
        wrapper.unmount()
    })

    it('preserves aria-labelledby as the accessible naming source', () => {
        const wrapper = mountForm({ 'aria-labelledby': 'notification-title' })
        expect(wrapper.get('[role="switch"]').attributes('aria-labelledby')).toBe('notification-title')
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('通知设置')
        wrapper.unmount()
    })

    it('toggles when the associated visible Label is clicked', async () => {
        const wrapper = mountForm()
        wrapper.get('label').element.click()
        await flushPromises()
        expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
        wrapper.unmount()
    })

    it('keeps an explicit accessible name over the associated Label', async () => {
        const wrapper = mountForm({ ariaLabel: '接收设备通知' })
        await flushPromises()
        expect(wrapper.get('[role="switch"]').attributes('aria-label')).toBe('接收设备通知')
        wrapper.unmount()
    })

    it('respects a wrapping Label without requiring an id', async () => {
        const wrapper = mount({
            render: () => h(Label, {}, () => ['允许通知', h(Switch)]),
        }, { attachTo: document.body })
        await flushPromises()
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('允许通知')
        wrapper.get('label').element.click()
        await flushPromises()
        expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
        wrapper.unmount()
    })

    it('submits the configured value after toggling', async () => {
        const wrapper = mountForm()
        const form = wrapper.get('form').element as HTMLFormElement
        expect(new FormData(form).has('notifications')).toBe(false)
        await wrapper.get('[role="switch"]').trigger('click')
        expect(new FormData(form).get('notifications')).toBe('enabled')
        await wrapper.get('[role="switch"]').trigger('click')
        expect(new FormData(form).has('notifications')).toBe(false)
        wrapper.unmount()
    })

    it.each([false, true])('restores the initial uncontrolled value %s on form reset', async (defaultValue) => {
        const wrapper = mountForm({ defaultValue })
        const form = wrapper.get('form').element as HTMLFormElement
        const root = wrapper.get('[role="switch"]')
        await root.trigger('click')
        expect(root.attributes('aria-checked')).toBe(String(!defaultValue))
        resetForm(form)
        await flushPromises()
        expect(root.attributes('aria-checked')).toBe(String(defaultValue))
        expect(new FormData(form).get('notifications')).toBe(defaultValue ? 'enabled' : null)
        expect(hapticsMocks.snap).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('keeps the controlled state and submitted value when the form resets', async () => {
        const state = reactive({ modelValue: false })
        const wrapper = mountForm(state)
        const form = wrapper.get('form').element as HTMLFormElement
        state.modelValue = true
        await flushPromises()
        resetForm(form)
        await flushPromises()
        expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
        expect(new FormData(form).get('notifications')).toBe('enabled')
        expect(hapticsMocks.snap).not.toHaveBeenCalled()
        wrapper.unmount()
    })

    it('keeps the current state when form reset is cancelled', async () => {
        const wrapper = mountForm()
        const form = wrapper.get('form').element as HTMLFormElement
        await wrapper.get('[role="switch"]').trigger('click')
        form.addEventListener('reset', (event) => event.preventDefault())
        resetForm(form)
        await flushPromises()
        expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('true')
        expect(new FormData(form).get('notifications')).toBe('enabled')
        wrapper.unmount()
    })

    it('validates a required field and excludes disabled fields from submission', async () => {
        const state = reactive({ required: true, disabled: false, value: undefined })
        const wrapper = mountForm(state)
        const form = wrapper.get('form').element as HTMLFormElement
        expect(wrapper.get('[role="switch"]').attributes('aria-required')).toBe('true')
        expect(form.checkValidity()).toBe(false)
        await wrapper.get('[role="switch"]').trigger('click')
        expect(form.checkValidity()).toBe(true)
        expect(new FormData(form).get('notifications')).toBe('on')
        state.disabled = true
        await flushPromises()
        expect(new FormData(form).has('notifications')).toBe(false)
        expect(form.checkValidity()).toBe(true)
        wrapper.unmount()
    })

    it.each(['external', 'wrapping'] as const)('keeps the %s Label name in server-rendered HTML', async (kind) => {
        const app = createSSRApp({ render: () => kind === 'external'
            ? h('div', [h(Label, { for: 'ssr-switch' }, () => '邮件通知'), h(Switch, { id: 'ssr-switch' })])
            : h(Label, {}, () => ['邮件通知', h(Switch)]),
        })
        const host = document.createElement('div')
        host.innerHTML = await renderToString(app)
        document.body.append(host)
        expect(accessibleName(host.querySelector('[role="switch"]')!)).toBe('邮件通知')
        host.remove()
    })

    it('uses a Label added after the Switch has mounted', async () => {
        const visible = ref(false)
        const wrapper = mount({ render: () => h('div', [
            visible.value ? h(Label, { for: 'late-switch' }, () => '邮件通知') : null,
            h(Switch, { id: 'late-switch' }),
        ]) }, { attachTo: document.body })
        await flushPromises()
        visible.value = true
        await flushPromises()
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('邮件通知')
        wrapper.unmount()
    })

    it('updates the accessible name when the visible Label text changes', async () => {
        const text = ref('邮件通知')
        const wrapper = mount({ render: () => h('div', [
            h(Label, { for: 'changing-switch' }, () => text.value),
            h(Switch, { id: 'changing-switch' }),
        ]) }, { attachTo: document.body })
        await flushPromises()
        text.value = '系统通知'
        await flushPromises()
        expect(accessibleName(wrapper.get('[role="switch"]').element)).toBe('系统通知')
        wrapper.unmount()
    })

    it.each([false, true])('keeps FormData and validity correct immediately after resetting controlled=%s', async (controlled) => {
        const state = reactive(controlled ? { modelValue: false, required: true } : { defaultValue: true, required: true })
        const wrapper = mountForm(state)
        const form = wrapper.get('form').element as HTMLFormElement
        if (controlled) {
            Object.assign(state, { modelValue: true })
            await flushPromises()
        } else {
            await wrapper.get('[role="switch"]').trigger('click')
        }
        resetForm(form)
        expect(new FormData(form).get('notifications')).toBe('enabled')
        expect(form.checkValidity()).toBe(true)
        await flushPromises()
        wrapper.unmount()
    })
})

describe('Switch 切换音效', () => {
    beforeEach(() => hapticsMocks.snap.mockClear())

    it('sound=true 时切换触发 snap 音效，sound 选项随 prop 传递', async () => {
        const wrapper = mount(Switch, {
            props: { sound: true },
            attachTo: document.body,
        })
        const callArg = hapticsMocks.useBrutalHaptics.mock.calls.at(-1)?.[0]
        expect(typeof callArg?.sound === 'function' ? callArg.sound() : callArg?.sound).toBe(true)
        await wrapper.find('[role="switch"]').trigger('click')
        expect(hapticsMocks.snap).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('默认静音：sound 缺省时以 false 传递给门面（发声短路由门面契约承担）', async () => {
        hapticsMocks.snap.mockClear()
        const wrapper = mount(Switch, { attachTo: document.body })
        const callArg = hapticsMocks.useBrutalHaptics.mock.calls.at(-1)?.[0]
        expect(typeof callArg?.sound === 'function' ? callArg.sound() : callArg?.sound).toBe(false)
        await wrapper.find('[role="switch"]').trigger('click')
        // 组件层始终上报切换事件；是否真正发声由 useBrutalHaptics 门面的 opt-in 短路决定
        expect(hapticsMocks.snap).toHaveBeenCalledTimes(1)
        wrapper.unmount()
    })

    it('响应式切换 sound prop 时动态更新门面', async () => {
        const wrapper = mount(Switch, {
            props: { sound: false },
            attachTo: document.body,
        })
        const callArg = hapticsMocks.useBrutalHaptics.mock.calls.at(-1)?.[0]
        expect(callArg?.sound()).toBe(false)

        await wrapper.setProps({ sound: true })
        expect(callArg?.sound()).toBe(true)
        wrapper.unmount()
    })
})
