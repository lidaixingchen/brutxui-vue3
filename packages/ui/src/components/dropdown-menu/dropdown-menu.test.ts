import { mount } from '@vue/test-utils'
import DropdownMenuContent from './DropdownMenuContent.vue'
import DropdownMenuItem from './DropdownMenuItem.vue'
import DropdownMenuCheckboxItem from './DropdownMenuCheckboxItem.vue'
import DropdownMenuRadioItem from './DropdownMenuRadioItem.vue'
import DropdownMenuLabel from './DropdownMenuLabel.vue'
import DropdownMenuSeparator from './DropdownMenuSeparator.vue'
import DropdownMenuShortcut from './DropdownMenuShortcut.vue'
import DropdownMenuSubTrigger from './DropdownMenuSubTrigger.vue'
import DropdownMenuSubContent from './DropdownMenuSubContent.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

describe('DropdownMenuContent', () => {
    const contentStubs = {
        DropdownMenuPortal: primitiveStub,
        DropdownMenuContent: {
            template: '<div data-testid="dropdown-content"><slot /></div>',
        },
    }

    it('renders with brutal styling classes', () => {
        const wrapper = mount(DropdownMenuContent, {
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="dropdown-content"]')
        expect(content.classes()).toContain('border-3')
        expect(content.classes()).toContain('border-brutal')
        expect(content.classes()).toContain('shadow-brutal')
        expect(content.classes()).toContain('bg-brutal-bg')
        expect(content.classes()).toContain('text-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuContent, {
            props: { class: 'custom-content' },
            global: { stubs: contentStubs },
        })
        const content = wrapper.find('[data-testid="dropdown-content"]')
        expect(content.classes()).toContain('custom-content')
    })
})

describe('DropdownMenuItem', () => {
    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuItem, {
            slots: { default: 'Menu item' },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Menu item')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuItem, {
            props: { class: 'custom-item' },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-item')
    })

    it('applies inset class when inset prop is true', () => {
        const wrapper = mount(DropdownMenuItem, {
            props: { inset: true },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('pl-8')
    })

    it('handles click event', async () => {
        const wrapper = mount(DropdownMenuItem, {
            slots: { default: 'Clickable item' },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        await wrapper.trigger('click')
        expect(wrapper.emitted()).toBeTruthy()
    })
})

describe('DropdownMenuCheckboxItem', () => {
    const checkboxStubs = {
        DropdownMenuCheckboxItem: primitiveStub,
        DropdownMenuItemIndicator: primitiveStub,
    }

    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuCheckboxItem, {
            slots: { default: 'Checkbox item' },
            global: { stubs: checkboxStubs },
        })
        expect(wrapper.text()).toBe('Checkbox item')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuCheckboxItem, {
            props: { class: 'custom-checkbox' },
            global: { stubs: checkboxStubs },
        })
        expect(wrapper.classes()).toContain('custom-checkbox')
    })
})

describe('DropdownMenuRadioItem', () => {
    const radioStubs = {
        DropdownMenuRadioItem: primitiveStub,
        DropdownMenuItemIndicator: primitiveStub,
    }

    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuRadioItem, {
            props: { value: 'option1' },
            slots: { default: 'Radio item' },
            global: { stubs: radioStubs },
        })
        expect(wrapper.text()).toBe('Radio item')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuRadioItem, {
            props: { value: 'option1', class: 'custom-radio' },
            global: { stubs: radioStubs },
        })
        expect(wrapper.classes()).toContain('custom-radio')
    })
})

