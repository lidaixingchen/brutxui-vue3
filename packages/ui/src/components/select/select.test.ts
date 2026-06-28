import { mount } from '@vue/test-utils'
import SelectTrigger from './SelectTrigger.vue'
import SelectContent from './SelectContent.vue'
import SelectItem from './SelectItem.vue'
import SelectLabel from './SelectLabel.vue'
import SelectSeparator from './SelectSeparator.vue'
import SelectScrollUpButton from './SelectScrollUpButton.vue'
import SelectScrollDownButton from './SelectScrollDownButton.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('SelectTrigger', () => {
    it('renders with brutal styling classes', () => {
        const wrapper = mount(SelectTrigger, {
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('text-brutal-fg')
        expect(wrapper.classes()).toContain('font-bold')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectTrigger, {
            props: { class: 'custom-trigger' },
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-trigger')
    })

    it('applies default icon classes to chevron linked to size prop', () => {
        const wrapper = mount(SelectTrigger, {
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        const icon = wrapper.find('svg')
        expect(icon.classes()).toContain('h-4')
        expect(icon.classes()).toContain('w-4')
    })

    it('links chevron icon size to sm trigger size', () => {
        const wrapper = mount(SelectTrigger, {
            props: { size: 'sm' },
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        const icon = wrapper.find('svg')
        expect(icon.classes()).toContain('h-3')
        expect(icon.classes()).toContain('w-3')
        expect(icon.classes()).not.toContain('h-4')
    })

    it('links chevron icon size to lg trigger size', () => {
        const wrapper = mount(SelectTrigger, {
            props: { size: 'lg' },
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        const icon = wrapper.find('svg')
        expect(icon.classes()).toContain('h-5')
        expect(icon.classes()).toContain('w-5')
        expect(icon.classes()).not.toContain('h-4')
    })

    it('overrides icon size via iconClass prop', () => {
        const wrapper = mount(SelectTrigger, {
            props: { iconClass: 'h-3 w-3' },
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        const icon = wrapper.find('svg')
        expect(icon.classes()).toContain('h-3')
        expect(icon.classes()).toContain('w-3')
        expect(icon.classes()).not.toContain('h-5')
    })
})

describe('SelectContent', () => {
    const contentStubs = {
        SelectPortal: primitiveStub,
        SelectContent: {
            template: '<div data-testid="select-content"><slot /></div>',
        },
        SelectViewport: primitiveStub,
        SelectScrollUpButton: primitiveStub,
        SelectScrollDownButton: primitiveStub,
    }

    it('renders with brutal styling classes', () => {
        const wrapper = mount(SelectContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="select-content"]')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('shadow-brutal')
        expect(content.classes()).toContain('bg-brutal-bg')
        expect(content.classes()).toContain('text-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectContent, {
            props: { class: 'custom-content' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="select-content"]')
        expect(content.classes()).toContain('custom-content')
    })

    it('applies popper positioning classes', () => {
        const wrapper = mount(SelectContent, {
            props: { position: 'popper' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="select-content"]')
        // Popper position adds translate classes for offset
        const classes = content.classes().join(' ')
        expect(classes).toContain('data-[side=bottom]:translate-y-1')
    })
})

describe('SelectItem', () => {
    const itemStubs = {
        SelectItem: primitiveStub,
        SelectItemIndicator: primitiveStub,
        SelectItemText: primitiveStub,
    }

    it('renders slot content', () => {
        const wrapper = mount(SelectItem, {
            props: { value: 'test' },
            slots: { default: 'Item text' },
            global: { stubs: itemStubs },
        })
        expect(wrapper.text()).toBe('Item text')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectItem, {
            props: { value: 'test', class: 'custom-item' },
            global: { stubs: itemStubs },
        })
        expect(wrapper.classes()).toContain('custom-item')
    })

    it('applies default indicator classes', () => {
        const wrapper = mount(SelectItem, {
            props: { value: 'test' },
            global: { stubs: itemStubs },
        })
        const indicator = wrapper.find('span.absolute')
        expect(indicator.classes()).toContain('left-2')
        expect(indicator.classes()).toContain('h-4')
        expect(indicator.classes()).toContain('w-4')
    })

    it('overrides indicator layout via indicatorClass prop', () => {
        const wrapper = mount(SelectItem, {
            props: { value: 'test', indicatorClass: 'left-1 h-3 w-3' },
            global: { stubs: itemStubs },
        })
        const indicator = wrapper.find('span.absolute')
        expect(indicator.classes()).toContain('left-1')
        expect(indicator.classes()).toContain('h-3')
        expect(indicator.classes()).toContain('w-3')
        expect(indicator.classes()).not.toContain('left-2')
    })

    it('overrides check icon size via iconClass prop', () => {
        const wrapper = mount(SelectItem, {
            props: { value: 'test', iconClass: 'h-3 w-3' },
            global: { stubs: itemStubs },
        })
        const icon = wrapper.find('span.absolute svg')
        expect(icon.classes()).toContain('h-3')
        expect(icon.classes()).toContain('w-3')
        expect(icon.classes()).not.toContain('h-4')
    })
})

describe('SelectLabel', () => {
    it('renders slot content', () => {
        const wrapper = mount(SelectLabel, {
            slots: { default: 'Label text' },
            global: { stubs: { SelectLabel: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Label text')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectLabel, {
            props: { class: 'custom-label' },
            global: { stubs: { SelectLabel: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-label')
    })
})

describe('SelectSeparator', () => {
    it('renders with separator styling', () => {
        const wrapper = mount(SelectSeparator, {
            global: { stubs: { SelectSeparator: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('h-[var(--brutal-border-width,3px)]')
        expect(wrapper.classes()).toContain('bg-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectSeparator, {
            props: { class: 'custom-sep' },
            global: { stubs: { SelectSeparator: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-sep')
    })
})

describe('SelectScrollUpButton', () => {
    it('renders with default classes', () => {
        const wrapper = mount(SelectScrollUpButton, {
            global: { stubs: { SelectScrollUpButton: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('justify-center')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectScrollUpButton, {
            props: { class: 'custom-scroll-up' },
            global: { stubs: { SelectScrollUpButton: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-scroll-up')
    })
})

describe('SelectScrollDownButton', () => {
    it('renders with default classes', () => {
        const wrapper = mount(SelectScrollDownButton, {
            global: { stubs: { SelectScrollDownButton: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('items-center')
        expect(wrapper.classes()).toContain('justify-center')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectScrollDownButton, {
            props: { class: 'custom-scroll-down' },
            global: { stubs: { SelectScrollDownButton: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-scroll-down')
    })
})
