import { mount } from '@vue/test-utils'
import { computed, nextTick, ref } from 'vue'
import Tabs from './Tabs.vue'
import TabsList from './TabsList.vue'
import TabsTrigger from './TabsTrigger.vue'
import TabsContent from './TabsContent.vue'
import { TABS_ORIENTATION_KEY, type TabItem } from './types'

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

const mockTabs: TabItem[] = [
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

    it('applies horizontal size variant classes', () => {
        const wrapperSm = mount(TabsList, {
            props: { size: 'sm', orientation: 'horizontal' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperSm.classes()).toContain('h-9')

        const wrapperDefault = mount(TabsList, {
            props: { size: 'default', orientation: 'horizontal' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperDefault.classes()).toContain('h-11')

        const wrapperLg = mount(TabsList, {
            props: { size: 'lg', orientation: 'horizontal' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperLg.classes()).toContain('h-14')
    })

    it('applies vertical size variant classes', () => {
        const wrapperSm = mount(TabsList, {
            props: { size: 'sm', orientation: 'vertical' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperSm.classes()).toContain('flex-col')
        expect(wrapperSm.classes()).toContain('min-w-28')

        const wrapperDefault = mount(TabsList, {
            props: { size: 'default', orientation: 'vertical' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperDefault.classes()).toContain('flex-col')
        expect(wrapperDefault.classes()).toContain('min-w-36')

        const wrapperLg = mount(TabsList, {
            props: { size: 'lg', orientation: 'vertical' },
            global: { stubs: { TabsList: primitiveStub } },
        })
        expect(wrapperLg.classes()).toContain('flex-col')
        expect(wrapperLg.classes()).toContain('min-w-44')
    })

    it('inherits orientation from TABS_ORIENTATION_KEY injection', () => {
        const wrapper = mount(TabsList, {
            global: {
                provide: {
                    [TABS_ORIENTATION_KEY as unknown as string]: computed(() => 'vertical'),
                },
                stubs: { TabsList: primitiveStub },
            },
        })
        expect(wrapper.classes()).toContain('flex-col')
        expect(wrapper.attributes('data-orientation')).toBe('vertical')
    })

    it('prefers props orientation over injection', () => {
        const wrapper = mount(TabsList, {
            props: { orientation: 'horizontal' },
            global: {
                provide: {
                    [TABS_ORIENTATION_KEY as unknown as string]: computed(() => 'vertical'),
                },
                stubs: { TabsList: primitiveStub },
            },
        })
        expect(wrapper.classes()).not.toContain('flex-col')
        expect(wrapper.attributes('data-orientation')).toBe('horizontal')
    })
})

describe('TabsTrigger', () => {
    it('renders with default variant classes', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('font-bold')
        expect(wrapper.classes()).toContain('border-3')
        expect(wrapper.classes()).toContain('border-transparent')
        expect(wrapper.classes()).toContain('h-full')
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-primary')
    })

    it('supports primary variant', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', variant: 'primary' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-primary')
    })

    it('supports secondary variant', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', variant: 'secondary' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-secondary')
    })

    it('supports accent variant', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', variant: 'accent' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-accent')
    })

    it('supports success variant', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', variant: 'success' },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.classes()).toContain('data-[state=active]:bg-brutal-success')
    })

    it('handles disabled prop', () => {
        const wrapper = mount(TabsTrigger, {
            props: { value: 'tab1', disabled: true },
            global: { stubs: { TabsTrigger: primitiveStub } },
        })
        expect(wrapper.attributes('disabled')).toBeDefined()
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
        expect(classes).toContain('focus-visible:ring-2')
        expect(classes).toContain('border-3')
        expect(classes).toContain('border-brutal')
    })

    it('passes forceMount prop to primitive', () => {
        const customPrimitive = {
            props: ['value', 'forceMount'],
            template: '<div :data-force="forceMount"><slot /></div>',
        }
        const wrapper = mount(TabsContent, {
            props: { value: 'tab1', forceMount: true },
            global: { stubs: { TabsContent: customPrimitive } },
        })
        expect(wrapper.attributes('data-force')).toBe('true')
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

    it('passes disabled flag from TabItem to TabsTrigger', () => {
        const tabsWithDisabled: TabItem[] = [
            { label: 'Active', value: 'active' },
            { label: 'Disabled', value: 'disabled', disabled: true },
        ]
        const triggerStub = {
            props: ['value', 'disabled'],
            template: '<button :disabled="disabled"><slot /></button>',
        }
        const wrapper = mount(Tabs, {
            props: { tabs: tabsWithDisabled },
            global: {
                stubs: {
                    ...tabsGlobalStubs,
                    TabsTrigger: triggerStub,
                },
            },
        })
        const buttons = wrapper.findAll('button')
        expect(buttons[0].attributes('disabled')).toBeUndefined()
        expect(buttons[1].attributes('disabled')).toBeDefined()
    })

    it('renders default Card content for each tab when no default slot', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.findAllComponents(TabsContent)).toHaveLength(mockTabs.length)
    })

    it('renders Result when tabs is empty array', () => {
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

    it('does not mutate uncontrolled state when modelValue is controlled', async () => {
        const controlledVal = ref('overview')
        const wrapper = mount(Tabs, {
            props: {
                tabs: mockTabs,
                modelValue: controlledVal.value,
                'onUpdate:modelValue': (val: string) => {
                    controlledVal.value = val
                },
            },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        root.vm.$emit('update:modelValue', 'features')
        await nextTick()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['features'])
    })

    it('falls back to first tab and syncs internalValue when active tab is removed', async () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs },
            global: { stubs: tabsGlobalStubs },
        })
        const root = () => wrapper.findComponent({ name: 'TabsRoot' })

        // 非受控模式：先选中第二个 tab
        root().vm.$emit('update:modelValue', 'features')
        await nextTick()
        expect(root().props('modelValue')).toBe('features')

        // 删除当前选中 tab：activeValue 应回退到首项
        const withoutFeatures = mockTabs.filter(tab => tab.value !== 'features')
        await wrapper.setProps({ tabs: withoutFeatures })
        expect(root().props('modelValue')).toBe('overview')

        // 重新加入被删除的 tab：activeValue 应保持首项，internalValue 已同步，不再自动跳回旧选中项
        await wrapper.setProps({ tabs: mockTabs })
        expect(root().props('modelValue')).toBe('overview')
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

    it('supports defaultValue in slot mode', () => {
        const wrapper = mount(Tabs, {
            props: { defaultValue: 'tab-default' },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('modelValue')).toBe('tab-default')
    })

    it('supports defaultValue in config mode', () => {
        const wrapper = mount(Tabs, {
            props: { tabs: mockTabs, defaultValue: 'pricing' },
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.props('modelValue')).toBe('pricing')
    })

    it('updates activeValue in uncontrolled slot mode when TabsRoot changes', async () => {
        const wrapper = mount(Tabs, {
            global: { stubs: tabsGlobalStubs },
        })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        root.vm.$emit('update:modelValue', 'tab2')
        await nextTick()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['tab2'])
        expect(root.props('modelValue')).toBe('tab2')
    })

    it('handles async tabs data loading correctly in config mode', async () => {
        const wrapper = mount(Tabs, {
            props: { tabs: [] },
            global: { stubs: tabsGlobalStubs },
        })
        expect(wrapper.find('.text-brutal-muted-foreground').exists()).toBe(false)

        // 异步数据返回
        await wrapper.setProps({ tabs: mockTabs })
        const root = wrapper.findComponent({ name: 'TabsRoot' })
        expect(root.exists()).toBe(true)
        expect(root.props('modelValue')).toBe('overview')
    })
})
