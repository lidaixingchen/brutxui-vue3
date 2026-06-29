import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import ErrorCard from './ErrorCard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('ErrorCard', () => {
    it('renders with default props', () => {
        const wrapper = mount(ErrorCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Something went wrong')
        expect(wrapper.text()).toContain('The operation could not be completed. Please try again.')
    })

    it('shows custom title', () => {
        const wrapper = mount(ErrorCard, {
            props: { title: 'Connection Failed' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Connection Failed')
    })

    it('shows custom description', () => {
        const wrapper = mount(ErrorCard, {
            props: { description: 'Unable to reach the server.' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Unable to reach the server.')
    })

    it('shows custom retry text', () => {
        const wrapper = mount(ErrorCard, {
            props: { retryText: 'Try Again' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Try Again')
    })

    it('shows default retry text from i18n', () => {
        const wrapper = mount(ErrorCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Retry')
    })

    it('emits retry when retry button is clicked', async () => {
        const wrapper = mount(ErrorCard, { ...localeProvide })
        const buttons = wrapper.findAll('button')
        const retryButton = buttons.find(b => b.text().includes('Retry'))
        expect(retryButton).toBeTruthy()
        await retryButton!.trigger('click')
        expect(wrapper.emitted('retry')).toBeTruthy()
        expect(wrapper.emitted('retry')!.length).toBe(1)
    })

    it('emits close when close button is clicked', async () => {
        const wrapper = mount(ErrorCard, { ...localeProvide })
        const buttons = wrapper.findAll('button')
        const closeButton = buttons.find(b => b.text().includes('Dismiss'))
        expect(closeButton).toBeTruthy()
        await closeButton!.trigger('click')
        expect(wrapper.emitted('close')).toBeTruthy()
        expect(wrapper.emitted('close')!.length).toBe(1)
    })

    it('renders actions slot', () => {
        const wrapper = mount(ErrorCard, {
            slots: { actions: '<div class="custom-action">Custom Action</div>' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Custom Action')
    })

    it('renders alert icon with default lg size from shared iconSizeVariants', () => {
        const wrapper = mount(ErrorCard, { ...localeProvide })
        const alertIcon = wrapper.find('svg')
        expect(alertIcon.classes()).toContain('h-5')
        expect(alertIcon.classes()).toContain('w-5')
    })

    it('keeps button chrome icons at fixed default size regardless of iconSize', () => {
        const wrapper = mount(ErrorCard, {
            props: { iconSize: 'xl' },
            ...localeProvide,
        })
        const alertIcon = wrapper.find('svg')
        expect(alertIcon.classes()).toContain('h-6')
        const buttonIcons = wrapper.findAll('button svg')
        expect(buttonIcons.length).toBe(2)
        for (const icon of buttonIcons) {
            expect(icon.classes()).toContain('h-4')
            expect(icon.classes()).toContain('w-4')
            expect(icon.classes()).not.toContain('h-6')
        }
    })

    it('applies custom class', () => {
        const wrapper = mount(ErrorCard, {
            props: { class: 'my-error' },
            ...localeProvide,
        })
        expect(wrapper.find('[class*="my-error"]').exists()).toBe(true)
    })
})
