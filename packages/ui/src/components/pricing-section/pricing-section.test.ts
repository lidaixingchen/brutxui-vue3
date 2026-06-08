import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import PricingSection from './PricingSection.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('PricingSection', () => {
    const mockPlans = [
        {
            name: 'Basic',
            price: '$9',
            description: 'For beginners',
            features: ['1 project', 'Basic support'],
            ctaText: 'Start Basic',
            variant: 'default' as const,
        },
        {
            name: 'Pro',
            price: '$29',
            description: 'For professionals',
            features: ['Unlimited projects', 'Priority support', 'Custom themes'],
            ctaText: 'Go Pro',
            popular: true,
            variant: 'primary' as const,
        },
        {
            name: 'Team',
            price: '$99',
            description: 'For teams',
            features: ['Everything in Pro', 'Team management', 'SSO'],
            ctaText: 'Contact Sales',
            variant: 'secondary' as const,
        },
    ]

    const subscriptionPlans = [
        {
            name: 'Starter',
            description: 'For side projects',
            priceMonthly: '$0',
            priceAnnually: '$0',
            features: [
                { text: '5 components', included: true },
                { text: 'Priority updates', included: false },
            ],
            buttonText: 'Get Started',
            buttonVariant: 'outline' as const,
        },
        {
            name: 'Pro',
            description: 'For professionals',
            priceMonthly: '$19',
            priceAnnually: '$15',
            features: [
                { text: 'All components', included: true },
                { text: 'Priority updates', included: true },
            ],
            popular: true,
            buttonText: 'Go Pro',
            buttonVariant: 'primary' as const,
        },
    ]

    it('renders with default props', () => {
        const wrapper = mount(PricingSection, { ...localeProvide })
        expect(wrapper.find('h2').text()).toBe('Simple, Transparent Brutalist Plans')
    })

    it('renders with plans prop', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        const cards = wrapper.findAll('.grid > div')
        expect(cards.length).toBe(3)
    })

    it('shows plan names', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Basic')
        expect(wrapper.text()).toContain('Pro')
        expect(wrapper.text()).toContain('Team')
    })

    it('shows plan prices', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('$9')
        expect(wrapper.text()).toContain('$29')
        expect(wrapper.text()).toContain('$99')
    })

    it('shows plan features', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('1 project')
        expect(wrapper.text()).toContain('Priority support')
        expect(wrapper.text()).toContain('Team management')
    })

    it('shows popular badge for popular plans', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Most Popular Tier')
    })

    it('renders custom title', () => {
        const wrapper = mount(PricingSection, {
            props: { title: 'Custom Pricing Title' },
            ...localeProvide,
        })
        expect(wrapper.find('h2').text()).toBe('Custom Pricing Title')
    })

    it('renders subtitle when provided', () => {
        const wrapper = mount(PricingSection, {
            props: { subtitle: 'Choose your plan' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Choose your plan')
    })

    it('does not render subtitle when not provided', () => {
        const wrapper = mount(PricingSection, { ...localeProvide })
        const subtitleEl = wrapper.find('p.text-brutal-muted-foreground')
        expect(subtitleEl.exists()).toBe(false)
    })

    it('renders with empty plans array', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: [] },
            ...localeProvide,
        })
        const cards = wrapper.findAll('.grid > div')
        expect(cards.length).toBe(0)
    })

    it('shows lifetime pricing label', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('/ lifetime')
    })

    it('supports subscription pricing with billing toggle', async () => {
        const wrapper = mount(PricingSection, {
            props: { plans: subscriptionPlans, billingMode: 'toggle' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('$19')
        expect(wrapper.text()).toContain('/mo')

        const annualButton = wrapper.findAll('button').find(button => button.text() === 'Annually')
        await annualButton!.trigger('click')

        expect(wrapper.text()).toContain('$15')
        expect(wrapper.text()).toContain('billed annually')
    })

    it('auto-enables billing toggle when requested and subscription prices exist', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: subscriptionPlans, billingMode: 'auto' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Monthly')
        expect(wrapper.text()).toContain('Annually')
    })

    it('renders excluded subscription features as unavailable', () => {
        const wrapper = mount(PricingSection, {
            props: { plans: subscriptionPlans, billingMode: 'toggle' },
            ...localeProvide,
        })
        const unavailableFeature = wrapper.find('.line-through')
        expect(unavailableFeature.exists()).toBe(true)
        expect(unavailableFeature.text()).toBe('Priority updates')
    })

    it('emits plan-select when plan button is clicked', async () => {
        const wrapper = mount(PricingSection, {
            props: { plans: mockPlans },
            ...localeProvide,
        })
        const basicButton = wrapper.findAll('button').find(button => button.text() === 'Start Basic')
        await basicButton!.trigger('click')
        expect(wrapper.emitted('plan-select')).toEqual([['Basic']])
    })

    it('applies custom class', () => {
        const wrapper = mount(PricingSection, {
            props: { class: 'my-pricing' },
            ...localeProvide,
        })
        expect(wrapper.classes()).toContain('my-pricing')
    })
})
