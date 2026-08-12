import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { h, nextTick, ref, type Component } from 'vue'
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
    DEFAULT_COPIED_DURATION: 2000,
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
        DEFAULT_COPIED_DURATION: 2000,
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

    it('applies default variant classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('bg-brutal-bg')
        expect(button.classes()).toContain('text-brutal-fg')
    })

    it('applies primary variant classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', variant: 'primary' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('bg-brutal-primary')
        expect(button.classes()).toContain('text-brutal-primary-foreground')
    })

    it('applies outline variant classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', variant: 'outline' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('bg-transparent')
        expect(button.classes()).toContain('text-brutal-fg')
    })

    it('applies sm size classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', size: 'sm' },
            ...localeProvide,
        })
        expect(wrapper.find('button').classes()).toContain('h-9')
    })

    it('applies default size classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        expect(wrapper.find('button').classes()).toContain('h-11')
    })

    it('applies lg size classes', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', size: 'lg' },
            ...localeProvide,
        })
        expect(wrapper.find('button').classes()).toContain('h-14')
    })

    it('copied state overrides variant background', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        mockCopied.value = true
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello', variant: 'primary' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(button.classes()).toContain('bg-brutal-success')
        expect(button.classes()).not.toContain('bg-brutal-primary')
    })

    it('shows Copied text and pressed classes in copied state', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        mockCopied.value = true
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        const button = wrapper.find('button')
        expect(wrapper.text()).toContain('Copied')
        expect(button.classes()).toContain('bg-brutal-success')
        // 保持按下态：位移 + 去阴影 + 禁过渡（transition-none 覆盖 base 的 transition-all）
        expect(button.classes()).toContain('transition-none')
        expect(button.classes()).not.toContain('transition-all')
    })

    it('shows copy failed feedback when copy fails', async () => {
        mockCopy.mockResolvedValue(false)
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        await wrapper.find('button').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain('Copy failed')
        expect(wrapper.find('button').classes()).toContain('bg-brutal-destructive')
    })

    it('failed state wins over copied for style, text and announcement', async () => {
        // 成功反馈窗口（copied=true）内再次点击失败：copied 由 useClipboard 定时器控制、
        // 组件侧无法清零，必须保证 failed 在模板/state/live region 三处渲染路径统一优先，
        // 避免「失败文案 + 成功样式 + 已复制播报」各自为政
        mockCopied.value = true
        mockCopy.mockResolvedValue(false)
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        await wrapper.find('button').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain('Copy failed')
        expect(wrapper.find('button').classes()).toContain('bg-brutal-destructive')
        expect(wrapper.find('[role="status"]').text()).toContain('Copy failed')
    })

    it('clears failed feedback when a later copy succeeds', async () => {
        mockCopy.mockResolvedValue(false)
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        await wrapper.find('button').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain('Copy failed')

        // 反馈窗口内再次点击成功：failed 需彻底清除（含定时器），不得随 copied 恢复而复活
        mockCopy.mockResolvedValue(true)
        mockCopied.value = true
        await wrapper.find('button').trigger('click')
        await nextTick()
        expect(wrapper.text()).toContain('Copied')
        expect(wrapper.find('button').classes()).toContain('bg-brutal-success')

        // copied 定时器到期（模拟置回 false）后应回到 idle，而非跳回失败态
        mockCopied.value = false
        await nextTick()
        expect(wrapper.text()).not.toContain('Copy failed')
        expect(wrapper.find('button').classes()).not.toContain('bg-brutal-destructive')
    })

    it('resets failed feedback after props.duration', async () => {
        vi.useFakeTimers()
        try {
            mockCopy.mockResolvedValue(false)
            const CopyToClipboard = await loadCopyToClipboard()
            const wrapper = mount(CopyToClipboard, {
                props: { text: 'hello', duration: 500 },
                ...localeProvide,
            })
            await wrapper.find('button').trigger('click')
            await nextTick()
            expect(wrapper.text()).toContain('Copy failed')
            vi.advanceTimersByTime(500)
            await nextTick()
            expect(wrapper.text()).toContain('Copy')
            expect(wrapper.text()).not.toContain('Copy failed')
        } finally {
            vi.useRealTimers()
        }
    })

    it('passes copied and failed to scoped slot', async () => {
        mockCopied.value = true
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            slots: {
                default: ({ copied, failed }: { copied: boolean; failed: boolean }) =>
                    h('span', `slot:${copied}:${failed}`),
            },
            ...localeProvide,
        })
        expect(wrapper.find('button').text()).toBe('slot:true:false')
    })

    it('renders a visually-hidden live region for copy status', async () => {
        const CopyToClipboard = await loadCopyToClipboard()
        const wrapper = mount(CopyToClipboard, {
            props: { text: 'hello' },
            ...localeProvide,
        })
        const status = wrapper.find('[role="status"]')
        expect(status.exists()).toBe(true)
        expect(status.classes()).toContain('sr-only')
    })

    // 必须放在本 describe 最后：vi.resetModules() 清空模块注册表后，后续动态 import
    // 会拿到新的 useLocale 模块实例（新的 LOCALE_INJECTION_KEY Symbol），与测试文件
    // 静态导入的旧 Symbol 失配，locale 注入静默失效（回退 zhCN）——该测试自身用真实
    // useClipboard 检测 isSupported，需要 resetModules，故放在末尾避免污染其他测试
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
})
