import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DatePickerPanelFooter from './DatePickerPanelFooter.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('DatePickerPanelFooter', () => {
    it('emits clear and confirm actions', async () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: {
                clearLabel: 'Clear',
                confirmLabel: 'Confirm',
            },
            ...localeProvide,
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

    it('falls back to locale texts when empty strings provided', () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: {
                clearLabel: '',
                confirmLabel: '',
            },
            ...localeProvide,
        })
        const buttons = wrapper.findAll('button')
        expect(buttons[0].text()).toBe('Clear')
        expect(buttons[1].text()).toBe('Confirm')
    })

    it('uses locale defaults when labels omitted', () => {
        const wrapper = mount(DatePickerPanelFooter, {
            ...localeProvide,
        })
        const buttons = wrapper.findAll('button')
        expect(buttons[0].text()).toBe('Clear')
        expect(buttons[1].text()).toBe('Confirm')
    })

    it('disables both buttons when disabled', async () => {
        const wrapper = mount(DatePickerPanelFooter, {
            props: { disabled: true },
            ...localeProvide,
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
