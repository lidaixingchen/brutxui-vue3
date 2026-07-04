import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import TreeView from './TreeView.vue'
import TreeViewNode from './TreeViewNode.vue'
import { getAllDescendantIds, getCheckState, moveNode } from './tree-view-utils'
import type { TreeNode } from './types'

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

const deepNodes: TreeNode[] = [
    {
        id: 'root',
        label: 'root',
        children: [
            {
                id: 'level1',
                label: 'level1',
                children: [
                    { id: 'level2', label: 'level2' },
                ],
            },
        ],
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

    it('emits select event and update:modelValue', async () => {
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
        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0][0]).toBe('package.json')
    })

    it('has aria-label="File tree"', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        expect(wrapper.attributes('aria-label')).toBe('File tree')
    })

    it('emits expand and update:expanded when clicking a branch node', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes },
            global: { provide: localeProvide },
        })
        const srcNode = wrapper.findAll('[role="treeitem"]')[0]
        await srcNode.find('div').trigger('click')

        expect(wrapper.emitted('expand')).toBeTruthy()
        expect(wrapper.emitted('expand')![0]).toEqual(['src', true])
        expect(wrapper.emitted('update:expanded')).toBeTruthy()
        expect(wrapper.emitted('update:expanded')![0][0]).toEqual(['src'])
    })

    it('collapses an expanded node when clicked again', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes, defaultExpanded: ['src'] },
            global: { provide: localeProvide },
        })
        const srcNode = wrapper.findAll('[role="treeitem"]')[0]
        await srcNode.find('div').trigger('click')

        const expandEvents = wrapper.emitted('expand')!
        expect(expandEvents[0]).toEqual(['src', false])
        expect(wrapper.emitted('update:expanded')![0][0]).toEqual([])
    })

    it('expands nodes with defaultExpanded prop', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes, defaultExpanded: ['src'] },
            global: { provide: localeProvide },
        })
        // When src is expanded, children should be visible
        const items = wrapper.findAll('[role="treeitem"]')
        expect(items.length).toBe(4) // src + main.ts + utils.ts + package.json
    })

    it('watches defaultExpanded changes', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes, defaultExpanded: [] },
            global: { provide: localeProvide },
        })
        expect(wrapper.findAll('[role="treeitem"]').length).toBe(2)

        await wrapper.setProps({ defaultExpanded: ['src'] } as Record<string, unknown>)
        await nextTick()
        expect(wrapper.findAll('[role="treeitem"]').length).toBe(4)
    })

    it('renders empty tree', () => {
        const wrapper = mount(TreeView, {
            props: { nodes: [] },
            global: { provide: localeProvide },
        })
        expect(wrapper.findAll('[role="treeitem"]').length).toBe(0)
        expect(wrapper.attributes('role')).toBe('tree')
    })
})

