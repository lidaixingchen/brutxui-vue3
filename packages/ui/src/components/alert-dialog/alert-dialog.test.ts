import { mount } from '@vue/test-utils'
import AlertDialogContent from './AlertDialogContent.vue'
import AlertDialogHeader from './AlertDialogHeader.vue'
import AlertDialogFooter from './AlertDialogFooter.vue'
import AlertDialogTitle from './AlertDialogTitle.vue'
import AlertDialogDescription from './AlertDialogDescription.vue'
import AlertDialogAction from './AlertDialogAction.vue'
import AlertDialogCancel from './AlertDialogCancel.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('AlertDialogContent', () => {
    const contentStubs = {
        AlertDialogPortal: primitiveStub,
        AlertDialogOverlay: {
            template: '<div data-testid="alert-dialog-overlay"><slot /></div>',
        },
        AlertDialogContent: {
            template: '<div data-testid="alert-dialog-content"><slot /></div>',
        },
    }

    it('renders with brutal styling classes', () => {
        const wrapper = mount(AlertDialogContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="alert-dialog-content"]')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('shadow-brutal-xl')
        expect(content.classes()).toContain('bg-brutal-bg')
        expect(content.classes()).toContain('text-brutal-fg')
        expect(content.classes()).toContain('rounded-brutal')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogContent, {
            props: { class: 'custom-content' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="alert-dialog-content"]')
        expect(content.classes()).toContain('custom-content')
    })

    it('forwards attrs to content primitive (Teleport 根节点下 aria-*/data-* 不丢失)', () => {
        const wrapper = mount(AlertDialogContent, {
            attrs: { 'data-custom': 'foo', 'aria-label': 'Custom dialog' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="alert-dialog-content"]')
        expect(content.attributes('data-custom')).toBe('foo')
        expect(content.attributes('aria-label')).toBe('Custom dialog')
    })

    it('merges overlayClass into overlay', () => {
        const wrapper = mount(AlertDialogContent, {
            props: { overlayClass: 'custom-overlay' },
            global: { stubs: contentStubs },
        })
        const overlay = wrapper.find('[data-testid="alert-dialog-overlay"]')
        expect(overlay.classes()).toContain('custom-overlay')
    })
})

describe('AlertDialogHeader', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogHeader, {
            slots: { default: 'Header text' },
        })
        expect(wrapper.text()).toBe('Header text')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogHeader, {
            props: { class: 'custom-header' },
        })
        expect(wrapper.classes()).toContain('custom-header')
    })

    it('accepts array/object class forms', () => {
        const wrapper = mount(AlertDialogHeader, {
            props: { class: ['custom-header', { 'foo': true, 'bar': false }] },
            slots: { default: 'Header text' },
        })
        expect(wrapper.classes()).toContain('custom-header')
        expect(wrapper.classes()).toContain('foo')
        expect(wrapper.classes()).not.toContain('bar')
    })

    it('forwards attrs to root element', () => {
        const wrapper = mount(AlertDialogHeader, {
            attrs: { 'data-testid': 'header-root', 'aria-label': 'header' },
            slots: { default: 'Header text' },
        })
        expect(wrapper.attributes('data-testid')).toBe('header-root')
        expect(wrapper.attributes('aria-label')).toBe('header')
    })
})

describe('AlertDialogFooter', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogFooter, {
            slots: { default: 'Footer text' },
        })
        expect(wrapper.text()).toBe('Footer text')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogFooter, {
            props: { class: 'custom-footer' },
            slots: { default: 'Footer text' },
        })
        expect(wrapper.classes()).toContain('custom-footer')
    })

    it('renders nothing when default slot is empty', () => {
        const wrapper = mount(AlertDialogFooter)
        expect(wrapper.find('div').exists()).toBe(false)
    })

    it('accepts array/object class forms', () => {
        const wrapper = mount(AlertDialogFooter, {
            props: { class: ['custom-footer', { 'baz': true }] },
            slots: { default: 'Footer text' },
        })
        expect(wrapper.classes()).toContain('custom-footer')
        expect(wrapper.classes()).toContain('baz')
    })
})

describe('AlertDialogTitle', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogTitle, {
            slots: { default: 'Title text' },
            global: { stubs: { AlertDialogTitle: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Title text')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogTitle, {
            props: { class: 'custom-title' },
            global: { stubs: { AlertDialogTitle: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-title')
    })

    it('renders default fallback when slot is empty', () => {
        const wrapper = mount(AlertDialogTitle, {
            global: { stubs: { AlertDialogTitle: primitiveStub } },
        })
        expect(wrapper.text()).toContain('Alert')
    })
})

describe('AlertDialogDescription', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogDescription, {
            slots: { default: 'Description text' },
            global: { stubs: { AlertDialogDescription: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Description text')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogDescription, {
            props: { class: 'custom-desc' },
            global: { stubs: { AlertDialogDescription: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-desc')
    })
})

describe('AlertDialogAction', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogAction, {
            slots: { default: 'Confirm' },
            global: { stubs: { AlertDialogAction: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Confirm')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogAction, {
            props: { class: 'custom-action' },
            global: { stubs: { AlertDialogAction: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-action')
    })

    it('renders with default variant by default', () => {
        const wrapper = mount(AlertDialogAction, {
            global: { stubs: { AlertDialogAction: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('bg-brutal-bg')
    })
})

describe('AlertDialogCancel', () => {
    it('renders slot content', () => {
        const wrapper = mount(AlertDialogCancel, {
            slots: { default: 'Cancel' },
            global: { stubs: { AlertDialogCancel: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Cancel')
    })

    it('applies custom class', () => {
        const wrapper = mount(AlertDialogCancel, {
            props: { class: 'custom-cancel' },
            global: { stubs: { AlertDialogCancel: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-cancel')
    })

    it('renders with outline variant', () => {
        const wrapper = mount(AlertDialogCancel, {
            global: { stubs: { AlertDialogCancel: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('bg-transparent')
    })
})
