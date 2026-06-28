import { mount } from '@vue/test-utils'
import { cn } from '../../lib/utils'
import TooltipContent from './TooltipContent.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('TooltipContent', () => {
    const contentStubs = {
        TooltipPortal: primitiveStub,
        TooltipContent: {
            template: '<div data-testid="tooltip-content"><slot /></div>',
        },
    }

    it('renders with default brutal styling classes', () => {
        const wrapper = mount(TooltipContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="tooltip-content"]')
        expect(content.classes()).toContain('bg-brutal-fg')
        expect(content.classes()).toContain('text-brutal-bg')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('z-50')
        expect(content.classes()).toContain('font-bold')
        expect(content.classes()).toContain('rounded-brutal')
        expect(content.classes()).toContain('shadow-brutal')
    })

    it('applies custom class', () => {
        const wrapper = mount(TooltipContent, {
            props: { class: 'custom-tooltip' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="tooltip-content"]')
        expect(content.classes()).toContain('custom-tooltip')
    })

    it('renders slot content', () => {
        const wrapper = mount(TooltipContent, {
            slots: { default: 'Tooltip text' },
            global: { stubs: contentStubs },
        })
        expect(wrapper.text()).toBe('Tooltip text')
    })

    it('has animation classes', () => {
        const wrapper = mount(TooltipContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="tooltip-content"]')
        const classStr = content.classes().join(' ')
        expect(classStr).toContain('animate-in')
        expect(classStr).toContain('fade-in-0')
        expect(classStr).toContain('zoom-in-95')
    })
})
