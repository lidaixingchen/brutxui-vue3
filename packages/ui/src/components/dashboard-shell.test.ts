import { mount } from '@vue/test-utils'
import DashboardShell from './DashboardShell.vue'

describe('DashboardShell', () => {
    it('renders with default props', () => {
        const wrapper = mount(DashboardShell)
        expect(wrapper.find('aside').exists()).toBe(true)
        expect(wrapper.find('header').exists()).toBe(true)
        expect(wrapper.find('main').exists()).toBe(true)
    })

    it('shows default user email', () => {
        const wrapper = mount(DashboardShell)
        expect(wrapper.text()).toContain('creator@brutxui.site')
    })

    it('shows custom user email', () => {
        const wrapper = mount(DashboardShell, {
            props: { userEmail: 'test@example.com' },
        })
        expect(wrapper.text()).toContain('test@example.com')
    })

    it('renders default slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { default: '<p>Main content</p>' },
        })
        expect(wrapper.find('main').text()).toBe('Main content')
    })

    it('renders sidebar slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { sidebar: '<a href="#">Dashboard</a>' },
        })
        expect(wrapper.find('nav').text()).toBe('Dashboard')
    })

    it('renders header slot content', () => {
        const wrapper = mount(DashboardShell, {
            slots: { header: '<span>Header content</span>' },
        })
        expect(wrapper.find('header').text()).toContain('Header content')
    })

    it('emits signOut when sign out button is clicked', async () => {
        const wrapper = mount(DashboardShell)
        const signOutButton = wrapper.findAll('button').find(b => b.text() === 'Sign out')
        expect(signOutButton).toBeTruthy()
        await signOutButton!.trigger('click')
        expect(wrapper.emitted('signOut')).toBeTruthy()
        expect(wrapper.emitted('signOut')!.length).toBe(1)
    })

    it('renders BrutxUI brand text in sidebar', () => {
        const wrapper = mount(DashboardShell)
        expect(wrapper.find('aside').text()).toContain('BrutxUI')
    })

    it('applies custom class', () => {
        const wrapper = mount(DashboardShell, {
            props: { class: 'my-shell' },
        })
        expect(wrapper.classes()).toContain('my-shell')
    })
})
