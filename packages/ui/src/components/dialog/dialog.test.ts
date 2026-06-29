import { mount } from '@vue/test-utils'
import DialogOverlay from './DialogOverlay.vue'
import DialogContent from './DialogContent.vue'
import DialogHeader from './DialogHeader.vue'
import DialogFooter from './DialogFooter.vue'
import DialogTitle from './DialogTitle.vue'
import DialogDescription from './DialogDescription.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

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
        // DialogClose is rendered when showCloseButton defaults to true
        expect(wrapper.exists()).toBe(true)
    })

    it('hides close button when showCloseButton=false', () => {
        const wrapper = mount(DialogContent, {
            props: { showCloseButton: false },
            global: { stubs: contentStubs },
        })
        // The DialogClose stub should not be rendered
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
