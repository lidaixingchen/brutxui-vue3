import { mount } from '@vue/test-utils'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import TreeView from './TreeView.vue'
import TreeViewNode from './TreeViewNode.vue'
import type { TreeNode } from './TreeView.vue'

const localeProvide = { [LOCALE_INJECTION_KEY]: en }

const sampleNodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'main.ts', label: 'main.ts' },
            { id: 'utils.ts', label: 'utils.ts' },
        ],
    },
    {
        id: 'package.json',
        label: 'package.json',
    },
]

const emptyExpandedIds: Set<string> = new Set()

describe('TreeView', () => {
    it('renders with role="tree"', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        expect(wrapper.attributes('role')).toBe('tree')
    })

    it('renders nodes', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="treeitem"]')
        expect(items.length).toBeGreaterThanOrEqual(2)
        expect(wrapper.text()).toContain('src')
        expect(wrapper.text()).toContain('package.json')
    })

    it('applies custom class', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: [], class: 'custom-tree' },
            global: { provide: localeProvide },
        })
        expect(wrapper.classes()).toContain('custom-tree')
        expect(wrapper.classes()).toContain('flex')
        expect(wrapper.classes()).toContain('flex-col')
    })

    it('emits select event', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        await treeItems[treeItems.length - 1].find('div').trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0][0]).toEqual(
            expect.objectContaining({ id: 'package.json' })
        )
    })

    it('has aria-label="File tree"', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        expect(wrapper.attributes('aria-label')).toBe('File tree')
    })
})

describe('TreeViewNode', () => {
    it('renders label', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.text()).toContain('file.ts')
    })

    it('shows folder icon for non-leaf node', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'main.ts', label: 'main.ts' }] },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.attributes('aria-expanded')).toBe('false')
        const chevron = wrapper.find('.rotate-90')
        expect(chevron.exists()).toBe(false)
    })

    it('shows file icon for leaf node', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'readme.md', label: 'readme.md' },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.attributes('aria-selected')).toBe('false')
        expect(wrapper.attributes('aria-expanded')).toBeUndefined()
    })

    it('applies selected class when selected', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectedId: 'file.ts',
            },
        })
        const inner = wrapper.find('[role="treeitem"] > div')
        expect(inner.classes()).toContain('bg-brutal-primary')
        expect(inner.classes()).toContain('border-brutal')
        expect(inner.classes()).toContain('shadow-brutal')
    })

    it('does not apply selected class when not selected', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectedId: 'other.ts',
            },
        })
        const inner = wrapper.find('[role="treeitem"] > div')
        expect(inner.classes()).not.toContain('bg-brutal-primary')
    })

    it('has role="treeitem"', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.attributes('role')).toBe('treeitem')
    })
})