describe('TreeView - Keyboard Navigation', () => {
    function createTreeWithFocus() {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                defaultExpanded: ['src'],
            },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        return wrapper
    }

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('focuses first item via Home key', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        // Focus the last item first
        await items[items.length - 1].trigger('keydown', { key: 'Home' })

        // The first item should receive focus
        const firstItem = items[0].element as HTMLElement
        expect(document.activeElement).toBe(firstItem)
    })

    it('focuses last item via End key', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        // Focus the first item first
        ;(items[0].element as HTMLElement).focus()
        await items[0].trigger('keydown', { key: 'End' })

        const lastItem = items[items.length - 1].element as HTMLElement
        expect(document.activeElement).toBe(lastItem)
    })

    it('focuses next item via ArrowDown', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        ;(items[0].element as HTMLElement).focus()
        await items[0].trigger('keydown', { key: 'ArrowDown' })

        const secondItem = items[1].element as HTMLElement
        expect(document.activeElement).toBe(secondItem)
    })

    it('focuses previous item via ArrowUp', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        ;(items[1].element as HTMLElement).focus()
        await items[1].trigger('keydown', { key: 'ArrowUp' })

        const firstItem = items[0].element as HTMLElement
        expect(document.activeElement).toBe(firstItem)
    })

    it('focuses parent via ArrowLeft on a leaf node', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        // Focus on main.ts (child of src)
        ;(items[1].element as HTMLElement).focus()
        await items[1].trigger('keydown', { key: 'ArrowLeft' })

        // Should focus parent (src)
        const parentNode = items[0].element as HTMLElement
        expect(document.activeElement).toBe(parentNode)
    })

    it('collapses expanded node via ArrowLeft', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        // src is expanded, focus on src
        ;(items[0].element as HTMLElement).focus()
        await items[0].trigger('keydown', { key: 'ArrowLeft' })

        expect(wrapper.emitted('expand')).toBeTruthy()
        expect(wrapper.emitted('expand')![0]).toEqual(['src', false])
    })

    it('expands collapsed node via ArrowRight', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: sampleNodes, defaultExpanded: [] },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        const items = wrapper.findAll('[role="treeitem"]')
        ;(items[0].element as HTMLElement).focus()
        await items[0].trigger('keydown', { key: 'ArrowRight' })

        expect(wrapper.emitted('expand')).toBeTruthy()
        expect(wrapper.emitted('expand')![0]).toEqual(['src', true])
    })

    it('focuses first child via ArrowRight on expanded node', async () => {
        const wrapper = createTreeWithFocus()
        const items = wrapper.findAll('[role="treeitem"]')
        // src is expanded, focus on src
        ;(items[0].element as HTMLElement).focus()
        await items[0].trigger('keydown', { key: 'ArrowRight' })

        // Should focus first child (main.ts)
        const firstChild = items[1].element as HTMLElement
        expect(document.activeElement).toBe(firstChild)
    })

    it('does not navigate when no items exist', async () => {
        const wrapper = mount(TreeView, {
            props: { nodes: [] },
            global: { provide: localeProvide },
            attachTo: document.body,
        })
        // Should not throw when calling keyboard handlers on empty tree
        const tree = wrapper.find('[role="tree"]')
        expect(tree.exists()).toBe(true)
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

    it('sets aria-expanded when expanded', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: new Set(['src']),
            },
        })
        expect(wrapper.attributes('aria-expanded')).toBe('true')
    })

    it('rotates chevron when expanded', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: new Set(['src']),
            },
        })
        const chevron = wrapper.find('.rotate-90')
        expect(chevron.exists()).toBe(true)
    })

    it('sets aria-controls when not a leaf', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.attributes('aria-controls')).toBeDefined()
    })

    it('does not set aria-controls for leaf node', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
        })
        expect(wrapper.attributes('aria-controls')).toBeUndefined()
    })

    it('sets tabindex=0 when isFirstRoot and no selection', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                isFirstRoot: true,
            },
        })
        expect(wrapper.attributes('tabindex')).toBe('0')
    })

    it('sets tabindex=-1 when not selected and not first root', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                isFirstRoot: false,
            },
        })
        expect(wrapper.attributes('tabindex')).toBe('-1')
    })

    it('applies depth-based indent style', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                depth: 2,
            },
        })
        const inner = wrapper.find('[role="treeitem"] > div')
        expect((inner.element as HTMLElement).style.paddingLeft).toBe('44px')
    })

    it('applies base indent when depth=0', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                depth: 0,
            },
        })
        const inner = wrapper.find('[role="treeitem"] > div')
        expect((inner.element as HTMLElement).style.paddingLeft).toBe('4px')
    })

    it('renders children when expanded', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }, { id: 'b.ts', label: 'b.ts' }] },
                expandedIds: new Set(['src']),
            },
        })
        const group = wrapper.find('[role="group"]')
        expect(group.exists()).toBe(true)
        const children = group.findAll('[role="treeitem"]')
        expect(children.length).toBe(2)
    })

    it('does not render children when collapsed', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
            },
        })
        const group = wrapper.find('[role="group"]')
        expect(group.exists()).toBe(false)
    })

    it('emits toggle when clicking a branch node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
            },
        })
        await wrapper.find('[role="treeitem"] > div').trigger('click')
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual(['src'])
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits select but not toggle when clicking a leaf node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
        })
        await wrapper.find('[role="treeitem"] > div').trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('does not emit when clicking a disabled node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                disabled: true,
            },
        })
        await wrapper.find('[role="treeitem"] > div').trigger('click')
        expect(wrapper.emitted('select')).toBeFalsy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('exposes focus method and nodeId', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        expect(wrapper.vm.nodeId).toBe('file.ts')
        expect(typeof wrapper.vm.focus).toBe('function')
    })

    it('focus method focuses the treeitem element', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        ;(wrapper.vm as unknown as { focus: () => void }).focus()
        await nextTick()
        expect(document.activeElement).toBe(wrapper.find('[role="treeitem"]').element)
    })
})

