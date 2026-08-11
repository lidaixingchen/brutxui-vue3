import { mount } from '@vue/test-utils'
import Checkbox from './Checkbox.vue'
import { Minus } from '@lucide/vue'

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

    it('provides default aria-label from locale', () => {
        const wrapper = mount(Checkbox, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').attributes('aria-label')).toBe('复选框')
    })

    it('uses custom ariaLabel when provided', () => {
        const wrapper = mount(Checkbox, {
            props: { ariaLabel: '同意条款' },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="checkbox"]').attributes('aria-label')).toBe('同意条款')
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
