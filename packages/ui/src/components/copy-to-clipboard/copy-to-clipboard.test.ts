import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { ref, type Component } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const mockCopy = vi.fn()
const mockCopied = ref(false)
const mockIsSupported = ref(true)
const clipboardDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard')

vi.mock('../../composables/useClipboard', () => ({
    useClipboard: () => ({
        copy: mockCopy,
        copied: mockCopied,
        isSupported: mockIsSupported,
    }),
}))

async function loadCopyToClipboard(): Promise<Component> {
    const component = await import('./CopyToClipboard.vue')
    return component.default as Component
}

function restoreClipboard() {
    if (clipboardDescriptor) {
        Object.defineProperty(globalThis.navigator, 'clipboard', clipboardDescriptor)
    } else {
        Reflect.deleteProperty(globalThis.navigator, 'clipboard')
    }
}

function mockUseClipboard() {
    vi.doMock('../../composables/useClipboard', () => ({
        useClipboard: () => ({
            copy: mockCopy,
            copied: mockCopied,
            isSupported: mockIsSupported,
        }),
    }))
}

describe('CopyToClipboard', () => {
    beforeEach(() => {
        mockCopied.value = false
        mockIsSupported.value = true
        mockCopy.mockReset()
        restoreClipboard()
    })

    it('renders a button element', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        expect(wrapper.find('button').exists()).toBe(true)
        expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('shows Copy text by default', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        expect(wrapper.text()).toContain('Copy')
    })

    it('applies custom class', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', class: 'custom-class' },
            ...localeProvide,
        })
        expect(wrapper.find('button').classes()).toContain('custom-class')
    })

    it('applies idle variant classes by default', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
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

    it('has disabled attribute when clipboard not supported', async () => {
        vi.doUnmock('../../composables/useClipboard')
        Object.defineProperty(globalThis.navigator, 'clipboard', {
            configurable: true,
            value: undefined,
        })
        vi.resetModules()

        try {
            const CopyToClipboard = await loadCopyToClipboard()
            const wrapper = mount(CopyToClipboard, {
                props: { text: 'hello' },
                ...localeProvide,
            })
            const button = wrapper.find('button')
            expect(button.attributes('disabled')).toBeDefined()
        } finally {
            restoreClipboard()
            mockUseClipboard()
            vi.resetModules()
        }
    })

    it('renders slot content', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
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
