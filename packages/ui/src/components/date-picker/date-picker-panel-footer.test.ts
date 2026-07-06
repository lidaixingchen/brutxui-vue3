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
})
