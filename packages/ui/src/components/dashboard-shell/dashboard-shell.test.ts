import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import DashboardShell from './DashboardShell.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('DashboardShell', () => {
    it('renders with default props', () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        expect(wrapper.find('aside').exists()).toBe(true)
        expect(wrapper.find('header').exists()).toBe(true)
        expect(wrapper.find('main').exists()).toBe(true)
    })

    it('shows default user email', () => {
        const wrapper = mount(DashboardShell, { ...localeProvide })
        expect(wrapper.text()).toContain('user@example.com')
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
        const wrapper = mount(DashboardShell, { ...localeProvide })
        const signOutButton = wrapper.findAll('button').find(b => b.text() === 'Sign out')
        expect(signOutButton).toBeTruthy()
        await signOutButton!.trigger('click')
        expect(wrapper.emitted('sign-out')).toBeTruthy()
        expect(wrapper.emitted('sign-out')!.length).toBe(1)
    })

    it('renders BrutxUI brand text in sidebar', () => {
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
})
