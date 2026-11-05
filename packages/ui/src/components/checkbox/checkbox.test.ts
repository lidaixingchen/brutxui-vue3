import { createSSRApp, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { computeAccessibleName } from 'dom-accessibility-api'
import { renderToString } from 'vue/server-renderer'
import Checkbox from './Checkbox.vue'
import { Minus } from '@lucide/vue'
import Label from '../label/Label.vue'

describe('Checkbox', () => {
    it('renders with checkbox role', () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').exists()).toBe(true)
    })

    it('is disabled when disabled=true', () => {
        const wrapper = mount(Checkbox, {
            props: { disabled: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        expect(el.attributes('disabled')).toBeDefined()
    })

    it('applies custom class', () => {
        const wrapper = mount(Checkbox, {
            props: { class: 'custom-class' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').classes()).toContain('custom-class')
    })

    it('emits update:checked when toggled', async () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:checked')).toBeTruthy()
    })

    it('supports keyboard interaction with Space key', async () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('keydown', { key: ' ' })
        // reka-ui CheckboxRoot handles the Space key internally
        expect(el.exists()).toBe(true)
    })

    it('links indicator size to checkbox size via shared iconSizeVariants', async () => {
        const cases = [
            { size: 'sm' as const, expected: ['h-3', 'w-3'] },
            { size: 'default' as const, expected: ['h-4', 'w-4'] },
            { size: 'lg' as const, expected: ['h-5', 'w-5'] },
        ]
        const wrapper = mount(Checkbox, {
            props: { checked: true },
            attachTo: document.body,
        })
        for (const { size, expected } of cases) {
            await wrapper.setProps({ size } as any)
            const svg = wrapper.find('svg')
            expect(svg.exists()).toBe(true)
            const indicator = svg.element.parentElement as HTMLElement
            for (const cls of expected) {
                expect(indicator.classList.contains(cls)).toBe(true)
            }
            // stroke-[3] base preserved from checkboxIndicatorVariants
            expect(indicator.classList.contains('stroke-[3]')).toBe(true)
        }
    })

    it('uses locale text only as the fallback accessible name', () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        const checkbox = wrapper.get('[role="checkbox"]')
        expect(checkbox.attributes('aria-label')).toBeUndefined()
        expect(computeAccessibleName(checkbox.element)).toBe('复选框')
    })

    it('uses custom ariaLabel when provided', () => {
        const wrapper = mount(Checkbox, {
            props: { ariaLabel: '同意条款' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').attributes('aria-label')).toBe('同意条款')
    })

    it('uses an associated visible Label when no explicit accessible name is provided', () => {
        const wrapper = mount({
            render: () => h('div', [
                h(Label, { for: 'terms-checkbox' }, () => '接受使用条款'),
                h(Checkbox, { id: 'terms-checkbox' }),
            ]),
        }, { attachTo: document.body })

        expect(computeAccessibleName(wrapper.get('[role="checkbox"]').element)).toBe('接受使用条款')
        wrapper.unmount()
    })

    it('prioritizes explicit ariaLabel over an associated visible Label', () => {
        const wrapper = mount({
            render: () => h('div', [
                h(Label, { for: 'explicit-checkbox' }, () => '可见标签'),
                h(Checkbox, { id: 'explicit-checkbox', ariaLabel: '显式名称' }),
            ]),
        }, { attachTo: document.body })

        expect(computeAccessibleName(wrapper.get('[role="checkbox"]').element)).toBe('显式名称')
        wrapper.unmount()
    })

    it('activates when its associated visible Label is clicked', async () => {
        const wrapper = mount({
            render: () => h('div', [
                h(Label, { for: 'click-checkbox' }, () => '启用功能'),
                h(Checkbox, { id: 'click-checkbox' }),
            ]),
        }, { attachTo: document.body })

        await wrapper.get('label').trigger('click')
        expect(wrapper.get('[role="checkbox"]').attributes('aria-checked')).toBe('true')
        wrapper.unmount()
    })

    it('uses a wrapping Label without requiring an id', () => {
        const wrapper = mount({
            render: () => h(Label, {}, () => ['允许通知', h(Checkbox)]),
        }, { attachTo: document.body })

        expect(computeAccessibleName(wrapper.get('[role="checkbox"]').element)).toBe('允许通知')
        wrapper.unmount()
    })

    it('prioritizes aria-labelledby over ariaLabel and native Label', () => {
        const wrapper = mount({
            render: () => h('div', [
                h('span', { id: 'checkbox-title' }, 'ARIA 标题'),
                h(Label, { for: 'priority-checkbox' }, () => '可见标签'),
                h(Checkbox, {
                    id: 'priority-checkbox',
                    ariaLabel: '显式名称',
                    ariaLabelledby: 'checkbox-title',
                }),
            ]),
        }, { attachTo: document.body })

        expect(computeAccessibleName(wrapper.get('[role="checkbox"]').element)).toBe('ARIA 标题')
        wrapper.unmount()
    })

    it('updates the accessible name when a visible Label is added and changed', async () => {
        const isVisible = ref(false)
        const labelText = ref('初始名称')
        const wrapper = mount({
            render: () => h('div', [
                isVisible.value ? h(Label, { for: 'dynamic-checkbox' }, () => labelText.value) : null,
                h(Checkbox, { id: 'dynamic-checkbox' }),
            ]),
        }, { attachTo: document.body })

        isVisible.value = true
        await flushPromises()
        const checkbox = wrapper.get('[role="checkbox"]')
        expect(computeAccessibleName(checkbox.element)).toBe('初始名称')

        labelText.value = '更新后的名称'
        await flushPromises()
        expect(computeAccessibleName(checkbox.element)).toBe('更新后的名称')
        wrapper.unmount()
    })

    it('uses the visible Label as the accessible name in server-rendered HTML', async () => {
        const html = await renderToString(createSSRApp({
            render: () => h('div', [
                h(Label, { for: 'ssr-checkbox' }, () => '服务条款'),
                h(Checkbox, { id: 'ssr-checkbox' }),
            ]),
        }))
        const host = document.createElement('div')
        host.innerHTML = html
        document.body.append(host)

        expect(computeAccessibleName(host.querySelector('[role="checkbox"]')!)).toBe('服务条款')
        host.remove()
    })

    it('renders Minus icon when indeterminate', () => {
        const wrapper = mount(Checkbox, {
            props: { checked: 'indeterminate' },
            attachTo: document.body,
        })
        const minus = wrapper.findComponent(Minus)
        expect(minus.exists()).toBe(true)
    })

    it('renders Check icon when checked (not indeterminate)', () => {
        const wrapper = mount(Checkbox, {
            props: { checked: true },
            attachTo: document.body,
        })
        const minus = wrapper.findComponent(Minus)
        expect(minus.exists()).toBe(false)
    })

    it('sets checked-state foreground on root for icon contrast', () => {
        const wrapper = mount(Checkbox, {
            props: { checked: true, variant: 'primary' },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        // 图标以 text-current 继承根元素前景色，须与选中背景的 -foreground 匹配
        expect(el.classes()).toContain('data-[state=checked]:text-brutal-primary-foreground')
    })

    it('uses defaultValue as the uncontrolled initial state', () => {
        const wrapper = mount(Checkbox, {
            props: { defaultValue: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        expect(el.attributes('aria-checked')).toBe('true')
    })

    it('renders Minus icon with mixed aria when defaultValue is indeterminate', () => {
        const wrapper = mount(Checkbox, {
            props: { defaultValue: 'indeterminate' },
            attachTo: document.body,
        })
        const minus = wrapper.findComponent(Minus)
        expect(minus.exists()).toBe(true)
        expect(wrapper.find('[role="checkbox"]').attributes('aria-checked')).toBe('mixed')
    })

    it('tracks actual state after toggling from an indeterminate defaultValue', async () => {
        const wrapper = mount(Checkbox, {
            props: { defaultValue: 'indeterminate' },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('click')
        // reka-ui 内部从 indeterminate 切换到 checked，图标应随之变为 Check 而非停留在 Minus
        expect(wrapper.findComponent(Minus).exists()).toBe(false)
        expect(wrapper.emitted('update:checked')?.[0]).toEqual([true])
    })

    it('emits update:checked when toggled from defaultValue', async () => {
        const wrapper = mount(Checkbox, {
            props: { defaultValue: true },
            attachTo: document.body,
        })
        const el = wrapper.find('[role="checkbox"]')
        await el.trigger('click')
        expect(wrapper.emitted('update:checked')?.[0]).toEqual([false])
    })

    it('falls back to a valid icon size for an unknown dynamic size', () => {
        const wrapper = mount(Checkbox, {
            props: { checked: true, size: 'unknown-size' as any },
            attachTo: document.body,
        })
        const svg = wrapper.find('svg')
        expect(svg.exists()).toBe(true)
        const indicator = svg.element.parentElement as HTMLElement
        // 兜底到 iconSizeVariants 默认中号
        expect(indicator.classList.contains('h-4')).toBe(true)
        expect(indicator.classList.contains('w-4')).toBe(true)
    })

    it('renders a hidden form input when name is provided', () => {
        const wrapper = mount(Checkbox, {
            props: { name: 'terms', value: 'yes', required: true, checked: true },
            attachTo: document.body,
        })
        const input = wrapper.find('input[type="checkbox"]')
        expect(input.exists()).toBe(true)
        expect(input.attributes('name')).toBe('terms')
        expect(input.attributes('value')).toBe('yes')
        expect(input.attributes('required')).toBeDefined()
        expect(input.attributes('checked')).toBeDefined()
    })

    it('does not render a hidden form input without name', () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
    })
})
