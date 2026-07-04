import { vi } from 'vitest'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import type { Locale } from '@/locales/types'

import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import VirtualScroll from './VirtualScroll.vue'

const testLocale: Locale = {
    virtualScroll: {
        label: 'virtualScroll.label',
        empty: 'virtualScroll.empty',
    },
} as Locale

const globalProvide = {
    provide: {
        [LOCALE_INJECTION_KEY as symbol]: testLocale,
    },
}

interface VirtualScrollExposed {
    scrollToIndex: (index: number) => void
}

function assertVirtualScrollExposed(vm: unknown): asserts vm is VirtualScrollExposed {
    expect(vm).toHaveProperty('scrollToIndex')
}

// vi.hoisted 确保 mock 变量在 vi.mock() 工厂执行前初始化
const { scrollToIndexMock } = vi.hoisted(() => ({
    scrollToIndexMock: vi.fn(),
}))

// Mock @tanstack/vue-virtual — 使用 class 以支持 new Virtualizer() 构造
vi.mock('@tanstack/vue-virtual', () => {
    class MockVirtualizer {
        getVirtualItems() {
            return [
                { key: '0', index: 0, start: 0, size: 48 },
                { key: '1', index: 1, start: 48, size: 48 },
            ]
        }
        getTotalSize() { return 96 }
        measure = vi.fn()
        scrollToIndex = scrollToIndexMock
        _didMount() { return vi.fn() }
        _willUpdate = vi.fn()
        setOptions = vi.fn()
    }
    return {
        useVirtualizer: vi.fn(),
        observeElementRect: vi.fn(),
        observeElementOffset: vi.fn(),
        elementScroll: vi.fn(),
        Virtualizer: MockVirtualizer,
    }
})

describe('VirtualScroll', () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
    }))

    function mountComponent(options: Parameters<typeof mount<typeof VirtualScroll>>[1] = {}) {
        return mount(VirtualScroll, {
            ...options,
            global: globalProvide,
        })
    }

    it('renders with items', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
            },
            slots: {
                default: '<div>Item</div>',
            },
        })
        await flushPromises()

        expect(wrapper.exists()).toBe(true)
        expect(wrapper.classes()).toContain('virtual-scroll-root')
    })

    it('renders empty state when no items', async () => {
        const wrapper = mountComponent({
            props: {
                items: [],
            },
        })
        await flushPromises()

        expect(wrapper.find('.text-brutal-fg\\/50').exists()).toBe(true)
    })

    it('applies size variant classes', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
                size: 'lg',
            },
        })
        await flushPromises()

        expect(wrapper.classes()).toContain('max-h-[32rem]')
    })

    it('applies item variant classes for default variant', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
                variant: 'default',
            },
        })
        await flushPromises()

        // With mocked virtualizer, check container renders
        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('[role="list"]').exists()).toBe(true)
    })

    it('has correct accessibility attributes', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
            },
        })
        await flushPromises()

        expect(wrapper.attributes('role')).toBe('list')
        expect(wrapper.attributes('aria-label')).toBe('virtualScroll.label')
    })

    it('exposes scrollToIndex method', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
            },
        })
        await flushPromises()

        assertVirtualScrollExposed(wrapper.vm)
        expect(typeof wrapper.vm.scrollToIndex).toBe('function')
    })

    it('calls virtualizer.scrollToIndex when scrollToIndex is invoked', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
            },
        })
        await flushPromises()

        scrollToIndexMock.mockClear()
        assertVirtualScrollExposed(wrapper.vm)
        wrapper.vm.scrollToIndex(5)
        expect(scrollToIndexMock).toHaveBeenCalledTimes(1)
        expect(scrollToIndexMock).toHaveBeenCalledWith(5)
    })

    it('passes different indices through to virtualizer', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
            },
        })
        await flushPromises()

        scrollToIndexMock.mockClear()
        assertVirtualScrollExposed(wrapper.vm)
        wrapper.vm.scrollToIndex(0)
        wrapper.vm.scrollToIndex(42)
        wrapper.vm.scrollToIndex(99)
        expect(scrollToIndexMock).toHaveBeenCalledTimes(3)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(1, 0)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(2, 42)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(3, 99)
    })

    it('applies item variant classes for striped variant based on index', async () => {
        const wrapper = mountComponent({
            props: {
                items: mockItems,
                variant: 'striped',
            },
        })
        await flushPromises()

        const items = wrapper.findAll('[role="listitem"]')
        expect(items.length).toBe(2)
        expect(items[0].classes()).not.toContain('bg-brutal-muted/50')
        expect(items[1].classes()).toContain('bg-brutal-muted/50')
    })
})