describe('TreeViewNode - Keyboard Navigation', () => {
    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('selects leaf node on Space key in single mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0][0]).toEqual(
            expect.objectContaining({ id: 'file.ts' })
        )
    })

    it('toggles and selects branch on Space key in single mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual(['src'])
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits check on Enter key in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('check')).toBeTruthy()
    })

    it('does not emit check on Enter when disabled in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
                disabled: true,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('check')).toBeFalsy()
    })

    it('does not emit check on Space when disabled in checkbox mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'checkbox',
                checkedIds: new Set<string>(),
                disabled: true,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('check')).toBeFalsy()
    })

    it('selects leaf on Enter key in single mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('toggles and selects branch on Enter key in single mode', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('expands collapsed node via ArrowRight and selects', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual(['src'])
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits focus-first-child via ArrowRight on expanded node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: new Set(['src']),
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowRight' })
        expect(wrapper.emitted('focus-first-child')).toBeTruthy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('collapses expanded node via ArrowLeft', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: new Set(['src']),
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')![0]).toEqual(['src'])
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits focus-parent via ArrowLeft on collapsed non-leaf node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'src', label: 'src', children: [{ id: 'a.ts', label: 'a.ts' }] },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('focus-parent')).toBeTruthy()
        expect(wrapper.emitted('toggle')).toBeFalsy()
    })

    it('emits focus-parent via ArrowLeft on leaf node', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectionMode: 'single',
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowLeft' })
        expect(wrapper.emitted('focus-parent')).toBeTruthy()
    })

    it('emits focus-prev on ArrowUp', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowUp' })
        expect(wrapper.emitted('focus-prev')).toBeTruthy()
    })

    it('emits focus-next on ArrowDown', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'ArrowDown' })
        expect(wrapper.emitted('focus-next')).toBeTruthy()
    })

    it('emits focus-first on Home', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'Home' })
        expect(wrapper.emitted('focus-first')).toBeTruthy()
    })

    it('emits focus-last on End', async () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
            },
            attachTo: document.body,
        })
        await wrapper.trigger('keydown', { key: 'End' })
        expect(wrapper.emitted('focus-last')).toBeTruthy()
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

        await wrapper.setProps({ checkedIds: ['src', 'main.ts', 'utils.ts'] } as Record<string, unknown>)
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

    it('unchecks from indeterminate state', async () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: sampleNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['src'],
                checkedIds: ['main.ts'],
            },
            global: { provide: localeProvide },
        })
        // src is indeterminate, clicking should uncheck all
        const checkboxes = wrapper.findAllComponents({ name: 'Checkbox' })
        await checkboxes[0].vm.$emit('update:checked', false)

        const emitted = wrapper.emitted('update:checkedIds')
        expect(emitted).toBeTruthy()
        const newIds = emitted![0][0] as string[]
        expect(newIds).toEqual([])
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
            attachTo: document.body,
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

    it('sets tabindex=0 on selected node', () => {
        const wrapper = mount(TreeViewNode, {
            props: {
                node: { id: 'file.ts', label: 'file.ts' },
                expandedIds: emptyExpandedIds,
                selectedId: 'file.ts',
            },
        })
        expect(wrapper.attributes('tabindex')).toBe('0')
    })
})

describe('TreeView - Deep nesting', () => {
    it('renders deeply nested nodes when expanded', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: deepNodes,
                defaultExpanded: ['root', 'level1'],
            },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="treeitem"]')
        expect(items.length).toBe(3)
        expect(wrapper.text()).toContain('root')
        expect(wrapper.text()).toContain('level1')
        expect(wrapper.text()).toContain('level2')
    })

    it('check state propagates through deep nesting', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: deepNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['root', 'level1'],
                checkedIds: ['level1', 'level2'],
            },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="treeitem"]')
        // level1 should be checked (itself and child level2)
        expect(items[1].attributes('aria-checked')).toBe('true')
        // root should be indeterminate (level1+level2 checked but root itself is not)
        expect(items[0].attributes('aria-checked')).toBe('mixed')
    })

    it('check state all checked through deep nesting', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: deepNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['root', 'level1'],
                checkedIds: ['root', 'level1', 'level2'],
            },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="treeitem"]')
        expect(items[0].attributes('aria-checked')).toBe('true')
        expect(items[1].attributes('aria-checked')).toBe('true')
        expect(items[2].attributes('aria-checked')).toBe('true')
    })

    it('indeterminate state propagates up through deep nesting', () => {
        const wrapper = mount(TreeView, {
            props: {
                nodes: deepNodes,
                selectionMode: 'checkbox',
                defaultExpanded: ['root', 'level1'],
                checkedIds: ['level2'],
            },
            global: { provide: localeProvide },
        })
        const items = wrapper.findAll('[role="treeitem"]')
        // level2 is a leaf and checked
        expect(items[2].attributes('aria-checked')).toBe('true')
        // level1 has descendantIds=['level1','level2'], only level2 is checked => indeterminate
        expect(items[1].attributes('aria-checked')).toBe('mixed')
        // root is also indeterminate
        expect(items[0].attributes('aria-checked')).toBe('mixed')
    })
})

