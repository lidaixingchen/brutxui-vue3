import { mount } from '@vue/test-utils'
import { cn } from '../../lib/utils'
import { scrollAreaScrollbarVariants, scrollAreaThumbVariants } from './scroll-area-variants'
import ScrollArea from './ScrollArea.vue'
import ScrollBar from './ScrollBar.vue'

describe('ScrollArea', () => {
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

    it('passes variant to ScrollBar', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { variant: 'primary' },
        })
        const scrollbar = wrapper.findComponent(ScrollBar)
        expect(scrollbar.props('variant')).toBe('primary')
        wrapper.unmount()
    })

    it('passes size to ScrollBar', () => {
        const wrapper = mount(ScrollArea, {
            attachTo: document.body,
            props: { size: 'lg' },
        })
        const scrollbar = wrapper.findComponent(ScrollBar)
        expect(scrollbar.props('size')).toBe('lg')
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
        expect(classes).toContain('w-[var(--scroll-thickness,0.75rem)]')
        expect(classes).toContain('border-l-3')
        expect(classes).toContain('touch-none')
    })

    it('computes horizontal orientation classes', () => {
        const classes = scrollAreaScrollbarVariants({ orientation: 'horizontal' })
        expect(classes).toContain('h-[var(--scroll-thickness,0.75rem)]')
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
        expect(classes).toContain('[--scroll-thickness:0.5rem]')
    })

    it('applies default size thickness variable', () => {
        const classes = scrollAreaScrollbarVariants({ size: 'default', orientation: 'vertical' })
        expect(classes).toContain('[--scroll-thickness:0.75rem]')
    })

    it('applies lg size thickness variable', () => {
        const classes = scrollAreaScrollbarVariants({ size: 'lg', orientation: 'vertical' })
        expect(classes).toContain('[--scroll-thickness:1rem]')
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
})
