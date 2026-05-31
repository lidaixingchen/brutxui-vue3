import { mount } from '@vue/test-utils'
import Combobox from './Combobox.vue'
import ComboboxMulti from './ComboboxMulti.vue'

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
]

describe('Combobox', () => {
    it('renders with options prop', () => {
        const wrapper = mount(Combobox, {
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(Combobox, {
            props: { options, class: 'custom-combobox' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-combobox')
    })

    it('shows placeholder text', () => {
        const wrapper = mount(Combobox, {
            props: { options, placeholder: 'Pick a fruit...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick a fruit...')
    })

    it('shows default placeholder text', () => {
        const wrapper = mount(Combobox, {
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select option...')
    })

    it('shows selected option label', () => {
        const wrapper = mount(Combobox, {
            props: { options, modelValue: 'banana' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Banana')
    })

    it('emits update:modelValue when option selected', async () => {
        const wrapper = mount(Combobox, {
            props: { options },
            attachTo: document.body,
        })
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('has aria-expanded attribute', () => {
        const wrapper = mount(Combobox, {
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('is disabled when disabled prop is true', () => {
        const wrapper = mount(Combobox, {
            props: { options, disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })
})

describe('ComboboxMulti', () => {
    it('renders with options prop', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options, class: 'custom-multi' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-multi')
    })

    it('shows placeholder text when no selection', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options, placeholder: 'Pick fruits...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick fruits...')
    })

    it('shows default placeholder text', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select options...')
    })

    it('shows selected option labels', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options, modelValue: ['apple', 'banana'] },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Apple')
        expect(trigger.text()).toContain('Banana')
    })

    it('shows count when selections exceed maxDisplay', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options, modelValue: ['apple', 'banana', 'cherry'], maxDisplay: 2 },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('3 selected')
    })

    it('emits update:modelValue when options selected', async () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options },
            attachTo: document.body,
        })
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('is disabled when disabled prop is true', () => {
        const wrapper = mount(ComboboxMulti, {
            props: { options, disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('disabled')).toBeDefined()
    })
})