describe('DropdownMenuLabel', () => {
    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuLabel, {
            slots: { default: 'Label text' },
            global: { stubs: { DropdownMenuLabel: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Label text')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuLabel, {
            props: { class: 'custom-label' },
            global: { stubs: { DropdownMenuLabel: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-label')
    })
})

describe('DropdownMenuSeparator', () => {
    it('renders with separator styling', () => {
        const wrapper = mount(DropdownMenuSeparator, {
            global: { stubs: { DropdownMenuSeparator: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('h-[var(--brutal-border-width,3px)]')
        expect(wrapper.classes()).toContain('bg-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuSeparator, {
            props: { class: 'custom-sep' },
            global: { stubs: { DropdownMenuSeparator: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-sep')
    })
})

describe('DropdownMenuShortcut', () => {
    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuShortcut, {
            slots: { default: '⌘K' },
        })
        expect(wrapper.text()).toBe('⌘K')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuShortcut, {
            props: { class: 'custom-shortcut' },
        })
        expect(wrapper.classes()).toContain('custom-shortcut')
    })
})

describe('DropdownMenuSubTrigger', () => {
    it('renders slot content', () => {
        const wrapper = mount(DropdownMenuSubTrigger, {
            slots: { default: 'Sub menu' },
            global: { stubs: { DropdownMenuSubTrigger: primitiveStub } },
        })
        expect(wrapper.text()).toContain('Sub menu')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuSubTrigger, {
            props: { class: 'custom-sub-trigger' },
            global: { stubs: { DropdownMenuSubTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-sub-trigger')
    })
})

describe('DropdownMenuSubContent', () => {
    it('renders with brutal styling classes', () => {
        const wrapper = mount(DropdownMenuSubContent, {
            global: { stubs: { DropdownMenuSubContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('shadow-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('text-brutal-fg')
    })

    it('applies custom class', () => {
        const wrapper = mount(DropdownMenuSubContent, {
            props: { class: 'custom-sub-content' },
            global: { stubs: { DropdownMenuSubContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-sub-content')
    })

    it('defaults sideOffset to 6px matching the main menu', () => {
        const wrapper = mount(DropdownMenuSubContent, {
            global: { stubs: { DropdownMenuSubContent: primitiveStub } },
        })
        expect(wrapper.props('sideOffset')).toBe(6)
    })
})

// ── 回归修复测试：inset 变体、attrs 透传、indeterminate 图标、disabled、装饰 aria-hidden ──

describe('DropdownMenu regression fixes', () => {
    it('item: user class overrides inset padding via twMerge', () => {
        const wrapper = mount(DropdownMenuItem, {
            props: { inset: true, class: 'pl-4' },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('pl-4')
        expect(wrapper.classes()).not.toContain('pl-8')
    })

    it('item: no inset class when inset is false', () => {
        const wrapper = mount(DropdownMenuItem, {
            props: { inset: false },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.classes()).not.toContain('pl-8')
    })

    it('item: disabled passes through to the primitive', () => {
        const wrapper = mount(DropdownMenuItem, {
            props: { disabled: true },
            global: { stubs: { DropdownMenuItem: primitiveStub } },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('label: applies inset class only when inset is true', () => {
        const wrapper = mount(DropdownMenuLabel, {
            props: { inset: true },
            global: { stubs: { DropdownMenuLabel: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('pl-8')
        const plain = mount(DropdownMenuLabel, {
            global: { stubs: { DropdownMenuLabel: primitiveStub } },
        })
        expect(plain.classes()).not.toContain('pl-8')
    })

    it('checkbox item: indeterminate renders Minus icon, checked renders Check', () => {
        const checkboxStubs = {
            DropdownMenuCheckboxItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        const indeterminate = mount(DropdownMenuCheckboxItem, {
            props: { modelValue: 'indeterminate' },
            global: { stubs: checkboxStubs },
        })
        expect(indeterminate.html()).toContain('lucide-minus')
        expect(indeterminate.html()).not.toContain('lucide-check')

        const checked = mount(DropdownMenuCheckboxItem, {
            props: { modelValue: true },
            global: { stubs: checkboxStubs },
        })
        expect(checked.html()).toContain('lucide-check')
    })

    it('checkbox item: indicator container is aria-hidden (decorative)', () => {
        const checkboxStubs = {
            DropdownMenuCheckboxItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        const wrapper = mount(DropdownMenuCheckboxItem, {
            global: { stubs: checkboxStubs },
        })
        const indicator = wrapper.find('span[aria-hidden="true"]')
        expect(indicator.exists()).toBe(true)
    })

    it('checkbox item: unchecked state renders a persistent empty checkbox frame', () => {
        const checkboxStubs = {
            DropdownMenuCheckboxItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        const wrapper = mount(DropdownMenuCheckboxItem, {
            global: { stubs: checkboxStubs },
        })
        expect(wrapper.html()).toContain('border-2 border-brutal')
        const checked = mount(DropdownMenuCheckboxItem, {
            props: { modelValue: true },
            global: { stubs: checkboxStubs },
        })
        expect(checked.html()).not.toContain('border-2 border-brutal')
    })

    it('checkbox item: defaultChecked seeds the initial unchecked-state value', () => {
        const checkboxStubs = {
            DropdownMenuCheckboxItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        // 非受控模式：defaultChecked=true → 初始渲染选中态图标
        const wrapper = mount(DropdownMenuCheckboxItem, {
            props: { defaultChecked: true },
            global: { stubs: checkboxStubs },
        })
        expect(wrapper.html()).toContain('lucide-check')
        expect(wrapper.html()).not.toContain('border-2 border-brutal')
        // defaultChecked=false → 初始渲染未选中空框
        const unchecked = mount(DropdownMenuCheckboxItem, {
            props: { defaultChecked: false },
            global: { stubs: checkboxStubs },
        })
        expect(unchecked.html()).toContain('border-2 border-brutal')
    })

    it('radio item: passes value to the primitive', () => {
        const radioStubs = {
            DropdownMenuRadioItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        const wrapper = mount(DropdownMenuRadioItem, {
            props: { value: 'option-42' },
            global: { stubs: radioStubs },
        })
        expect(wrapper.props('value')).toBe('option-42')
    })

    it('radio item: indicator container is aria-hidden (decorative)', () => {
        const radioStubs = {
            DropdownMenuRadioItem: primitiveStub,
            DropdownMenuItemIndicator: primitiveStub,
        }
        const wrapper = mount(DropdownMenuRadioItem, {
            props: { value: 'option-1' },
            global: { stubs: radioStubs },
        })
        const indicator = wrapper.find('span[aria-hidden="true"]')
        expect(indicator.exists()).toBe(true)
    })

    it('separator: thickness follows --brutal-border-width token', () => {
        const wrapper = mount(DropdownMenuSeparator, {
            global: { stubs: { DropdownMenuSeparator: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('h-[var(--brutal-border-width,3px)]')
    })

    it('sub trigger: disabled passes through to the primitive', () => {
        const wrapper = mount(DropdownMenuSubTrigger, {
            props: { disabled: true },
            global: { stubs: { DropdownMenuSubTrigger: primitiveStub } },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('sub trigger: inset class applied via variants', () => {
        const wrapper = mount(DropdownMenuSubTrigger, {
            props: { inset: true },
            global: { stubs: { DropdownMenuSubTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('pl-8')
    })

    it('content: forwards extra attrs to the content primitive', () => {
        const wrapper = mount(DropdownMenuContent, {
            props: { 'data-test-id': 'dd-content' },
            global: { stubs: { DropdownMenuContent: primitiveStub, DropdownMenuPortal: { template: '<div><slot /></div>' } } },
        })
        expect(wrapper.html()).toContain('data-test-id="dd-content"')
    })
})
