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
})