describe('tree-view-utils', () => {
    describe('getAllDescendantIds', () => {
        it('returns only the node id for a leaf', () => {
            const node: TreeNode = { id: 'a', label: 'a' }
            expect(getAllDescendantIds(node)).toEqual(['a'])
        })

        it('returns the node id and all descendant ids', () => {
            const node: TreeNode = {
                id: 'root',
                label: 'root',
                children: [
                    { id: 'child1', label: 'child1' },
                    {
                        id: 'child2',
                        label: 'child2',
                        children: [
                            { id: 'grandchild', label: 'grandchild' },
                        ],
                    },
                ],
            }
            const result = getAllDescendantIds(node)
            expect(result).toEqual(['root', 'child1', 'child2', 'grandchild'])
        })
    })

    describe('getCheckState', () => {
        const node: TreeNode = {
            id: 'parent',
            label: 'parent',
            children: [
                { id: 'child1', label: 'child1' },
                { id: 'child2', label: 'child2' },
            ],
        }

        it('returns unchecked when no ids are checked', () => {
            expect(getCheckState(node, new Set())).toBe('unchecked')
        })

        it('returns checked when all ids are checked', () => {
            const checked = new Set(['parent', 'child1', 'child2'])
            expect(getCheckState(node, checked)).toBe('checked')
        })

        it('returns indeterminate when some ids are checked', () => {
            const checked = new Set(['child1'])
            expect(getCheckState(node, checked)).toBe('indeterminate')
        })

        it('returns checked for a leaf when its id is checked', () => {
            const leaf: TreeNode = { id: 'leaf', label: 'leaf' }
            expect(getCheckState(leaf, new Set(['leaf']))).toBe('checked')
        })

        it('returns unchecked for a leaf when its id is not checked', () => {
            const leaf: TreeNode = { id: 'leaf', label: 'leaf' }
            expect(getCheckState(leaf, new Set())).toBe('unchecked')
        })
    })

    describe('moveNode', () => {
        it('moves a node before another node', () => {
            const tree: TreeNode[] = [
                { id: '1', label: '1' },
                { id: '2', label: '2' },
            ]
            const result = moveNode(tree, '2', '1', 'before')
            expect(result.map(n => n.id)).toEqual(['2', '1'])
        })

        it('moves a node after another node', () => {
            const tree: TreeNode[] = [
                { id: '1', label: '1' },
                { id: '2', label: '2' },
            ]
            const result = moveNode(tree, '1', '2', 'after')
            expect(result.map(n => n.id)).toEqual(['2', '1'])
        })

        it('moves a node inner to another node', () => {
            const tree: TreeNode[] = [
                { id: '1', label: '1' },
                { id: '2', label: '2' },
            ]
            const result = moveNode(tree, '2', '1', 'inner')
            expect(result[0].children).toHaveLength(1)
            expect(result[0].children![0].id).toBe('2')
            expect(result).toHaveLength(1)
        })

        it('refuses to move if target is same as source', () => {
            const tree: TreeNode[] = [{ id: '1', label: '1' }]
            const result = moveNode(tree, '1', '1', 'inner')
            expect(result).toEqual(tree)
        })

        it('refuses to move to a descendant of itself', () => {
            const tree: TreeNode[] = [
                {
                    id: '1',
                    label: '1',
                    children: [{ id: '2', label: '2' }],
                },
            ]
            const result = moveNode(tree, '1', '2', 'inner')
            expect(result).toEqual(tree)
        })
    })
})

