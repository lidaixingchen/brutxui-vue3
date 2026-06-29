import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import Alert from './Alert.vue'
import AlertTitle from './AlertTitle.vue'
import AlertDescription from './AlertDescription.vue'

const globalProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('Alert', () => {
    it('renders with default variant', () => {
        const wrapper = mount(Alert)
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('text-brutal-fg')
    })

    it('applies variant classes', () => {
        const variantMap: Record<string, string[]> = {
            default: ['bg-brutal-bg', 'text-brutal-fg'],
            primary: ['bg-brutal-primary', 'text-brutal-primary-foreground'],
            secondary: ['bg-brutal-secondary', 'text-brutal-secondary-foreground'],
            success: ['bg-brutal-success', 'text-brutal-success-foreground'],
            warning: ['bg-brutal-accent', 'text-brutal-accent-foreground'],
            danger: ['bg-brutal-destructive', 'text-brutal-destructive-foreground'],
            info: ['bg-brutal-info', 'text-brutal-info-foreground'],
        }

        Object.entries(variantMap).forEach(([variant, expectedClasses]) => {
            const wrapper = mount(Alert, { props: { variant: variant as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' } })
            expectedClasses.forEach((cls) => {
                expect(wrapper.classes()).toContain(cls)
            })
        })
    })

    it('renders slot content', () => {
        const wrapper = mount(Alert, {
            slots: { default: '<p>Alert message</p>' },
        })
        expect(wrapper.text()).toBe('Alert message')
    })

    it('has role="alert"', () => {
        const wrapper = mount(Alert)
        expect(wrapper.attributes('role')).toBe('alert')
    })

    it('applies custom class', () => {
        const wrapper = mount(Alert, { props: { class: 'my-alert' } })
        expect(wrapper.classes()).toContain('my-alert')
    })

    describe('closable', () => {
        it('does not render close button by default', () => {
            const wrapper = mount(Alert, { ...globalProvide })
            expect(wrapper.find('button[aria-label="Close"]').exists()).toBe(false)
        })

        it('renders close button when closable is true', () => {
            const wrapper = mount(Alert, {
                props: { closable: true },
                ...globalProvide,
            })
            expect(wrapper.find('button[aria-label="Close"]').exists()).toBe(true)
        })

        it('adds pr-12 class when closable', () => {
            const wrapper = mount(Alert, {
                props: { closable: true },
                ...globalProvide,
            })
            expect(wrapper.classes()).toContain('pr-12')
        })

        it('emits close event when close button clicked', async () => {
            const wrapper = mount(Alert, {
                props: { closable: true },
                ...globalProvide,
            })
            await wrapper.find('button[aria-label="Close"]').trigger('click')
            expect(wrapper.emitted('close')).toBeTruthy()
            expect(wrapper.emitted('close')!.length).toBe(1)
        })
    })

    describe('actions slot', () => {
        it('renders actions slot content', () => {
            const wrapper = mount(Alert, {
                slots: { actions: '<button class="retry-btn">Retry</button>' },
                ...globalProvide,
            })
            expect(wrapper.find('.retry-btn').exists()).toBe(true)
        })

        it('does not render actions container when slot is empty', () => {
            const wrapper = mount(Alert, { ...globalProvide })
            expect(wrapper.find('.mt-3.flex.items-center.gap-2').exists()).toBe(false)
        })
    })
})

describe('AlertTitle', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertTitle, {
            slots: { default: 'Alert Title' },
        })
        expect(wrapper.text()).toBe('Alert Title')
    })

    it('renders h5 element', () => {
        const wrapper = mount(AlertTitle, {
            slots: { default: 'Title' },
        })
        expect(wrapper.element.tagName).toBe('H5')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertTitle, { props: { class: 'my-title' } })
        expect(wrapper.classes()).toContain('my-title')
    })
})

describe('AlertDescription', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDescription, {
            slots: { default: 'Alert description text' },
        })
        expect(wrapper.text()).toBe('Alert description text')
    })

    it('renders div element', () => {
        const wrapper = mount(AlertDescription)
        expect(wrapper.element.tagName).toBe('DIV')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDescription, { props: { class: 'my-desc' } })
        expect(wrapper.classes()).toContain('my-desc')
    })
})
