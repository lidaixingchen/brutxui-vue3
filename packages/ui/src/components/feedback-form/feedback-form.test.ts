import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import FeedbackForm from './FeedbackForm.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('FeedbackForm', () => {
    it('renders form by default', () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        expect(wrapper.find('form').exists()).toBe(true)
        expect(wrapper.findComponent({ name: 'SuccessCard' }).exists()).toBe(false)
    })

    it('renders SuccessCard when success prop is true', () => {
        const wrapper = mount(FeedbackForm, {
            props: { success: true },
            ...localeProvide,
        })
        expect(wrapper.find('form').exists()).toBe(false)
        expect(wrapper.findComponent({ name: 'SuccessCard' }).exists()).toBe(true)
    })

    it('passes successTitle to SuccessCard', () => {
        const wrapper = mount(FeedbackForm, {
            props: {
                success: true,
                successTitle: 'Thank you!',
            },
            ...localeProvide,
        })
        const successCard = wrapper.findComponent({ name: 'SuccessCard' })
        expect(successCard.props('title')).toBe('Thank you!')
    })

    it('passes successDescription to SuccessCard', () => {
        const wrapper = mount(FeedbackForm, {
            props: {
                success: true,
                successDescription: 'We received your feedback.',
            },
            ...localeProvide,
        })
        const successCard = wrapper.findComponent({ name: 'SuccessCard' })
        expect(successCard.props('description')).toBe('We received your feedback.')
    })

    it('passes successConfirmText to SuccessCard', () => {
        const wrapper = mount(FeedbackForm, {
            props: {
                success: true,
                successConfirmText: 'Done',
            },
            ...localeProvide,
        })
        const successCard = wrapper.findComponent({ name: 'SuccessCard' })
        expect(successCard.props('confirmText')).toBe('Done')
    })

    it('passes loading prop through to submit Button', () => {
        const wrapper = mount(FeedbackForm, {
            props: { loading: true },
            ...localeProvide,
        })
        const submitButton = wrapper.findComponent({ name: 'Button' })
        expect(submitButton.props('loading')).toBe(true)
    })

    it('does not pass loading to Button by default', () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        const submitButton = wrapper.findComponent({ name: 'Button' })
        expect(submitButton.props('loading')).toBe(false)
    })

    it('forwards success-confirm event from SuccessCard', async () => {
        const wrapper = mount(FeedbackForm, {
            props: { success: true },
            ...localeProvide,
        })
        const successCard = wrapper.findComponent({ name: 'SuccessCard' })
        successCard.vm.$emit('confirm')
        await wrapper.vm.$nextTick()

        const confirmEvents = wrapper.emitted('success-confirm')
        expect(confirmEvents).toBeTruthy()
        expect(confirmEvents!.length).toBe(1)
    })

    it('resets form fields after success-confirm', async () => {
        const wrapper = mount(FeedbackForm, {
            props: { success: false },
            ...localeProvide,
        })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('Alice')
        await inputs[1].setValue('alice@example.com')
        await wrapper.find('textarea').setValue('Great work!')

        await wrapper.setProps({ success: true })
        const successCard = wrapper.findComponent({ name: 'SuccessCard' })
        successCard.vm.$emit('confirm')
        await wrapper.vm.$nextTick()

        await wrapper.setProps({ success: false })

        const restoredInputs = wrapper.findAll('input')
        expect((restoredInputs[0].element as HTMLInputElement).value).toBe('')
        expect((restoredInputs[1].element as HTMLInputElement).value).toBe('')
        expect((wrapper.find('textarea').element as HTMLTextAreaElement).value).toBe('')
    })

    it('renders title prop in header', () => {
        const wrapper = mount(FeedbackForm, {
            props: { title: 'Contact Us' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Contact Us')
    })

    it('renders description prop in header', () => {
        const wrapper = mount(FeedbackForm, {
            props: { description: 'We would love to hear from you.' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('We would love to hear from you.')
    })

    it('uses default title from locale when not provided', () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        expect(wrapper.text()).toContain(en.feedbackForm.defaultTitle)
    })

    it('uses default submit text from locale when not provided', () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        const button = wrapper.findComponent({ name: 'Button' })
        expect(button.text()).toContain(en.feedbackForm.defaultSubmitText)
    })

    it('emits submit with form payload when validation passes', async () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('Alice')
        await inputs[1].setValue('alice@example.com')
        await wrapper.find('textarea').setValue('Great work!')
        await wrapper.find('form').trigger('submit.prevent')

        const submitEvents = wrapper.emitted('submit')
        expect(submitEvents).toBeTruthy()
        const [payload] = submitEvents![0] as [{ name: string; email: string; subject: string; message: string }]
        expect(payload.name).toBe('Alice')
        expect(payload.email).toBe('alice@example.com')
        expect(payload.message).toBe('Great work!')
    })

    it('does not emit submit when validation fails', async () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        await wrapper.find('form').trigger('submit.prevent')
        expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('does not emit submit when loading is true', async () => {
        const wrapper = mount(FeedbackForm, {
            props: { loading: true },
            ...localeProvide,
        })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('Alice')
        await inputs[1].setValue('alice@example.com')
        await wrapper.find('textarea').setValue('Great work!')
        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('shows validation error for invalid email', async () => {
        const wrapper = mount(FeedbackForm, {
            ...localeProvide,
        })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('Alice')
        await inputs[1].setValue('not-an-email')
        await wrapper.find('textarea').setValue('Great work!')
        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.text()).toContain(en.feedbackForm.emailInvalid)
    })
})