describe('TreeView - Drag and Drop', () => {
    it('supports draggable props and triggers drag events', async () => {
        const tree: TreeNode[] = [
            { id: 'drag-node', label: 'Drag' },
            { id: 'drop-node', label: 'Drop' }
        ]
        
        const wrapper = mount(TreeView, {
            props: {
                nodes: tree,
                draggable: true,
            },
            global: { provide: localeProvide },
        })

        const nodes = wrapper.findAllComponents(TreeViewNode)
        const dragItem = nodes[0]
        const dropItem = nodes[1]

        await dragItem.find('[draggable="true"]').trigger('dragstart', { preventDefault: () => {} })
        expect(wrapper.emitted('node-drag-start')).toBeTruthy()

        await dropItem.find('[role="treeitem"] > div').trigger('dragover', { clientY: 10, preventDefault: () => {} })
        expect(wrapper.emitted('node-drag-over')).toBeTruthy()

        await dropItem.find('[role="treeitem"] > div').trigger('drop', { preventDefault: () => {} })
        expect(wrapper.emitted('node-drop')).toBeTruthy()
        expect(wrapper.emitted('update:nodes')).toBeTruthy()
    })
})

describe('TreeView - Lazy Loading', () => {
    it('shows branch chevron/icon and loads children on expand', async () => {
        const mockLoad = vi.fn().mockResolvedValue([
            { id: 'child', label: 'Child Node', isLeaf: true }
        ])
        const tree: TreeNode[] = [
            { id: 'lazy-root', label: 'Lazy Root' }
        ]
        const wrapper = mount(TreeView, {
            props: {
                nodes: tree,
                lazy: true,
                load: mockLoad,
            },
            global: { provide: localeProvide },
        })

        const node = wrapper.findComponent(TreeViewNode)
        expect(node.text()).toContain('Lazy Root')
        
        await node.find('[role="treeitem"] > div').trigger('click')
        
        expect(mockLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 'lazy-root' }))
        
        await new Promise(resolve => setTimeout(resolve, 0))
        await nextTick()
        
        expect(wrapper.text()).toContain('Child Node')
    })

    it('shows retry button on failure and retries loading', async () => {
        let callCount = 0
        const mockLoad = vi.fn().mockImplementation(() => {
            callCount++
            if (callCount === 1) {
                return Promise.reject(new Error('Load error'))
            }
            return Promise.resolve([{ id: 'child', label: 'Child Node', isLeaf: true }])
        })
        const tree: TreeNode[] = [
            { id: 'lazy-root', label: 'Lazy Root' }
        ]
        const wrapper = mount(TreeView, {
            props: {
                nodes: tree,
                lazy: true,
                load: mockLoad,
                retryOnError: true,
            },
            global: { provide: localeProvide },
        })

        const node = wrapper.findComponent(TreeViewNode)
        await node.find('[role="treeitem"] > div').trigger('click')
        
        await new Promise(resolve => setTimeout(resolve, 0))
        await nextTick()
        
        const retryBtn = node.find('button[title="Retry Loading"]')
        expect(retryBtn.exists()).toBe(true)
        
        await retryBtn.trigger('click')
        
        await new Promise(resolve => setTimeout(resolve, 0))
        await nextTick()
        
        expect(wrapper.text()).toContain('Child Node')
        expect(node.find('button[title="Retry Loading"]').exists()).toBe(false)
    })
})

describe('TreeView - Filtering', () => {
    it('filters nodes based on query and exposes filter method', async () => {
        const tree: TreeNode[] = [
            {
                id: 'parent1',
                label: 'Parent 1',
                children: [
                    { id: 'child1', label: 'Match Me' },
                    { id: 'child2', label: 'Hidden Node' }
                ]
            },
            { id: 'parent2', label: 'Other Parent' }
        ]
        const wrapper = mount(TreeView, {
            props: {
                nodes: tree,
                filterable: true,
            },
            global: { provide: localeProvide },
        })

        const vm = wrapper.vm as any
        vm.filter('Match')
        await nextTick()

        const items = wrapper.findAllComponents(TreeViewNode)
        const parent1 = items.find(i => i.props('node').id === 'parent1')
        expect((parent1?.element as HTMLElement).style.display).not.toBe('none')
        
        const child1 = items.find(i => i.props('node').id === 'child1')
        expect((child1?.element as HTMLElement).style.display).not.toBe('none')

        const child2 = items.find(i => i.props('node').id === 'child2')
        expect((child2?.element as HTMLElement).style.display).toBe('none')

        const parent2 = items.find(i => i.props('node').id === 'parent2')
        expect((parent2?.element as HTMLElement).style.display).toBe('none')
    })
})

