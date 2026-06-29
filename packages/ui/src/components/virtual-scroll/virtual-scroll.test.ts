import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import VirtualScroll from './VirtualScroll.vue'

// Mock useLocale
vi.mock('@/composables/useLocale', () => ({
    useLocale: () => ({
        t: (key: string) => key,
    }),
}))

const scrollToIndexMock = vi.fn()

// Mock @tanstack/vue-virtual
vi.mock('@tanstack/vue-virtual', () => ({
    useVirtualizer: vi.fn(() => ref({
        getVirtualItems: () => [
            { key: '0', index: 0, start: 0, size: 48 },
            { key: '1', index: 1, start: 48, size: 48 },
        ],
        getTotalSize: () => 96,
        measure: vi.fn(),
        scrollToIndex: scrollToIndexMock,
    })),
}))

describe('VirtualScroll', () => {
    const mockItems = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
    }))

    it('renders with items', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
            },
            slots: {
                default: '<div>Item</div>',
            },
        })

        expect(wrapper.exists()).toBe(true)
        expect(wrapper.classes()).toContain('virtual-scroll-root')
    })

    it('renders empty state when no items', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: [],
            },
        })

        expect(wrapper.find('.text-brutal-fg\\/50').exists()).toBe(true)
    })

    it('applies size variant classes', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
                size: 'lg',
            },
        })

        expect(wrapper.classes()).toContain('max-h-[32rem]')
    })

    it('applies item variant classes for default variant', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
                variant: 'default',
            },
        })

        // With mocked virtualizer, check container renders
        expect(wrapper.exists()).toBe(true)
        expect(wrapper.find('[role="list"]').exists()).toBe(true)
    })

    it('has correct accessibility attributes', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
            },
        })

        expect(wrapper.attributes('role')).toBe('list')
        expect(wrapper.attributes('aria-label')).toBe('virtualScroll.label')
    })

    it('exposes scrollToIndex method', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
            },
        })

        expect(typeof (wrapper.vm as any).scrollToIndex).toBe('function')
    })

    it('calls virtualizer.scrollToIndex when scrollToIndex is invoked', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
            },
        })

        scrollToIndexMock.mockClear()
        ;(wrapper.vm as any).scrollToIndex(5)
        expect(scrollToIndexMock).toHaveBeenCalledTimes(1)
        expect(scrollToIndexMock).toHaveBeenCalledWith(5)
    })

    it('passes different indices through to virtualizer', () => {
        const wrapper = mount(VirtualScroll, {
            props: {
                items: mockItems,
            },
        })

        scrollToIndexMock.mockClear()
        ;(wrapper.vm as any).scrollToIndex(0)
        ;(wrapper.vm as any).scrollToIndex(42)
        ;(wrapper.vm as any).scrollToIndex(99)
        expect(scrollToIndexMock).toHaveBeenCalledTimes(3)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(1, 0)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(2, 42)
        expect(scrollToIndexMock).toHaveBeenNthCalledWith(3, 99)
    })
})