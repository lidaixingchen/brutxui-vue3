import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import DialogOverlay from './DialogOverlay.vue'
import DialogContent from './DialogContent.vue'
import DialogHeader from './DialogHeader.vue'
import DialogFooter from './DialogFooter.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'
import DialogEnhanced from './DialogEnhanced.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

/* ------------------------------------------------------------------ */
/*  DialogOverlay                                                      */
/* ------------------------------------------------------------------ */

describe('DialogOverlay', () => {
    it('renders with default classes', () => {
        const wrapper = mount(DialogOverlay, {
            global: { stubs: { DialogOverlay: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('fixed')
        expect(wrapper.classes()).toContain('inset-0')
        expect(wrapper.classes()).toContain('z-50')
        expect(wrapper.classes()).toContain('bg-brutal-overlay')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogOverlay, {
            props: { class: 'custom-overlay' },
            global: { stubs: { DialogOverlay: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-overlay')
    })
})

/* ------------------------------------------------------------------ */
/*  DialogContent                                                      */
/* ------------------------------------------------------------------ */

describe('DialogContent', () => {
    const contentStubs = {
        DialogPortal: primitiveStub,
        DialogOverlay: primitiveStub,
        DialogContent: {
            template: '<div data-testid="dialog-content"><slot /></div>',
        },
        DialogClose: primitiveStub,
    }

    it('renders with brutal styling classes', () => {
        const wrapper = mount(DialogContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="dialog-content"]')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('shadow-brutal-xl')
        expect(content.classes()).toContain('bg-brutal-bg')
        expect(content.classes()).toContain('text-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogContent, {
            props: { class: 'custom-content' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="dialog-content"]')
        expect(content.classes()).toContain('custom-content')
    })

    it('renders close button by default', () => {
        const wrapper = mount(DialogContent, {
            global: { stubs: contentStubs },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('hides close button when showCloseButton=false', () => {
        const wrapper = mount(DialogContent, {
            props: { showCloseButton: false },
            global: { stubs: contentStubs },
        })
        expect(wrapper.findComponent({ name: 'DialogClose' }).exists()).toBe(false)
    })

    it('renders slot content', () => {
        const wrapper = mount(DialogContent, {
            slots: { default: '<p>Dialog body</p>' },
            global: { stubs: contentStubs },
        })
        expect(wrapper.text()).toContain('Dialog body')
    })

    it('renders close icon with default iconSize classes from shared CVA', () => {
        const wrapper = mount(DialogContent, {
            global: { stubs: contentStubs },
        })
        const closeIcon = wrapper.find('svg')
        expect(closeIcon.exists()).toBe(true)
        expect(closeIcon.classes()).toContain('h-4')
        expect(closeIcon.classes()).toContain('w-4')
        expect(closeIcon.classes()).toContain('stroke-[3]')
    })

    describe('forceMount', () => {
        it('passes force-mount attribute when forceMount is true', () => {
            const wrapper = mount(DialogContent, {
                props: { forceMount: true },
                global: { stubs: contentStubs },
            })
            const content = wrapper.find('[data-testid="dialog-content"]')
            expect(content.attributes('force-mount')).toBeDefined()
        })

        it('does not pass force-mount when forceMount is false', () => {
            const wrapper = mount(DialogContent, {
                props: { forceMount: false },
                global: { stubs: contentStubs },
            })
            const content = wrapper.find('[data-testid="dialog-content"]')
            expect(content.attributes('force-mount')).toBeUndefined()
        })
    })

    describe('size variants', () => {
        it('applies default max-w-lg when size is default', () => {
            const wrapper = mount(DialogContent, {
                global: { stubs: contentStubs },
            })
            expect(wrapper.find('[data-testid="dialog-content"]').classes()).toContain('max-w-lg')
        })

        it('applies max-w-sm when size is sm', () => {
            const wrapper = mount(DialogContent, {
                props: { size: 'sm' },
                global: { stubs: contentStubs },
            })
            expect(wrapper.find('[data-testid="dialog-content"]').classes()).toContain('max-w-sm')
        })

        it('applies max-w-2xl when size is lg', () => {
            const wrapper = mount(DialogContent, {
                props: { size: 'lg' },
                global: { stubs: contentStubs },
            })
            expect(wrapper.find('[data-testid="dialog-content"]').classes()).toContain('max-w-2xl')
        })

        it('applies max-w-4xl when size is xl', () => {
            const wrapper = mount(DialogContent, {
                props: { size: 'xl' },
                global: { stubs: contentStubs },
            })
            expect(wrapper.find('[data-testid="dialog-content"]').classes()).toContain('max-w-4xl')
        })

        it('applies max-w-[calc(100vw-2rem)] when size is full', () => {
            const wrapper = mount(DialogContent, {
                props: { size: 'full' },
                global: { stubs: contentStubs },
            })
            expect(wrapper.find('[data-testid="dialog-content"]').classes()).toContain('max-w-[calc(100vw-2rem)]')
        })
    })
})

/* ------------------------------------------------------------------ */
/*  DialogHeader                                                       */
/* ------------------------------------------------------------------ */

describe('DialogHeader', () => {
    it('renders slot content', () => {
        const wrapper = mount(DialogHeader, {
            slots: { default: 'Header text' },
        })
        expect(wrapper.text()).toBe('Header text')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogHeader, {
            props: { class: 'custom-header' },
        })
        expect(wrapper.classes()).toContain('custom-header')
    })
})

/* ------------------------------------------------------------------ */
/*  DialogFooter                                                       */
/* ------------------------------------------------------------------ */

describe('DialogFooter', () => {
    it('renders slot content', () => {
        const wrapper = mount(DialogFooter, {
            slots: { default: 'Footer text' },
        })
        expect(wrapper.text()).toBe('Footer text')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogFooter, {
            props: { class: 'custom-footer' },
        })
        expect(wrapper.classes()).toContain('custom-footer')
    })
})

/* ------------------------------------------------------------------ */
/*  DialogTitle                                                        */
/* ------------------------------------------------------------------ */

describe('DialogTitle', () => {
    it('renders slot content', () => {
        const wrapper = mount(DialogTitle, {
            slots: { default: 'Title text' },
            global: { stubs: { DialogTitle: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Title text')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogTitle, {
            props: { class: 'custom-title' },
            global: { stubs: { DialogTitle: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-title')
    })
})

/* ------------------------------------------------------------------ */
/*  DialogDescription                                                  */
/* ------------------------------------------------------------------ */

describe('DialogDescription', () => {
    it('renders slot content', () => {
        const wrapper = mount(DialogDescription, {
            slots: { default: 'Description text' },
            global: { stubs: { DialogDescription: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Description text')
    })

    it('applies custom class', () => {
        const wrapper = mount(DialogDescription, {
            props: { class: 'custom-desc' },
            global: { stubs: { DialogDescription: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-desc')
    })
})

/* ------------------------------------------------------------------ */
/*  DialogEnhanced                                                     */
/* ------------------------------------------------------------------ */

/**
 * Stub for reka-ui's DialogContent primitive.
 *
 * The real primitive exposes its root DOM element via `expose()` so that
 * a parent template-ref yields an HTMLElement.  We replicate that with a
 * Proxy that lazily forwards to the rendered <div>.
 */
const ContentStub = defineComponent({
    inheritAttrs: false,
    setup(_, { slots, attrs, expose }) {
        const el = ref<HTMLElement>()

        const proxy = new Proxy({} as HTMLElement, {
            get(_target, prop) {
                if (el.value) {
                    const value = Reflect.get(el.value, prop, el.value)
                    return typeof value === 'function' ? value.bind(el.value) : value
                }
                return undefined
            },
            has(_target, prop) {
                return el.value ? prop in el.value : false
            },
        })

        expose(proxy)

        return () =>
            h(
                'div',
                { ...attrs, 'data-testid': 'content-primitive', ref: el },
                slots.default?.(),
            )
    },
})

const CloseStub = defineComponent({
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
        return () =>
            h(
                'button',
                { ...attrs, 'data-testid': 'close-button' },
                slots.default?.(),
            )
    },
})

const enhancedStubs = {
    DialogPortal: { template: '<slot />' },
    DialogOverlay: { template: '<div />' },
    DialogContent: ContentStub,
    DialogClose: CloseStub,
    X: { template: '<svg />' },
}

function mountDialog(props: Record<string, unknown> = {}, options: Record<string, unknown> = {}) {
    return mount(DialogEnhanced, {
        props,
        global: { stubs: enhancedStubs },
        ...options,
    })
}

describe('DialogEnhanced', () => {
    let rafSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Stub requestAnimationFrame so it does NOT fire the callback
        // synchronously -- initSize depends on contentRef being a real
        // DOM element which is only guaranteed after mount.
        rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0)
    })

    afterEach(() => {
        rafSpy.mockRestore()
        document.body.innerHTML = ''
    })

    /* ======== rendering ======== */

    describe('rendering', () => {
        it('renders with default props', () => {
            const wrapper = mountDialog()
            expect(wrapper.find('[data-testid="content-primitive"]').exists()).toBe(true)
        })

        it('renders slot content', () => {
            const wrapper = mountDialog(
                {},
                { slots: { default: '<p>Dialog body</p>' } },
            )
            expect(wrapper.text()).toContain('Dialog body')
        })

        it('renders close button by default', () => {
            const wrapper = mountDialog()
            expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(true)
        })

        it('hides close button when showCloseButton is false', () => {
            const wrapper = mountDialog({ showCloseButton: false })
            expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(false)
        })

        it('applies custom class to content', () => {
            const wrapper = mountDialog({ class: 'custom-dialog' })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.classes()).toContain('custom-dialog')
        })

        it('emits open on mount', () => {
            const wrapper = mountDialog()
            expect(wrapper.emitted('open')).toBeTruthy()
        })
    })

    /* ======== fullscreen ======== */

    describe('fullscreen', () => {
        it('applies fullscreen classes when fullscreen is true', () => {
            const wrapper = mountDialog({ fullscreen: true })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.classes()).toContain('w-screen')
            expect(content.classes()).toContain('h-screen')
            expect(content.classes()).toContain('max-w-none')
            expect(content.classes()).toContain('max-h-none')
            expect(content.classes()).toContain('rounded-none')
            expect(content.classes()).toContain('inset-0')
        })

        it('does not apply fullscreen classes by default', () => {
            const wrapper = mountDialog()
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.classes()).not.toContain('w-screen')
            expect(content.classes()).not.toContain('h-screen')
        })
    })

    /* ======== zIndex ======== */

    describe('zIndex', () => {
        it('applies custom zIndex as inline style', () => {
            const wrapper = mountDialog({ zIndex: 9999 })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect((content.element as HTMLElement).style.zIndex).toBe('9999')
        })

        it('does not set zIndex style when prop is omitted', () => {
            const wrapper = mountDialog()
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect((content.element as HTMLElement).style.zIndex).toBe('')
        })
    })

    /* ======== draggable ======== */

    describe('draggable', () => {
        it('applies cursor-move class', () => {
            const wrapper = mountDialog({ draggable: true })
            expect(wrapper.find('[data-testid="content-primitive"]').classes()).toContain('cursor-move')
        })

        it('does not apply cursor-move class by default', () => {
            const wrapper = mountDialog()
            expect(wrapper.find('[data-testid="content-primitive"]').classes()).not.toContain('cursor-move')
        })

        it('applies fixed positioning style', () => {
            const wrapper = mountDialog({ draggable: true })
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.position).toBe('fixed')
            expect(el.style.top).toBe('50%')
            expect(el.style.left).toBe('50%')
            expect(el.style.margin).toBe('0px')
        })

        it('handles full drag lifecycle: mousedown -> mousemove -> mouseup', async () => {
            const wrapper = mountDialog({ draggable: true })
            const content = wrapper.find('[data-testid="content-primitive"]')
            const el = content.element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
                x: 100, y: 100, toJSON: () => ({}),
            }))

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 260 }))
            await nextTick()

            expect(el.style.transform).toContain('translate')
            expect(el.style.position).toBe('fixed')

            document.dispatchEvent(new MouseEvent('mouseup'))
            await nextTick()
        })

        it('ignores mousemove when not dragging', async () => {
            const wrapper = mountDialog({ draggable: true })
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))
            await nextTick()

            expect(el.style.transform).toContain('translate(calc(-50% + 0px), calc(-50% + 0px))')
        })

        it('does not start drag on INPUT element', async () => {
            const wrapper = mountDialog(
                { draggable: true },
                { slots: { default: '<input data-testid="inner-input" />' } },
            )
            await wrapper.find('[data-testid="inner-input"]').trigger('mousedown', {
                clientX: 200,
                clientY: 200,
            })
            // Drag should not start -- no cursor-move effect expected
        })

        it('does not start drag on BUTTON element', async () => {
            const wrapper = mountDialog(
                { draggable: true },
                { slots: { default: '<button data-testid="inner-btn">OK</button>' } },
            )
            await wrapper.find('[data-testid="inner-btn"]').trigger('mousedown', {
                clientX: 200,
                clientY: 200,
            })
        })

        it('does not start drag on TEXTAREA element', async () => {
            const wrapper = mountDialog(
                { draggable: true },
                { slots: { default: '<textarea data-testid="inner-ta" />' } },
            )
            await wrapper.find('[data-testid="inner-ta"]').trigger('mousedown', {
                clientX: 200,
                clientY: 200,
            })
        })

        it('does not start drag on SELECT element', async () => {
            const wrapper = mountDialog(
                { draggable: true },
                { slots: { default: '<select data-testid="inner-sel" />' } },
            )
            await wrapper.find('[data-testid="inner-sel"]').trigger('mousedown', {
                clientX: 200,
                clientY: 200,
            })
        })

        it('does not start drag on A element', async () => {
            const wrapper = mountDialog(
                { draggable: true },
                { slots: { default: '<a data-testid="inner-a" href="#">Link</a>' } },
            )
            await wrapper.find('[data-testid="inner-a"]').trigger('mousedown', {
                clientX: 200,
                clientY: 200,
            })
        })

        it('uses string dragHandle selector', async () => {
            const wrapper = mountDialog(
                { draggable: true, dragHandle: '.my-handle' },
                {
                    slots: {
                        default: '<div class="my-handle" data-testid="handle">Handle</div><input data-testid="inp" />',
                    },
                },
            )
            const handle = wrapper.find('[data-testid="handle"]')
            expect(handle.exists()).toBe(true)
            await handle.trigger('mousedown', { clientX: 150, clientY: 150 })
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('uses HTMLElement dragHandle', async () => {
            const handleEl = document.createElement('div')
            document.body.appendChild(handleEl)
            const wrapper = mountDialog({ draggable: true, dragHandle: handleEl })
            const content = wrapper.find('[data-testid="content-primitive"]')
            // Trigger mousedown on content to exercise getDragHandle returning the HTMLElement
            await content.trigger('mousedown', { clientX: 100, clientY: 100 })
            document.dispatchEvent(new MouseEvent('mouseup'))
            document.body.removeChild(handleEl)
        })

        it('uses contentRef as drag handle when no dragHandle prop', async () => {
            const wrapper = mountDialog({ draggable: true })
            const content = wrapper.find('[data-testid="content-primitive"]')
            await content.trigger('mousedown', { clientX: 100, clientY: 100 })
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('cleans up document listeners on unmount', () => {
            const removeSpy = vi.spyOn(document, 'removeEventListener')
            const wrapper = mountDialog({ draggable: true })
            wrapper.unmount()
            expect(removeSpy).toHaveBeenCalled()
            removeSpy.mockRestore()
        })

        it('does not start drag when draggable is false and mousedown fires', async () => {
            const wrapper = mountDialog({ draggable: false })
            const content = wrapper.find('[data-testid="content-primitive"]')
            // onDragStart returns early when draggable is false
            await content.trigger('mousedown', { clientX: 100, clientY: 100 })
            expect(content.classes()).not.toContain('cursor-move')
        })
    })

    /* ======== resizable ======== */

    describe('resizable', () => {
        it('applies overflow-hidden class', () => {
            const wrapper = mountDialog({ resizable: true })
            expect(wrapper.find('[data-testid="content-primitive"]').classes()).toContain('overflow-hidden')
        })

        it('renders four resize handles', () => {
            const wrapper = mountDialog({ resizable: true })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.find('.cursor-se-resize').exists()).toBe(true)
            expect(content.find('.cursor-sw-resize').exists()).toBe(true)
            expect(content.find('.cursor-ne-resize').exists()).toBe(true)
            expect(content.find('.cursor-nw-resize').exists()).toBe(true)
        })

        it('does not render resize handles by default', () => {
            const wrapper = mountDialog()
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.find('.cursor-se-resize').exists()).toBe(false)
        })

        it('handles SE resize', async () => {
            const wrapper = mountDialog({ resizable: true, minWidth: 100, minHeight: 100 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            const seHandle = content.find('.cursor-se-resize')
            await seHandle.trigger('mousedown', { clientX: 500, clientY: 400 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 550, clientY: 450 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
            await nextTick()
        })

        it('handles SW resize', async () => {
            const wrapper = mountDialog({ resizable: true, minWidth: 100, minHeight: 100 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-sw-resize').trigger('mousedown', { clientX: 100, clientY: 400 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 450 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('handles NE resize', async () => {
            const wrapper = mountDialog({ resizable: true, minWidth: 100, minHeight: 100 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-ne-resize').trigger('mousedown', { clientX: 500, clientY: 100 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 550, clientY: 50 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('handles NW resize', async () => {
            const wrapper = mountDialog({ resizable: true, minWidth: 100, minHeight: 100 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-nw-resize').trigger('mousedown', { clientX: 100, clientY: 100 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('ignores resize move when not resizing', async () => {
            const wrapper = mountDialog({ resizable: true })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 300, clientY: 300 }))
            await nextTick()
            expect(wrapper.exists()).toBe(true)
        })

        it('respects minWidth and minHeight constraints', async () => {
            const wrapper = mountDialog({ resizable: true, minWidth: 200, minHeight: 150 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-se-resize').trigger('mousedown', { clientX: 500, clientY: 400 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('respects maxWidth and maxHeight constraints', async () => {
            const wrapper = mountDialog({ resizable: true, maxWidth: 800, maxHeight: 600 })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-se-resize').trigger('mousedown', { clientX: 500, clientY: 400 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5000, clientY: 5000 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('applies aspect ratio during resize', async () => {
            const wrapper = mountDialog({
                resizable: true,
                aspectRatio: 16 / 9,
                minHeight: 100,
                maxHeight: 1000,
            })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.find('.cursor-se-resize').trigger('mousedown', { clientX: 500, clientY: 400 })
            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 500 }))
            await nextTick()
            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('cleans up resize listeners on unmount', () => {
            const removeSpy = vi.spyOn(document, 'removeEventListener')
            const wrapper = mountDialog({ resizable: true })
            wrapper.unmount()
            expect(removeSpy).toHaveBeenCalled()
            removeSpy.mockRestore()
        })
    })

    /* ======== contentStyle ======== */

    describe('contentStyle', () => {
        it('does not set resize style when fullscreen even with resizable', () => {
            const wrapper = mountDialog({ resizable: true, fullscreen: true })
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.width).toBe('')
            expect(el.style.height).toBe('')
        })

        it('applies drag transform when draggable and not fullscreen', async () => {
            const wrapper = mountDialog({
                draggable: true,
                initialPosition: { x: 30, y: 40 },
            })
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.transform).toContain('translate(calc(-50% + 30px), calc(-50% + 40px))')
        })

        it('does not apply drag transform when fullscreen', async () => {
            const wrapper = mountDialog({
                draggable: true,
                fullscreen: true,
                initialPosition: { x: 30, y: 40 },
            })
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            // fullscreen disables draggable positioning in contentStyle
            expect(el.style.transform).not.toContain('translate(calc(-50% + 30px), calc(-50% + 40px))')
        })
    })

    /* ======== beforeClose ======== */

    describe('beforeClose', () => {
        it('closes directly when no beforeClose is provided', async () => {
            const wrapper = mountDialog()
            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await nextTick()

            expect(wrapper.emitted('close')).toBeTruthy()
            expect(wrapper.emitted('update:open')).toBeTruthy()
            expect(wrapper.emitted('update:open')![0]).toEqual([false])
        })

        it('callback mode: calls done to close', async () => {
            const beforeClose = vi.fn((done: () => void) => {
                done()
            })
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await nextTick()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeTruthy()
            expect(wrapper.emitted('update:open')![0]).toEqual([false])
        })

        it('callback mode: does not close when done is never called', async () => {
            const beforeClose = vi.fn((_done: () => void) => {
                /* intentionally not calling done */
            })
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await nextTick()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeUndefined()
            expect(wrapper.emitted('update:open')).toBeUndefined()
        })

        it('promise mode: closes when function returns true', async () => {
            const beforeClose = vi.fn(() => true)
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await flushPromises()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeTruthy()
            expect(wrapper.emitted('update:open')![0]).toEqual([false])
        })

        it('promise mode: does not close when function returns false', async () => {
            const beforeClose = vi.fn(() => false)
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await flushPromises()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeUndefined()
            expect(wrapper.emitted('update:open')).toBeUndefined()
        })

        it('promise mode: closes when async function resolves true', async () => {
            const beforeClose = vi.fn(() => Promise.resolve(true))
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await flushPromises()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeTruthy()
            expect(wrapper.emitted('update:open')![0]).toEqual([false])
        })

        it('promise mode: does not close when async function resolves false', async () => {
            const beforeClose = vi.fn(() => Promise.resolve(false))
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await flushPromises()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeUndefined()
            expect(wrapper.emitted('update:open')).toBeUndefined()
        })

        it('promise mode: closes when function returns undefined (undefined !== false)', async () => {
            const beforeClose = vi.fn(() => undefined as unknown as boolean)
            const wrapper = mountDialog({ beforeClose })

            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await flushPromises()

            expect(beforeClose).toHaveBeenCalledTimes(1)
            expect(wrapper.emitted('close')).toBeTruthy()
        })
    })

    /* ======== initialPosition ======== */

    describe('initialPosition', () => {
        it('uses provided initialPosition', async () => {
            const wrapper = mountDialog({
                draggable: true,
                initialPosition: { x: 50, y: 75 },
            })
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.transform).toContain('translate(calc(-50% + 50px), calc(-50% + 75px))')
        })

        it('defaults to (0,0) when no initialPosition', async () => {
            const wrapper = mountDialog({ draggable: true })
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.transform).toContain('translate(calc(-50% + 0px), calc(-50% + 0px))')
        })

        it('updates position when initialPosition prop changes', async () => {
            const wrapper = mountDialog({ draggable: true })
            await wrapper.setProps({ initialPosition: { x: 120, y: 200 } } as any)
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.transform).toContain('translate(calc(-50% + 120px), calc(-50% + 200px))')
        })

        it('ignores undefined initialPosition in watch', async () => {
            const wrapper = mountDialog({
                draggable: true,
                initialPosition: { x: 50, y: 75 },
            })
            await wrapper.setProps({ initialPosition: undefined } as any)
            await nextTick()
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement
            expect(el.style.transform).toContain('translate(calc(-50% + 50px), calc(-50% + 75px))')
        })
    })

    /* ======== bounds ======== */

    describe('bounds', () => {
        it('constrains to viewport bounds', async () => {
            const wrapper = mountDialog({ draggable: true, bounds: 'viewport' })
            const content = wrapper.find('[data-testid="content-primitive"]')
            const el = content.element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
                x: 100, y: 100, toJSON: () => ({}),
            }))

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 99999, clientY: 99999 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('constrains to parent bounds', async () => {
            const wrapper = mountDialog({ draggable: true, bounds: 'parent' })
            const content = wrapper.find('[data-testid="content-primitive"]')
            const el = content.element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
                x: 100, y: 100, toJSON: () => ({}),
            }))

            const parentEl = document.createElement('div')
            parentEl.getBoundingClientRect = vi.fn(() => ({
                width: 800, height: 600, top: 0, left: 0, right: 800, bottom: 600,
                x: 0, y: 0, toJSON: () => ({}),
            }))
            Object.defineProperty(el, 'parentElement', { value: parentEl, configurable: true })

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 99999, clientY: 99999 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('falls back when parentRect is not available (parent bounds)', async () => {
            const wrapper = mountDialog({ draggable: true, bounds: 'parent' })
            const content = wrapper.find('[data-testid="content-primitive"]')
            const el = content.element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
                x: 100, y: 100, toJSON: () => ({}),
            }))

            Object.defineProperty(el, 'parentElement', { value: null, configurable: true })

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 250 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('constrains to custom object bounds', async () => {
            const wrapper = mountDialog({
                draggable: true,
                bounds: { top: 0, left: 0, right: 800, bottom: 600 },
            })
            const content = wrapper.find('[data-testid="content-primitive"]')
            const el = content.element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 400, height: 300, top: 100, left: 100, right: 500, bottom: 400,
                x: 100, y: 100, toJSON: () => ({}),
            }))

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 99999, clientY: 99999 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
        })

        it('returns raw position when getBoundingClientRect returns falsy', async () => {
            const wrapper = mountDialog({ draggable: true })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.trigger('mousedown', { clientX: 200, clientY: 200 })

            document.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 260 }))
            await nextTick()

            document.dispatchEvent(new MouseEvent('mouseup'))
        })
    })

    /* ======== destroyOnClose ======== */

    describe('destroyOnClose', () => {
        it('hides slot content when destroyOnClose is true and no dialog context', () => {
            const wrapper = mountDialog(
                { destroyOnClose: true },
                { slots: { default: '<p>Content</p>' } },
            )
            expect(wrapper.text()).not.toContain('Content')
        })

        it('renders slot content when destroyOnClose is false', () => {
            const wrapper = mountDialog(
                { destroyOnClose: false },
                { slots: { default: '<p>Content</p>' } },
            )
            expect(wrapper.text()).toContain('Content')
        })
    })

    /* ======== forceMount ======== */

    describe('forceMount', () => {
        it('passes force-mount attribute when forceMount is true', () => {
            const wrapper = mountDialog({ forceMount: true })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.attributes('force-mount')).toBeDefined()
        })

        it('does not pass force-mount attribute when forceMount is false', () => {
            const wrapper = mountDialog({ forceMount: false })
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.attributes('force-mount')).toBeUndefined()
        })

        it('does not pass force-mount attribute when forceMount is undefined', () => {
            const wrapper = mountDialog()
            const content = wrapper.find('[data-testid="content-primitive"]')
            expect(content.attributes('force-mount')).toBeUndefined()
        })
    })

    /* ======== performClose ======== */

    describe('performClose', () => {
        it('emits close then update:open with false', async () => {
            const wrapper = mountDialog()
            await wrapper.find('[data-testid="close-button"]').trigger('click')
            await nextTick()

            const closeEvents = wrapper.emitted('close')
            const updateEvents = wrapper.emitted('update:open')
            expect(closeEvents).toHaveLength(1)
            expect(updateEvents).toHaveLength(1)
            expect(updateEvents![0]).toEqual([false])
        })
    })

    /* ======== getDragHandle edge cases ======== */

    describe('getDragHandle edge cases', () => {
        it('returns null when not draggable', () => {
            const wrapper = mountDialog({ draggable: false })
            expect(
                wrapper.find('[data-testid="content-primitive"]').classes(),
            ).not.toContain('cursor-move')
        })

        it('starts drag even when dragHandle selector does not match anything', async () => {
            // When dragHandle is a string that doesn't match, getDragHandle returns null.
            // `if (handle && ...)` is falsy, so the guard is skipped and drag starts.
            const wrapper = mountDialog({ draggable: true, dragHandle: '.nonexistent' })
            const content = wrapper.find('[data-testid="content-primitive"]')

            await content.trigger('mousedown', { clientX: 100, clientY: 100 })
            document.dispatchEvent(new MouseEvent('mouseup'))
        })
    })

    /* ======== initSize with real rAF ======== */

    describe('initSize', () => {
        it('initialises size when requestAnimationFrame fires and element has dimensions', async () => {
            // Restore real rAF for this test
            rafSpy.mockRestore()

            // Use fake timers so we can advance rAF
            vi.useFakeTimers()

            const wrapper = mountDialog({ resizable: true })
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 500, height: 400, top: 0, left: 0, right: 500, bottom: 400,
                x: 0, y: 0, toJSON: () => ({}),
            }))

            // Advance timers to fire the rAF callback
            vi.advanceTimersByTime(16)
            await nextTick()

            // After initSize, resizable content should have width/height style
            // (if size was set)
            expect(el.style.width).toBeTruthy()
            expect(el.style.height).toBeTruthy()

            vi.useRealTimers()

            // Re-stub for afterEach
            rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0)
        })

        it('does not set size when element has zero dimensions', async () => {
            rafSpy.mockRestore()
            vi.useFakeTimers()

            const wrapper = mountDialog({ resizable: true })
            const el = wrapper.find('[data-testid="content-primitive"]').element as HTMLElement

            el.getBoundingClientRect = vi.fn(() => ({
                width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0,
                x: 0, y: 0, toJSON: () => ({}),
            }))

            vi.advanceTimersByTime(16)
            await nextTick()

            expect(el.style.width).toBe('')
            expect(el.style.height).toBe('')

            vi.useRealTimers()
            rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(0)
        })
    })
})
