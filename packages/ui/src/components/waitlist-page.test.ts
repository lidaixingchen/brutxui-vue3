import { mount } from '@vue/test-utils'
import WaitlistPage from './WaitlistPage.vue'

describe('WaitlistPage', () => {
    it('renders with default props', () => {
        const wrapper = mount(WaitlistPage)
        expect(wrapper.find('h1').text()).toBe('Join the BrutxUI Waitlist Club')
    })

    it('shows custom title', () => {
        const wrapper = mount(WaitlistPage, {
            props: { title: 'Join Us Early' },
        })
        expect(wrapper.find('h1').text()).toBe('Join Us Early')
    })

    it('shows description when provided', () => {
        const wrapper = mount(WaitlistPage, {
            props: { description: 'Be the first to know' },
        })
        expect(wrapper.text()).toContain('Be the first to know')
    })

    it('does not render description when not provided', () => {
        const wrapper = mount(WaitlistPage)
        const descEl = wrapper.find('p.text-brutal-muted-foreground')
        expect(descEl.exists()).toBe(false)
    })

    it('shows default CTA text', () => {
        const wrapper = mount(WaitlistPage)
        expect(wrapper.text()).toContain('Secure Priority Access')
    })

    it('shows custom CTA text', () => {
        const wrapper = mount(WaitlistPage, {
            props: { ctaText: 'Join Now' },
        })
        expect(wrapper.text()).toContain('Join Now')
    })

    it('renders email input', () => {
        const wrapper = mount(WaitlistPage)
        const input = wrapper.find('input[type="email"]')
        expect(input.exists()).toBe(true)
    })

    it('renders Early Access badge', () => {
        const wrapper = mount(WaitlistPage)
        expect(wrapper.text()).toContain('Early Access')
    })

    it('shows waitlist count when greater than 0', () => {
        const wrapper = mount(WaitlistPage, {
            props: { waitlistCount: 1234 },
        })
        expect(wrapper.text()).toContain('1,234')
        expect(wrapper.text()).toContain('on waitlist')
    })

    it('does not show waitlist count when 0', () => {
        const wrapper = mount(WaitlistPage, {
            props: { waitlistCount: 0 },
        })
        expect(wrapper.text()).not.toContain('on waitlist')
    })

    it('emits submit with email when form is submitted with email value', async () => {
        const wrapper = mount(WaitlistPage)
        const input = wrapper.find('input[type="email"]')
        await input.setValue('test@example.com')
        const form = wrapper.find('form')
        await form.trigger('submit')
        expect(wrapper.emitted('submit')).toBeTruthy()
        expect(wrapper.emitted('submit')![0]).toEqual(['test@example.com'])
    })

    it('does not emit submit when email is empty', async () => {
        const wrapper = mount(WaitlistPage)
        const form = wrapper.find('form')
        await form.trigger('submit')
        expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('renders star rating', () => {
        const wrapper = mount(WaitlistPage)
        const stars = wrapper.findAll('svg').filter(el => el.classes().some(c => c.includes('brutal-accent')))
        expect(stars.length).toBeGreaterThan(0)
    })

    it('renders Live indicator', () => {
        const wrapper = mount(WaitlistPage)
        expect(wrapper.text()).toContain('Live')
    })

    it('applies custom class', () => {
        const wrapper = mount(WaitlistPage, {
            props: { class: 'my-waitlist' },
        })
        expect(wrapper.classes()).toContain('my-waitlist')
    })
})
