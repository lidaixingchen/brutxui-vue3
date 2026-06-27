import { mount } from '@vue/test-utils'
import TypewriterText from './TypewriterText.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    document.body.textContent = ''
})

describe('TypewriterText', () => {
    it('renders with text prop', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Hello World' },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', class: 'custom-typewriter' },
        })
        expect(wrapper.classes()).toContain('custom-typewriter')
    })

    it('starts typing on mount', async () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Hi', speed: 10 },
        })
        // After a short delay, some text should appear
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(wrapper.text()).toContain('H')
    })

    it('emits start when typing begins', async () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'AB', speed: 10 },
        })
        await new Promise((resolve) => setTimeout(resolve, 5))
        expect(wrapper.emitted('start')).toBeTruthy()
    })

    it('emits complete when typing finishes', async () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'AB', speed: 10 },
        })
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(wrapper.emitted('complete')).toBeTruthy()
    })

    it('shows cursor by default', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', speed: 1000 },
        })
        const cursor = wrapper.find('[aria-hidden="true"]')
        expect(cursor.exists()).toBe(true)
    })

    it('hides cursor when cursor prop is false', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', cursor: false, speed: 1000 },
        })
        const cursor = wrapper.find('[aria-hidden="true"]')
        expect(cursor.exists()).toBe(false)
    })

    it('applies size variant', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', size: 'lg' },
        })
        expect(wrapper.classes()).toContain('text-lg')
    })

    it('applies weight variant', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', weight: 'bold' },
        })
        expect(wrapper.classes()).toContain('font-bold')
    })

    it('has aria-live attribute for accessibility', () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test' },
        })
        expect(wrapper.attributes('aria-live')).toBe('polite')
    })

    it('restarts animation when text prop changes', async () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Hello', speed: 10 },
        })
        await new Promise((resolve) => setTimeout(resolve, 50))
        await wrapper.setProps({ text: 'World' })
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(wrapper.text()).toContain('W')
    })

    it('respects delay prop', async () => {
        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Test', speed: 10, delay: 100 },
        })
        // Immediately after mount, text should be empty due to delay
        expect(wrapper.text()).not.toContain('T')
        // After delay + some typing time
        await new Promise((resolve) => setTimeout(resolve, 200))
        expect(wrapper.text()).toContain('T')
    })

    it('displays full text immediately when prefersReducedMotion', async () => {
        // Mock prefersReducedMotion
        const originalMatchMedia = window.matchMedia
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(prefers-reduced-motion: reduce)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))

        wrapper = mount(TypewriterText, {
            ...localeProvide,
            props: { text: 'Reduced Motion Test', speed: 10 },
        })

        // Text should appear immediately
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(wrapper.text()).toContain('Reduced Motion Test')

        // Both start and complete should be emitted
        expect(wrapper.emitted('start')).toBeTruthy()
        expect(wrapper.emitted('complete')).toBeTruthy()

        // Restore
        window.matchMedia = originalMatchMedia
    })
})
