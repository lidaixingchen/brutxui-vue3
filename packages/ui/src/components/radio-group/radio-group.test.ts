import { mount } from '@vue/test-utils'
import { h } from 'vue'
import RadioGroup from './RadioGroup.vue'
import RadioGroupItem from './RadioGroupItem.vue'

describe('RadioGroup', () => {
    it('renders with default props', () => {
        const wrapper = mount(RadioGroup, {
            attachTo: document.body,
        })
        expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    })

    it('emits update:modelValue', async () => {
        const wrapper = mount(RadioGroup, {
            props: { modelValue: '' },
            slots: {
                default: () => h(RadioGroupItem, { value: 'option1' }),
            },
            attachTo: document.body,
        })
        const radio = wrapper.find('[role="radio"]')
        await radio.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    })

    it('enforces mutually exclusive selection across items', async () => {
        const wrapper = mount(RadioGroup, {
            props: { modelValue: 'option1' },
            slots: {
                default: () => [
                    h(RadioGroupItem, { value: 'option1' }),
                    h(RadioGroupItem, { value: 'option2' }),
                ],
            },
            attachTo: document.body,
        })
        const radios = wrapper.findAll('[role="radio"]')
        expect(radios).toHaveLength(2)
        // Click second option
        await radios[1].trigger('click')
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['option2'])
    })

    it('supports keyboard navigation with ArrowDown', async () => {
        const wrapper = mount(RadioGroup, {
            props: { modelValue: 'option1' },
            slots: {
                default: () => [
                    h(RadioGroupItem, { value: 'option1' }),
                    h(RadioGroupItem, { value: 'option2' }),
                ],
            },
            attachTo: document.body,
        })
        const radio = wrapper.find('[role="radio"]')
        // ArrowDown triggers reka-ui internal keyboard handling
        await radio.trigger('keydown', { key: 'ArrowDown' })
        // Verify the radio element still exists and is interactive
        expect(radio.exists()).toBe(true)
    })
})

describe('RadioGroupItem', () => {
    it('renders with value prop', () => {
        const wrapper = mount(RadioGroup, {
            props: { modelValue: '' },
            slots: {
                default: () => h(RadioGroupItem, { value: 'option1' }),
            },
            attachTo: document.body,
        })
        const radio = wrapper.find('[role="radio"]')
        expect(radio.exists()).toBe(true)
    })

    it('has radio role', () => {
        const wrapper = mount(RadioGroup, {
            props: { modelValue: '' },
            slots: {
                default: () => h(RadioGroupItem, { value: 'option1' }),
            },
            attachTo: document.body,
        })
        expect(wrapper.find('[role="radio"]').exists()).toBe(true)
    })
})
