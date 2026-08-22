import { mount } from '@vue/test-utils'
import { cn } from '@/lib/utils'
import {
    SCROLL_THICKNESS,
    scrollAreaRootVariants,
    scrollAreaScrollbarVariants,
    scrollAreaThumbVariants,
} from './scroll-area-variants'
import ScrollArea from './ScrollArea.vue'
import ScrollBar from './ScrollBar.vue'

describe('ScrollArea', () => {
    it('computes root variant classes', () => {
        const classes = scrollAreaRootVariants()
        expect(classes).toContain('relative')
        expect(classes).toContain('overflow-hidden')
    })

    it('renders with default props', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
        })
        expect(wrapper.element.tagName).toBe('DIV')
        expect(wrapper.classes()).toContain('relative')
        expect(wrapper.classes()).toContain('overflow-hidden')
        wrapper.unmount()
    })

    it('renders slot content', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            slots: { default: '<p>Scrollable content</p>' },
        })
        expect(wrapper.text()).toContain('Scrollable content')
        wrapper.unmount()
    })

    it('applies custom class', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { class: 'my-scroll' },
        })
        expect(wrapper.classes()).toContain('my-scroll')
        wrapper.unmount()
    })

    it('applies custom viewportClass', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { viewportClass: 'custom-viewport-padding' },
        })
        const viewport = wrapper.find('[data-reka-scroll-area-viewport]')
        expect(viewport.classes()).toContain('custom-viewport-padding')
        expect(viewport.classes()).toContain('h-full')
        expect(viewport.classes()).toContain('w-full')
        wrapper.unmount()
    })

    it('passes variant to ScrollBar', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { variant: 'primary' },
        })
        const scrollbar = wrapper.findComponent(ScrollBar)
        expect((scrollbar.props as any)('variant')).toBe('primary')
        wrapper.unmount()
    })

    it('passes size to ScrollBar', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { size: 'lg' },
        })
        const scrollbar = wrapper.findComponent(ScrollBar)
        expect((scrollbar.props as any)('size')).toBe('lg')
        wrapper.unmount()
    })
})

describe('ScrollBar', () => {
    it('renders within ScrollArea', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
        })
        const scrollbar = wrapper.findComponent(ScrollBar)
        expect(scrollbar.exists()).toBe(true)
        wrapper.unmount()
    })

    it('computes vertical orientation classes', () => {
        const classes = scrollAreaScrollbarVariants({ orientation: 'vertical' })
        expect(classes).toContain('h-full')
        expect(classes).toContain(`w-[var(--scroll-thickness,${SCROLL_THICKNESS.default})]`)
        expect(classes).toContain('border-l-3')
        expect(classes).toContain('touch-none')
    })

    it('computes horizontal orientation classes', () => {
        const classes = scrollAreaScrollbarVariants({ orientation: 'horizontal' })
        expect(classes).toContain(`h-[var(--scroll-thickness,${SCROLL_THICKNESS.default})]`)
        expect(classes).toContain('flex-col')
        expect(classes).toContain('border-t-3')
    })

    it('computes classes with custom class merged', () => {
        const classes = cn(
            scrollAreaScrollbarVariants({ orientation: 'vertical' }),
            'my-scrollbar'
        )
        expect(classes).toContain('my-scrollbar')
        expect(classes).toContain('touch-none')
    })

    it('applies default variant border color', () => {
        const classes = scrollAreaScrollbarVariants({ variant: 'default', orientation: 'vertical' })
        expect(classes).toContain('border-brutal')
    })

    it('applies primary variant border color', () => {
        const classes = scrollAreaScrollbarVariants({ variant: 'primary', orientation: 'vertical' })
        expect(classes).toContain('border-brutal-primary')
    })

    it('applies accent variant border color', () => {
        const classes = scrollAreaScrollbarVariants({ variant: 'accent', orientation: 'vertical' })
        expect(classes).toContain('border-brutal-accent')
    })

    it('applies sm size thickness variable', () => {
        const classes = scrollAreaScrollbarVariants({ size: 'sm', orientation: 'vertical' })
        expect(classes).toContain(`[--scroll-thickness:${SCROLL_THICKNESS.sm}]`)
    })

    it('applies default size thickness variable', () => {
        const classes = scrollAreaScrollbarVariants({ size: 'default', orientation: 'vertical' })
        expect(classes).toContain(`[--scroll-thickness:${SCROLL_THICKNESS.default}]`)
    })

    it('applies lg size thickness variable', () => {
        const classes = scrollAreaScrollbarVariants({ size: 'lg', orientation: 'vertical' })
        expect(classes).toContain(`[--scroll-thickness:${SCROLL_THICKNESS.lg}]`)
    })
})

describe('ScrollAreaThumb', () => {
    it('applies default variant bg color', () => {
        const classes = scrollAreaThumbVariants({ variant: 'default' })
        expect(classes).toContain('bg-brutal-fg')
    })

    it('applies primary variant bg color', () => {
        const classes = scrollAreaThumbVariants({ variant: 'primary' })
        expect(classes).toContain('bg-brutal-primary')
    })

    it('applies accent variant bg color', () => {
        const classes = scrollAreaThumbVariants({ variant: 'accent' })
        expect(classes).toContain('bg-brutal-accent')
    })

    it('thumb 携带防滑凹槽纹理与拖拽吸附高亮', () => {
        const classTokens = scrollAreaThumbVariants({ variant: 'default' }).split(/\s+/)
        expect(
            classTokens.some(c => c.startsWith('bg-[image:repeating-linear-gradient') && c.includes('var(--brutal-bg')),
        ).toBe(true)
        expect(classTokens).toContain('active:ring-2')
        expect(classTokens).toContain('active:ring-inset')
    })
})

