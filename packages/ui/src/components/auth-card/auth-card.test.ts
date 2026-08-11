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

    it('rejects emails with internal whitespace', async () => {
        // 首尾空白会被浏览器 email input 的 value sanitization 自动 trim，到不了组件；
        // 此处用中间空格验证 EMAIL_REGEX 的边界
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('te st@example.com')
        await inputs[1].setValue('password123')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('rejects emails with consecutive @', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('a@@b.com')
        await inputs[1].setValue('password123')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Please enter a valid email address')
    })

    it('accepts emails with uppercase domain', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('Test@Example.COM')
        await inputs[1].setValue('password123')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeTruthy()
        expect(wrapper.emitted('login-submit')![0]).toEqual([
            { email: 'Test@Example.COM', password: 'password123' },
        ])
    })

    it('requires password when email is valid but password is empty', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Please enter your password')
    })

    it('rejects passwords shorter than the minimum length', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await inputs[1].setValue('abc12')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Password must be at least 6 characters')
    })

    it('respects a custom passwordMinLength prop', async () => {
        const wrapper = mount(AuthCard, { props: { passwordMinLength: 10 }, ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await inputs[1].setValue('shortpwd')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Password must be at least 10 characters')
    })

    it('clears the field error when the user fixes the input', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('invalid-email')
        await inputs[1].setValue('password123')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.text()).toContain('Please enter a valid email address')
        await inputs[0].setValue('test@example.com')
        expect(wrapper.text()).not.toContain('Please enter a valid email address')
    })

    it('disables submit and social buttons and blocks submission while submitting', async () => {
        const wrapper = mount(AuthCard, { props: { submitting: true }, ...localeProvide })
        const buttons = wrapper.findAll('button')
        expect(buttons.find(b => b.text().includes('Sign In'))?.attributes('disabled')).toBeDefined()
        expect(buttons.find(b => b.text().includes('Google'))?.attributes('disabled')).toBeDefined()
        expect(buttons.find(b => b.text().includes('GitHub'))?.attributes('disabled')).toBeDefined()
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
    })

    it('sets autocomplete attributes for password managers', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        expect(inputs[0].attributes('autocomplete')).toBe('email')
        expect(inputs[1].attributes('autocomplete')).toBe('current-password')
    })

    it('marks decorative icons as aria-hidden', () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        expect(wrapper.findAll('svg[aria-hidden="true"]').length).toBe(4)
    })

    it('counts password length by Unicode code points', async () => {
        // 'ab😀' 为 3 个码点（含代理对），按码点计数应 < 4 被拒；UTF-16 码元计为 4 会误放行
        const wrapper = mount(AuthCard, { props: { passwordMinLength: 4 }, ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('test@example.com')
        await inputs[1].setValue('ab😀')
        await wrapper.find('form').trigger('submit')
        expect(wrapper.emitted('login-submit')).toBeFalsy()
        expect(wrapper.text()).toContain('Password must be at least 4 characters')
    })

    it('marks invalid fields with error variant and aria-describedby', async () => {
        const wrapper = mount(AuthCard, { ...localeProvide })
        const inputs = wrapper.findAll('input')
        await inputs[0].setValue('invalid-email')
        await wrapper.find('form').trigger('submit')
        // Input 的 variant=error 推导 aria-invalid，两个字段均标记无效
        expect(inputs[0].attributes('aria-invalid')).toBe('true')
        expect(inputs[1].attributes('aria-invalid')).toBe('true')
        // 错误文本与输入框通过 aria-describedby 关联
        const describedBy = inputs[0].attributes('aria-describedby')
        expect(describedBy).toBeTruthy()
        expect(wrapper.find(`[id="${describedBy}"]`).exists()).toBe(true)
    })
})
