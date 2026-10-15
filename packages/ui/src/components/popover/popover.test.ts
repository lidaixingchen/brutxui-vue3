import { vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PopoverContent from './PopoverContent.vue'

vi.mock('reka-ui', async (importOriginal) => {
    const primitives = await importOriginal<typeof import('reka-ui')>()
    const { ref } = await import('vue')
    return {
        ...primitives,
        injectPopoverRootContext: () => ({ open: ref(false) }),
    }
})

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('PopoverContent', () => {
    const contentStubs = {
        PopoverPortal: primitiveStub,
        PopoverContent: {
            template: '<div data-testid="popover-content"><slot /></div>',
        },
    }

    it('renders with default classes', () => {
        const wrapper = mount(PopoverContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="popover-content"]')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('shadow-brutal')
        expect(content.classes()).toContain('bg-brutal-bg')
        expect(content.classes()).toContain('text-brutal-fg')
        expect(content.classes()).toContain('z-popover')
    })

    it('applies custom class', () => {
        const wrapper = mount(PopoverContent, {
            props: { class: 'custom-popover' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="popover-content"]')
        expect(content.classes()).toContain('custom-popover')
    })

    it('allows a caller z-index class to override the semantic default', () => {
        const wrapper = mount(PopoverContent, {
            props: { class: 'z-dialog' },
            global: { stubs: contentStubs },
        })

        const content = wrapper.find('[data-testid="popover-content"]')
        expect(content.classes()).toContain('z-dialog')
        expect(content.classes()).not.toContain('z-popover')
    })
})