describe('TreeView checkbox mode', () => {
    it('renders Checkbox components in checkbox mode', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('does not render Checkbox in single mode', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'single',
                defaultExpanded: ['src'],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        expect(checkboxes.length).toBe(0)
    })

    it('emits update:checkedIds with all descendant ids when checking a parent', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        const srcCheckbox = checkboxes[0]
        await srcCheckbox.vm.$emit('update:checked', true)

        const emitted = wrapper.emitted('update:checkedIds')
        expect(emitted).toBeTruthy()
        const newIds = emitted![0][0] as string[]
        expect(newIds).toEqual(expect.arrayContaining(['src', 'main.ts', 'utils.ts']))
        expect(newIds.length).toBe(3)
    })

    it('emits update:checkedIds removing all descendant ids when unchecking', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: ['src', 'main.ts', 'utils.ts'],
            },
            global: {
                provide: localeProvide,
            },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        const srcCheckbox = checkboxes[0]
        await srcCheckbox.vm.$emit('update:checked', false)

        const emitted = wrapper.emitted('update:checkedIds')
        expect(emitted).toBeTruthy()
        const newIds = emitted![0][0] as string[]
        expect(newIds).toEqual([])
    })

    it('emits check event with checked flag', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        await checkboxes[0].vm.$emit('update:checked', true)

        const checkEvents = wrapper.emitted('check')
        expect(checkEvents).toBeTruthy()
        const [node, checked] = checkEvents![0] as [TreeNode, boolean]
        expect(node.id).toBe('src')
        expect(checked).toBe(true)
    })

    it('shows indeterminate state when partial descendants are checked', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: ['main.ts'],
            },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        const srcItem = treeItems[0]
        expect(srcItem.attributes('aria-checked')).toBe('mixed')
    })

    it('shows checked state when all descendants are checked', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: ['src', 'main.ts', 'utils.ts'],
            },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        const srcItem = treeItems[0]
        expect(srcItem.attributes('aria-checked')).toBe('true')
    })

    it('shows unchecked state when no descendants are checked', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        const srcItem = treeItems[0]
        expect(srcItem.attributes('aria-checked')).toBe('false')
    })

    it('does not set aria-checked in single mode', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'single',
                defaultExpanded: ['src'],
            },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        expect(treeItems[0].attributes('aria-checked')).toBeUndefined()
    })

    it('does not toggle when node is disabled', async () => {
        const disabledNodes: TreeNode[] = [
            {
                id: 'src',
                label: 'src',
                disabled: true,
                children: [{ id: 'main.ts', label: 'main.ts' }],
            },
        ]
        const wrapper = mount(TreeView, {
            props: {
                nodes: disabledNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        await checkboxes[0].vm.$emit('update:checked', true)

        expect(wrapper.emitted('update:checkedIds')).toBeFalsy()
        expect(wrapper.emitted('check')).toBeFalsy()
    })

    it('reflects externally updated checkedIds', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const treeItems = wrapper.findAll('[role="treeitem"]')
        expect(treeItems[0].attributes('aria-checked')).toBe('false')

        await wrapper.setProps({ checkedIds: ['src', 'main.ts', 'utils.ts'] })
        const updatedItems = wrapper.findAll('[role="treeitem"]')
        expect(updatedItems[0].attributes('aria-checked')).toBe('true')
    })

    it('toggles only target subtree when checking a leaf', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: [],
            },
            global: { provide: localeProvide },
        })
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        const mainTsCheckbox = checkboxes[1]
        await mainTsCheckbox.vm.$emit('update:checked', true)

        const emitted = wrapper.emitted('update:checkedIds')
        expect(emitted).toBeTruthy()
        const newIds = emitted![0][0] as string[]
        expect(newIds).toEqual(['main.ts'])
    })
})

describe('TreeViewNode checkbox mode', () => {
    it('computes checked state from checkedIds', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(['file.ts']),
            },
        })
        expect(wrapper.attributes('aria-checked')).toBe('true')
    })

    it('computes indeterminate state from partial descendant coverage', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: {
                    id: 'src',
                    label: 'src',
                    children: [{ id: 'a.ts', label: 'a.ts' }, { id: 'b.ts', label: 'b.ts' }],
                },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(['a.ts']),
            },
        })
        expect(wrapper.attributes('aria-checked')).toBe('mixed')
    })

    it('renders Checkbox only in checkbox mode', () => {
        const singleWrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
                checkedIds: new Set<string>(),
            },
        })
        expect(singleWrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(false)

        const checkboxWrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
            },
        })
        expect(checkboxWrapper.findComponent({ name: 'Checkbox' }).exists()).toBe(true)
    })

    it('emits check on Space key in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
            },
        })
        await wrapper.trigger('keydown', { key: ' ' })
        const checkEvents = wrapper.emitted('check')
        expect(checkEvents).toBeTruthy()
    })

    it('does not emit select when clicking the checkbox in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
            },
        })
        const checkbox = wrapper.findComponent({ name: 'Checkbox' })
        await checkbox.trigger('click')
        expect(wrapper.emitted('select')).toBeFalsy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('still emits select when clicking row label in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
            },
        })
        const rowLabel = wrapper.find('.truncate')
        await rowLabel.trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('sets aria-disabled when disabled prop is true', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                disabled: true,
            },
        })
        expect(wrapper.attributes('aria-disabled')).toBe('true')
    })
})
