import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import AuthCard from './AuthCard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

describe('AuthCard', () => {
    it('renders with default props', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Welcome back')
        expect(wrapper.text()).toContain('Sign in to your account to continue')
    })

    it('shows custom title', () => {
        const wrapper = mount(AuthCard, {
            props: { title: 'Create Account' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Create Account')
    })

    it('shows custom description', () => {
        const wrapper = mount(AuthCard, {
            props: { description: 'Sign up for a new account' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Sign up for a new account')
    })

    it('renders email and password inputs', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        expect(inputs.length).toBe(2)
        expect(inputs[0].attributes('type')).toBe('email')
        expect(inputs[1].attributes('type')).toBe('password')
    })

    it('renders Google and GitHub buttons', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Google')
        expect(wrapper.text()).toContain('GitHub')
    })

    it('emits google-click when Google button is clicked', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const buttons = wrapper.findAll('button')
        const googleButton = buttons.find(b => b.text().includes('Google'))
        expect(googleButton).toBeTruthy()
        await googleButton!.trigger('click')
        expect(wrapper.emitted('google-click')).toBeTruthy()
        expect(wrapper.emitted('google-click')!.length).toBe(1)
    })

    it('emits github-click when GitHub button is clicked', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const buttons = wrapper.findAll('button')
        const githubButton = buttons.find(b => b.text().includes('GitHub'))
        expect(githubButton).toBeTruthy()
        await githubButton!.trigger('click')
        expect(wrapper.emitted('github-click')).toBeTruthy()
        expect(wrapper.emitted('github-click')!.length).toBe(1)
    })

    it('emits forgot-password when forgot password button is clicked', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const buttons = wrapper.findAll('button')
        const forgotButton = buttons.find(b => b.text().includes('Forgot password?'))
        expect(forgotButton).toBeTruthy()
        await forgotButton!.trigger('click')
        expect(wrapper.emitted('forgot-password')).toBeTruthy()
        expect(wrapper.emitted('forgot-password')!.length).toBe(1)
    })

    it('emits login-submit when form is submitted with valid credentials', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await inputs[1].setValue('password123')
        const form = wrapper.find('form')
        await form.trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeTruthy()
        expect(wrapper.emitted('login-submit')!.length).toBe(1)
        expect(wrapper.emitted('login-submit')![0]).toEqual([{ email: 'test@example.com', password: 'password123' }])
    })

    it('does not emit login-submit when form is submitted with empty fields', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const form = wrapper.find('form')
        await form.trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Please enter a valid email address')
        expect(wrapper.text()).toContain('Please enter your password')
    })

    it('does not emit login-submit when email format is invalid', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('invalid-email')
        await inputs[1].setValue('password123')
        const form = wrapper.find('form')
        await form.trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('toggles password visibility when toggle button is clicked', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const passwordInput = wrapper.findAll('input')[1]
        expect(passwordInput.attributes('type')).toBe('password')
        const toggleButton = wrapper.find('button[aria-label="Show password"]')
        expect(toggleButton.exists()).toBe(true)
        await toggleButton.trigger('click')
        expect(passwordInput.attributes('type')).toBe('text')
        const hideButton = wrapper.find('button[aria-label="Hide password"]')
        expect(hideButton.exists()).toBe(true)
        await hideButton.trigger('click')
        expect(passwordInput.attributes('type')).toBe('password')
    })

    it('renders Sign In submit button', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Sign In')
    })

    it('renders Register link', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        expect(wrapper.text()).toContain('Register')
    })

    it('applies custom class', () => {
        const wrapper = mount(AuthCard, {
            props: { class: 'my-auth' },
            ...localeProvide,
        })
        expect(wrapper.find('[class*="my-auth"]').exists()).toBe(true)
    })
})
