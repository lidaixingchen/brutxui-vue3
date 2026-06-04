import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import CopyToClipboard from './CopyToClipboard.vue'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const mockCopy = vi.fn()
const _mockCopied = ref(false)
const _mockIsSupported = ref(true)

vi.mock('../../composables/useClipboard', () => ({
    useClipboard: () => ({
        copy: mockCopy,
        get copied() { return _mockCopied.value },
        get isSupported() { return _mockIsSupported.value },
    }),
}))

describe('CopyToClipboard', () => {
    beforeEach(() => {
        _mockCopied.value = false
        _mockIsSupported.value = true
        mockCopy.mockReset()
    })

    it('renders a button element', () => {
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('shows Copy text by default', () => {
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Copy')
    })

    it('applies custom class', () => {
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', class: 'custom-class' },
            ...localeProvide,
        })
        expect(wrapper.find('button').classes()).toContain('custom-class')
    })

    it('applies idle variant classes by default', () => {
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('bg-brutal-bg')
        expect(button.classes()).toContain('border-3')
        expect(button.classes()).toContain('border-brutal')
        expect(button.classes()).toContain('shadow-brutal')
    })

    it('has disabled attribute when clipboard not supported', () => {
        _mockIsSupported.value = false
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.element.disabled).toBe(true)
    })

    it('renders slot content', () => {
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            slots: {
                default: '<span>Custom slot</span>',
            },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Custom slot')
    })
})
