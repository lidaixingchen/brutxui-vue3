import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TreeSelect from './TreeSelect.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import type { TreeNode } from './tree-select-types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }

const nodes: TreeNode[] = [
    {
        id: '1',
        label: 'Root 1',
        children: [
            { id: '1-1', label: 'Child 1-1' },
            { id: '1-2', label: 'Child 1-2' },
        ],
    },
    {
        id: '2',
        label: 'Root 2',
        children: [
            {
                id: '2-1',
                label: 'Child 2-1',
                children: [
                    { id: '2-1-1', label: 'Grandchild 2-1-1' },
                ],
            },
        ],
    },
    { id: '3', label: 'Leaf Node' },
]

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    if (wrapper) {
        wrapper.unmount()
        wrapper = null
    }
    document.body.textContent = ''
})

async function openTreeSelect(w: ReturnType<typeof mount>) {
    const trigger = w.find('[role="combobox"]')
    await trigger.trigger('click')
    await nextTick()
    await nextTick()
}

describe('TreeSelect', () => {
    it('renders with nodes prop', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.exists()).toBe(true)
    })

    it('applies custom class', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, class: 'custom-tree-select' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('custom-tree-select')
    })

    it('shows placeholder text', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, placeholder: 'Pick a node...' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Pick a node...')
    })

    it('shows default placeholder text', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Select node...')
    })

    it('shows selected node label in single mode', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, modelValue: '1-1' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('Child 1-1')
    })

    it('is disabled when disabled prop is true', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, disabled: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-disabled')).toBe('true')
        expect(trigger.attributes('tabindex')).toBe('-1')
    })

    it('has aria-expanded attribute', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.attributes('aria-expanded')).toBeDefined()
    })

    it('applies muted foreground class when no value selected', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).toContain('text-brutal-muted-foreground')
    })

    it('does not apply muted foreground class when value is selected', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, modelValue: '1-1' },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.classes()).not.toContain('text-brutal-muted-foreground')
    })

    it('supports clearable in single mode', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, modelValue: '1-1', clearable: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(wrapper.find('[role="button"][aria-label="Clear"]').exists()).toBe(false)

        await trigger.trigger('mouseenter')
        await nextTick()

        const clearButton = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearButton.exists()).toBe(true)
        await clearButton.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([undefined])
    })

    it('shows selected count in multiple mode when exceeding maxDisplay', () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, multiple: true, modelValue: ['1-1', '1-2', '3'], maxDisplay: 2 },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(trigger.text()).toContain('3 selected')
    })

    it('supports clearable in multiple mode', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, multiple: true, modelValue: ['1-1', '1-2'], clearable: true },
            attachTo: document.body,
        })
        const trigger = wrapper.find('[role="combobox"]')
        expect(wrapper.find('[role="button"][aria-label="Clear"]').exists()).toBe(false)

        await trigger.trigger('mouseenter')
        await nextTick()

        const clearButton = wrapper.find('[role="button"][aria-label="Clear"]')
        expect(clearButton.exists()).toBe(true)
        await clearButton.trigger('click')
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual([[]])
    })

    it('opens dropdown when clicked', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes },
            attachTo: document.body,
        })
        await openTreeSelect(wrapper)
        const tree = document.body.querySelector('[role="tree"]')
        expect(tree).toBeTruthy()
    })

    it('shows search input when searchable is true', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, searchable: true },
            attachTo: document.body,
        })
        await openTreeSelect(wrapper)
        const input = document.body.querySelector('input[type="text"]')
        expect(input).toBeTruthy()
    })

    it('filters nodes by search query', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, searchable: true },
            attachTo: document.body,
        })
        await openTreeSelect(wrapper)
        const input = document.body.querySelector('input[type="text"]') as HTMLInputElement
        expect(input).toBeTruthy()
        input.value = 'Leaf'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
        expect(document.body.textContent).toContain('Leaf Node')
    })

    it('shows empty text when no nodes match search', async () => {
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes, searchable: true, emptyText: 'Nothing found!' },
            attachTo: document.body,
        })
        await openTreeSelect(wrapper)
        const input = document.body.querySelector('input[type="text"]') as HTMLInputElement
        input.value = 'xyz'
        input.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
        expect(document.body.textContent).toContain('Nothing found!')
    })

    it('does not select disabled nodes', async () => {
        const nodesWithDisabled: TreeNode[] = [
            { id: '1', label: 'Enabled', disabled: false },
            { id: '2', label: 'Disabled', disabled: true },
        ]
        wrapper = mount(TreeSelect, {
            ...localeProvide,
            props: { nodes: nodesWithDisabled },
            attachTo: document.body,
        })
        await openTreeSelect(wrapper)
        const items = document.body.querySelectorAll('[role="treeitem"]')
        const disabledItem = items[1] as HTMLElement
        disabledItem.click()
        await nextTick()
        expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
})
