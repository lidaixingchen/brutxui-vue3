import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DashboardShell from './DashboardShell.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

function mockMatchMedia(matches: boolean): void {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia
}

describe('DashboardShell', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
        originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
    })

    it('renders with default props', () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        expect(wrapper.find('aside').exists()).toBe(true)
        expect(wrapper.find('header').exists()).toBe(true)
        expect(wrapper.find('main').exists()).toBe(true)
    })

    it('hides email when userEmail is not provided', () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        expect(wrapper.text()).not.toContain('user@example.com')
    })

    it('shows custom user email', () => {
        const wrapper = mount(DashboardShell, {
            props: { userEmail: 'test@example.com' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('test@example.com')
    })

    it('renders default slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { default: '<p>Main content</p>' },
            ...localeProvide,
        })
        expect(wrapper.find('main').text()).toBe('Main content')
    })

    it('renders sidebar slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { sidebar: '<a href="#">Dashboard</a>' },
            ...localeProvide,
        })
        expect(wrapper.find('nav').text()).toBe('Dashboard')
    })

    it('renders header slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { header: '<span>Header content</span>' },
            ...localeProvide,
        })
        expect(wrapper.find('header').text()).toContain('Header content')
    })

    it('emits sign-out when sign out button is clicked', async () => {
        const wrapper = mount(DashboardShell, {
            props: { userEmail: 'test@example.com' },
            ...localeProvide,
        })
        const signOutButton = wrapper.findAll('button').find(b => b.text() === 'Sign out')
        expect(signOutButton).toBeTruthy()
        await signOutButton!.trigger('click')
        expect(wrapper.emitted('sign-out')).toBeTruthy()
        expect(wrapper.emitted('sign-out')!.length).toBe(1)
    })

    it('renders localized brand text in sidebar', () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        expect(wrapper.find('aside').text()).toContain('BrutxUI')
    })

    it('applies custom class', () => {
        const wrapper = mount(DashboardShell, {
            props: { class: 'my-shell' },
            ...localeProvide,
        })
        expect(wrapper.classes()).toContain('my-shell')
    })

    it('applies open/closed classes to sidebar', async () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        const aside = wrapper.find('aside')
        expect(aside.classes()).toContain('w-64')
        expect(aside.classes()).toContain('p-4')
        expect(aside.classes()).toContain('border-r-3')

        const toggleBtn = wrapper.find('header button')
        expect(toggleBtn.exists()).toBe(true)
        await toggleBtn.trigger('click')

        expect(aside.classes()).toContain('w-0')
        expect(aside.classes()).toContain('p-0')
        expect(aside.classes()).toContain('overflow-hidden')
        expect(aside.classes()).toContain('border-r-0')
    })

    it('links toggle button with sidebar via aria-expanded and aria-controls', async () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        const toggleBtn = wrapper.find('header button')
        const aside = wrapper.find('aside')
        expect(toggleBtn.attributes('aria-controls')).toBe(aside.attributes('id'))
        expect(toggleBtn.attributes('aria-expanded')).toBe('true')

        await toggleBtn.trigger('click')
        expect(toggleBtn.attributes('aria-expanded')).toBe('false')
    })

    describe('mobile viewport', () => {
        beforeEach(() => {
            mockMatchMedia(false)
        })

        it('starts closed on mobile and marks sidebar inert', async () => {
            const wrapper = mount(DashboardShell, { ...localeProvide })
            await nextTick()
            const aside = wrapper.find('aside')
            expect(aside.classes()).toContain('w-0')
            expect(aside.attributes('inert')).toBeDefined()
        })

        it('removes inert and shows overlay when opened on mobile', async () => {
            const wrapper = mount(DashboardShell, { ...localeProvide })
            await nextTick()
            const aside = wrapper.find('aside')
            await wrapper.find('header button').trigger('click')
            expect(aside.attributes('inert')).toBeUndefined()
            expect(wrapper.find('.bg-brutal-overlay').exists()).toBe(true)
        })

        it('closes sidebar when overlay is clicked', async () => {
            const wrapper = mount(DashboardShell, { ...localeProvide })
            await nextTick()
            await wrapper.find('header button').trigger('click')
            const overlay = wrapper.find('.bg-brutal-overlay')
            expect(overlay.exists()).toBe(true)
            await overlay.trigger('click')
            expect(wrapper.find('aside').attributes('inert')).toBeDefined()
            expect(wrapper.find('.bg-brutal-overlay').exists()).toBe(false)
        })
    })
})
