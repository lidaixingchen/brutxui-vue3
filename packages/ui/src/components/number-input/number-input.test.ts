import { mount } from '@vue/test-utils'
import NumberInput from './NumberInput.vue'

describe('NumberInput', () => {
    it('renders with split layout by default', () => {
        const wrapper = mount(NumberInput)
        const root = wrapper.find('[role="group"]')
        expect(root.exists()).toBe(true)
        expect(root.classes()).toContain('flex')
        expect(root.classes()).toContain('border-3')
        expect(root.classes()).toContain('border-brutal')
        expect(root.classes()).toContain('shadow-brutal')
        expect(root.classes()).toContain('rounded-brutal')
    })

    it('renders with stacked layout', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'stacked' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.exists()).toBe(true)
        expect(root.classes()).toContain('flex')
        const input = wrapper.find('[role="spinbutton"]')
        expect(input.exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(NumberInput, {
            props: { class: 'custom-class' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.classes()).toContain('custom-class')
    })

    it('passes placeholder prop to input', () => {
        const wrapper = mount(NumberInput, {
            props: { placeholder: 'Enter number' },
        })
        const input = wrapper.find('input')
        expect(input.attributes('placeholder')).toBe('Enter number')
    })

    it('renders split layout with decrement and increment buttons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split' },
        })
        const decrement = wrapper.find('[aria-label="Decrease"]')
        const increment = wrapper.find('[aria-label="Increase"]')
        expect(decrement.exists()).toBe(true)
        expect(increment.exists()).toBe(true)
    })

    it('renders stacked layout with increment and decrement buttons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'stacked' },
        })
        const decrement = wrapper.find('[aria-label="Decrease"]')
        const increment = wrapper.find('[aria-label="Increase"]')
        expect(decrement.exists()).toBe(true)
        expect(increment.exists()).toBe(true)
    })

    it('applies root variant classes', () => {
        const wrapper = mount(NumberInput)
        const root = wrapper.find('[role="group"]')
        expect(root.classes()).toContain('bg-brutal-bg')
        expect(root.classes()).toContain('overflow-hidden')
        expect(root.classes()).toContain('transition-all')
    })

    it('has input with spinbutton role', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        const input = wrapper.find('[role="spinbutton"]')
        expect(input.exists()).toBe(true)
    })

    it('displays initial modelValue', () => {
        const wrapper = mount(NumberInput, {
            props: { modelValue: 42 },
            attachTo: document.body,
        })
        const input = wrapper.find('input')
        expect((input.element as HTMLInputElement).value).toBe('42')
    })

    it('increment button has correct aria-label', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        expect(wrapper.find('[aria-label="Increase"]').exists()).toBe(true)
    })

    it('decrement button has correct aria-label', () => {
        const wrapper = mount(NumberInput, {
            attachTo: document.body,
        })
        expect(wrapper.find('[aria-label="Decrease"]').exists()).toBe(true)
    })

    it('applies default icon size to increment/decrement icons', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split' },
        })
        const icons = wrapper.findAll('[role="group"] svg')
        expect(icons.length).toBeGreaterThan(0)
        for (const icon of icons) {
            expect(icon.classes()).toContain('h-4')
            expect(icon.classes()).toContain('w-4')
        }
    })

    it('links icon size to lg via iconSize prop', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split', iconSize: 'lg' },
        })
        const icons = wrapper.findAll('[role="group"] svg')
        expect(icons.length).toBeGreaterThan(0)
        for (const icon of icons) {
            expect(icon.classes()).toContain('h-5')
            expect(icon.classes()).toContain('w-5')
            expect(icon.classes()).not.toContain('h-4')
        }
    })

    it('does not leak iconSize as an unknown attribute onto the root element', () => {
        const wrapper = mount(NumberInput, {
            props: { layout: 'split', iconSize: 'lg' },
        })
        const root = wrapper.find('[role="group"]')
        expect(root.attributes('iconsize')).toBeUndefined()
        expect(root.attributes('iconSize')).toBeUndefined()
    })
})
