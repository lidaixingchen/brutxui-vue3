import { mount } from '@vue/test-utils'
import Tabs from './Tabs.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'
import TabsContent from './TabsContent.vue'

const primitiveStub = {
    template: '<div><slot /></div>',
}

const tabsRootStub = {
    name: 'TabsRoot',
    props: {
        modelValue: { default: undefined },
        orientation: { default: undefined },
    },
    template: '<div><slot /></div>',
}

const mockTabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Features', value: 'features' },
    { label: 'Pricing', value: 'pricing' },
]

const tabsGlobalStubs = {
    TabsRoot: tabsRootStub,
    TabsList: primitiveStub,
    TabsTrigger: primitiveStub,
    TabsContent: primitiveStub,
}

describe('TabsList', () => {
    it('renders with brutal styling classes', () => {
        const wrapper = mount(TabsList, {
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-brutal')
        expect(wrapper.classes()).toContain('bg-brutal-bg')
        expect(wrapper.classes()).toContain('inline-flex')
    })

    it('applies custom class', () => {
        const wrapper = mount(TabsList, {
            props: { class: 'custom-list' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-list')
    })
})

describe('TabsTrigger', () => {
    it('renders with variant classes', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('font-bold')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-transparent')
    })

    it('applies custom class', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', class: 'custom-trigger' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-trigger')
    })
})

describe('TabsContent', () => {
    it('renders slot content', () => {
        const wrapper = mount(TabsContent, {
            props: { value: 'tab1' },
            slots: { default: 'Content text' },
            global: { stubs: { TabsContent: primitiveStub } },
        })
        expect(wrapper.text()).toBe('Content text')
    })

    it('applies custom class', () => {
        const wrapper = mount(TabsContent, {
            props: { value: 'tab1', class: 'custom-content' },
            global: { stubs: { TabsContent: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('custom-content')
    })

    it('applies default styling classes', () => {
        const wrapper = mount(TabsContent, {
            props: { value: 'tab1' },
            global: { stubs: { TabsContent: primitiveStub } },
        })
        const classes = wrapper.classes().join(' ')
        expect(classes).toContain('focus-visible:outline-none')
    })
})

describe('TabsList', () => {
    it('applies size variant classes', () => {
        const wrapper = mount(TabsList, {
            props: { size: 'sm' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('h-9')
    })

    it('defaults to horizontal orientation', () => {
        const wrapper = mount(TabsList, {
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapper.classes()).not.toContain('flex-col')
    })

    it('applies flex-col when orientation is vertical', () => {
        const wrapper = mount(TabsList, {
            props: { orientation: 'vertical' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('flex-col')
    })
})

describe('TabsTrigger', () => {
    it('handles disabled state', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', disabled: true },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('supports variant prop', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', variant: 'primary' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-primary')
    })
})

describe('Tabs (tabs prop array mode)', () => {
    it('renders tab triggers from tabs array', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.text()).toContain('Overview')
        expect(wrapper.text()).toContain('Features')
        expect(wrapper.text()).toContain('Pricing')
    })

    it('renders default Card content for each tab when no default slot', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.findAllComponents(TabsContent)).toHaveLength(mockTabs.length)
    })

    it('renders EmptyState when tabs is empty array', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: [] },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.text()).toContain('暂无标签页')
    })

    it('renders header and footer slots in tabs mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            slots: {
                header: '<div class="custom-header">Header</div>',
                footer: '<div class="custom-footer">Footer</div>',
            },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.find('.custom-header').exists()).toBe(true)
        expect(wrapper.find('.custom-footer').exists()).toBe(true)
    })

    it('replaces default content with default slot in tabs mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            slots: { default: '<div class="custom-content">Custom</div>' },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.find('.custom-content').exists()).toBe(true)
    })

    it('applies custom class to wrapper in tabs mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs, class: 'my-tabs' },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.classes()).toContain('my-tabs')
    })

    it('falls back to first tab value when modelValue is undefined', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('modelValue')).toBe('overview')
    })

    it('uses modelValue prop when provided in tabs mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs, modelValue: 'features' },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('modelValue')).toBe('features')
    })

    it('emits update:modelValue when TabsRoot changes in tabs mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        root.vm.$emit('update:modelValue', 'features')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['features'])
    })
})

describe('Tabs (slot mode, no tabs prop)', () => {
    it('renders default slot inside TabsRoot when tabs is not provided', () => {
        const wrapper = mount(Tabs, {
            slots: { default: '<div class="slot-content">Slot</div>' },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.find('.slot-content').exists()).toBe(true)
    })

    it('passes modelValue directly to TabsRoot in slot mode', () => {
        const wrapper = mount(Tabs, {
            props: { modelValue: 'tab1' },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('modelValue')).toBe('tab1')
    })

    it('passes orientation to TabsRoot in slot mode', () => {
        const wrapper = mount(Tabs, {
            props: { orientation: 'vertical' },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('orientation')).toBe('vertical')
    })
})
