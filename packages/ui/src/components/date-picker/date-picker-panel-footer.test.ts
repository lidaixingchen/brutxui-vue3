import { mount } from '@vue/test-utils'
import DatePickerPanelFooter from './DatePickerPanelFooter.vue'

describe('DatePickerPanelFooter', () => {
    it('emits clear and confirm actions', async () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: {
                clearLabel: 'Clear',
                confirmLabel: 'Confirm',
            },
        })

        const buttons = wrapper.findAll('button')
        expect(buttons).toHaveLength(2)
        expect(buttons[0].text()).toBe('Clear')
        expect(buttons[1].text()).toBe('Confirm')

        await buttons[0].trigger('click')
        await buttons[1].trigger('click')

        expect(wrapper.emitted('clear')).toHaveLength(1)
        expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('falls back to default labels when empty strings provided', () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: {
                clearLabel: '',
                confirmLabel: '',
            },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons[0].text()).toBe('Clear')
        expect(buttons[1].text()).toBe('Confirm')
    })

    it('uses defaults when labels omitted', () => {
        const wrapper = mount(DatePickerPanelFooter)
        const buttons = wrapper.findAll('button')
        expect(buttons[0].text()).toBe('Clear')
        expect(buttons[1].text()).toBe('Confirm')
    })

    it('disables both buttons when disabled', async () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: { disabled: true },
        })
        const buttons = wrapper.findAll('button')
        buttons.forEach((btn) => {
            expect(btn.attributes('disabled')).toBeDefined()
        })
        await buttons[0].trigger('click')
        await buttons[1].trigger('click')
        expect(wrapper.emitted('clear')).toBeUndefined()
        expect(wrapper.emitted('confirm')).toBeUndefined()
    })
})
