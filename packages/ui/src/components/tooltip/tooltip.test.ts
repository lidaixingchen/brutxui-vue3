import { mount } from '@vue/test-utils'
import TooltipContent from './TooltipContent.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('TooltipContent', () => {
    it('renders with default classes', () => {
        const wrapper = mount(TooltipContent, {
            global: { stubs: { TooltipContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('bg-brutal-fg')
        expect(wrapper.classes()).toContain('text-brutal-bg')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('z-50')
        expect(wrapper.classes()).toContain('font-bold')
    })

    it('applies custom class', () => {
        const wrapper = mount(TooltipContent, {
            props: { class: 'custom-tooltip' },
            global: { stubs: { TooltipContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-tooltip')
    })
})
