import { mount } from '@vue/test-utils'
import Select from './Select.vue'
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
        const trigger = wrapper.find('[role="combobox"], [aria-haspopup="listbox"]')
        expect(trigger.classes()).toContain('border-3')
        expect(trigger.classes()).toContain('border-brutal')
        expect(trigger.classes()).toContain('shadow-brutal')
        expect(trigger.classes()).toContain('bg-brutal-bg')
        expect(trigger.classes()).toContain('text-brutal-fg')
        expect(trigger.classes()).toContain('font-bold')
    })

    it('applies custom class', () => {
        const wrapper = mount(SelectTrigger, {
            props: { class: 'custom-trigger' },
            global: { stubs: { SelectTrigger: primitiveStub, SelectIcon: primitiveStub } },
        })
        const trigger = wrapper.find('[role="combobox"], [aria-haspopup="listbox"]')
        expect(trigger.classes()).toContain('custom-trigger')
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

describe('Select.vue', () => {
    const defaultOptions = [
        { label: 'Option 1', value: 'opt1' },
        { label: 'Option 2', value: 'opt2', disabled: true },
        { label: 'Option 3', value: 'opt3' },
    ]

    const groupOptions = [
        { label: 'Apple', value: 'apple', category: 'fruits', categoryName: 'Fresh Fruits' },
        { label: 'Banana', value: 'banana', category: 'fruits', categoryName: 'Fresh Fruits' },
        { label: 'Carrot', value: 'carrot', category: 'vegetables', categoryName: 'Organic Veggies' },
        { label: 'Potato', value: 'potato', category: 'vegetables', categoryName: 'Organic Veggies' },
        { label: 'Milk', value: 'milk' },
    ]

    const selectStubs = {
        SelectRoot: {
            template: '<div data-testid="select-root"><slot /></div>',
        },
        SelectTrigger: {
            template: '<button data-testid="select-trigger"><slot /></button>',
        },
        SelectValue: {
            props: ['placeholder'],
            template: '<span data-testid="select-value">{{ placeholder }}</span>',
        },
        SelectContent: {
            template: '<div data-testid="select-content"><slot /></div>',
        },
        SelectGroup: {
            template: '<div data-testid="select-group"><slot /></div>',
        },
        SelectLabel: {
            template: '<span data-testid="select-label"><slot /></span>',
        },
        SelectItem: {
            props: ['value', 'disabled'],
            template: '<div data-testid="select-item" :data-value="value" :data-disabled="disabled"><slot /></div>',
        },
    }

    it('renders with placeholder and options', () => {
        const wrapper = mount(Select, {
            props: {
                options: defaultOptions,
                placeholder: 'Select food',
            },
            global: { stubs: selectStubs },
        })

        expect(wrapper.find('[data-testid="select-value"]').text()).toBe('Select food')
        
        const items = wrapper.findAll('[data-testid="select-item"]')
        expect(items.length).toBe(3)
        expect(items[0].text()).toBe('Option 1')
        expect(items[0].attributes('data-value')).toBe('opt1')
        expect(items[1].attributes('data-disabled')).toBe('true')
    })

    it('handles grouping with groupField', () => {
        const wrapper = mount(Select, {
            props: {
                options: groupOptions,
                groupField: 'category',
            },
            global: { stubs: selectStubs },
        })

        const groups = wrapper.findAll('[data-testid="select-group"]')
        expect(groups.length).toBe(3)

        const labels = wrapper.findAll('[data-testid="select-label"]')
        expect(labels.length).toBe(2)
        expect(labels[0].text()).toBe('fruits')
        expect(labels[1].text()).toBe('vegetables')

        const fruitsItems = groups[0].findAll('[data-testid="select-item"]')
        expect(fruitsItems.length).toBe(2)
        expect(fruitsItems[0].text()).toBe('Apple')
        expect(fruitsItems[1].text()).toBe('Banana')

        const ungroupedItems = groups[2].findAll('[data-testid="select-item"]')
        expect(ungroupedItems.length).toBe(1)
        expect(ungroupedItems[0].text()).toBe('Milk')
    })

    it('uses groupLabel for group header when provided', () => {
        const wrapper = mount(Select, {
            props: {
                options: groupOptions,
                groupField: 'category',
                groupLabel: 'categoryName',
            },
            global: { stubs: selectStubs },
        })

        const labels = wrapper.findAll('[data-testid="select-label"]')
        expect(labels.length).toBe(2)
        expect(labels[0].text()).toBe('Fresh Fruits')
        expect(labels[1].text()).toBe('Organic Veggies')
    })

    it('binds and updates v-model correctly', async () => {
        const wrapper = mount(Select, {
            props: {
                options: defaultOptions,
                modelValue: 'opt1',
                'onUpdate:modelValue': (e: any) => wrapper.setProps({ modelValue: e }),
            },
            global: { stubs: selectStubs },
        })

        expect(wrapper.vm.modelValue).toBe('opt1')
    })
})
