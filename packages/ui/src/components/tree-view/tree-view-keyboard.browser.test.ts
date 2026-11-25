import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import TreeView from './TreeView.vue'
import type { SelectionMode, TreeNode } from './types'

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

function treeItem(label: string): HTMLElement {
    const item = Array.from(wrapper!.element.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .find(element => Array.from(element.firstElementChild?.children ?? [])
            .some(child => child.textContent?.trim() === label))
    if (!item) throw new Error(`Tree item missing: ${label}`)
    return item
}

function mountTree() {
    const nodes = ref<TreeNode[]>([
        {
            id: 'branch', label: 'Branch', children: [
                { id: 'blocked', label: 'Blocked', disabled: true },
                { id: 'ready', label: 'Ready' },
                { id: 'next', label: 'Next' },
            ],
        },
        { id: 'tail', label: 'Tail' },
    ])
    wrapper = mount(defineComponent({
        setup: () => () => h(TreeView, { nodes: nodes.value, defaultExpanded: ['branch'] }),
    }))
    return nodes
}

function mountTreeInTabOrder(initialValue: string | null, selectionMode: SelectionMode = 'single') {
    const nodes = ref<TreeNode[]>([
        { id: 'branch', label: 'Branch', children: [{ id: 'child', label: 'Child' }] },
        { id: 'tail', label: 'Tail' },
    ])
    const modelValue = ref(initialValue)
    const checkedIds = ref<string[]>([])
    const tree = ref<InstanceType<typeof TreeView> | null>(null)
    const before = ref<HTMLButtonElement | null>(null)
    const after = ref<HTMLButtonElement | null>(null)
    const selectedIds: (string | null)[] = []

    wrapper = mount(defineComponent({
        setup: () => () => h('div', [
            h('button', { type: 'button', ref: before }, 'Before'),
            h(TreeView, {
                ref: tree,
                nodes: nodes.value,
                modelValue: modelValue.value,
                selectionMode,
                checkedIds: checkedIds.value,
                filterable: true,
                'onUpdate:modelValue': id => selectedIds.push(id),
                'onUpdate:checkedIds': ids => { checkedIds.value = ids },
            }),
            h('button', { type: 'button', ref: after }, 'After'),
        ]),
    }))

    async function expectTabEntry(label?: string) {
        const item = label === undefined ? null : treeItem(label)
        before.value!.focus()
        await userEvent.tab()
        expect(document.activeElement).toBe(item ?? after.value)
        if (item) {
            await userEvent.tab()
            expect(document.activeElement).toBe(after.value)
        }
        await userEvent.tab({ shift: true })
        expect(document.activeElement).toBe(item ?? before.value)

        const tabStops = wrapper!.element.querySelectorAll('[role="treeitem"][tabindex="0"]:not([inert] *)')
        expect(tabStops).toHaveLength(item ? 1 : 0)
        if (item) expect(tabStops[0]).toBe(item)
    }

    return { nodes, modelValue, tree, selectedIds, expectTabEntry }
}

describe('TreeView sequential keyboard focus', () => {
    it('enters the first enabled item without a selection', async () => {
        const { expectTabEntry } = mountTreeInTabOrder(null)
        await expectTabEntry('Branch')
    })

    it('uses the controlled selection when its branch is expanded', async () => {
        const { modelValue, expectTabEntry, selectedIds } = mountTreeInTabOrder('child')
        await expectTabEntry('Branch')
        expect(treeItem('Branch').getAttribute('aria-selected')).toBe('false')
        expect(selectedIds).toEqual([])

        await userEvent.keyboard('{ArrowRight}')
        await expectTabEntry('Child')
        expect(treeItem('Child').getAttribute('aria-selected')).toBe('true')
        expect(selectedIds).toEqual(['branch'])

        treeItem('Branch').focus()
        await userEvent.keyboard('{ArrowLeft}')
        await expectTabEntry('Branch')

        modelValue.value = 'tail'
        await nextTick()
        await expectTabEntry('Tail')
    })

    it('recomputes the entry when nodes or their availability change', async () => {
        const { nodes, modelValue, tree, selectedIds, expectTabEntry } = mountTreeInTabOrder('tail')
        await expectTabEntry('Tail')

        tree.value!.filter('Branch')
        await nextTick()
        await expectTabEntry('Branch')
        expect(treeItem('Tail').getAttribute('aria-selected')).toBe('true')

        tree.value!.filter('')
        await nextTick()
        await expectTabEntry('Tail')

        nodes.value[1]!.disabled = true
        await nextTick()
        await expectTabEntry('Branch')

        nodes.value[1]!.disabled = false
        await nextTick()
        await expectTabEntry('Tail')

        nodes.value.pop()
        await nextTick()
        await expectTabEntry('Branch')
        expect(modelValue.value).toBe('tail')
        expect(selectedIds).toEqual([])

        nodes.value[0]!.disabled = true
        await nextTick()
        await expectTabEntry()

        nodes.value = []
        await nextTick()
        await expectTabEntry()
    })

    it('enters checkbox trees through the available tree item and preserves checking', async () => {
        const { nodes, modelValue, tree, selectedIds, expectTabEntry } = mountTreeInTabOrder('tail', 'checkbox')
        const tail = treeItem('Tail')
        const checkbox = tail.querySelector<HTMLButtonElement>('[role="checkbox"]')!

        await expectTabEntry('Tail')
        await userEvent.keyboard(' ')
        expect(tail.getAttribute('aria-checked')).toBe('true')
        expect(checkbox.getAttribute('aria-checked')).toBe('true')

        await userEvent.click(checkbox)
        expect(tail.getAttribute('aria-checked')).toBe('false')
        expect(checkbox.getAttribute('aria-checked')).toBe('false')
        expect(selectedIds).toEqual([])

        nodes.value[1]!.disabled = true
        await nextTick()
        expect(checkbox.disabled).toBe(true)
        await expectTabEntry('Branch')

        modelValue.value = 'child'
        tree.value!.filter('Child')
        await nextTick()
        await expectTabEntry('Child')

        tree.value!.filter('')
        await nextTick()
        await expectTabEntry('Branch')
    })
})

describe('TreeView keyboard navigation in nested trees', () => {
    it('moves to exactly one enabled neighbor per key press', async () => {
        mountTree()
        treeItem('Branch').focus()
        await userEvent.keyboard('{ArrowRight}')
        expect(document.activeElement).toBe(treeItem('Ready'))

        await userEvent.keyboard('{ArrowDown}')
        expect(document.activeElement).toBe(treeItem('Next'))
        await userEvent.keyboard('{ArrowUp}')
        expect(document.activeElement).toBe(treeItem('Ready'))
    })

    it('continues navigation after the focused root becomes disabled', async () => {
        const nodes = mountTree()
        treeItem('Branch').focus()
        nodes.value[0]!.disabled = true
        await nextTick()

        await userEvent.keyboard('{ArrowDown}')
        expect(document.activeElement).toBe(treeItem('Ready'))
        await userEvent.keyboard('{End}')
        expect(document.activeElement).toBe(treeItem('Tail'))
    })

    it('continues from a newly disabled child in visible order', async () => {
        const nodes = mountTree()
        treeItem('Ready').focus()
        nodes.value[0]!.children![1]!.disabled = true
        await nextTick()

        await userEvent.keyboard('{ArrowDown}')
        expect(document.activeElement).toBe(treeItem('Next'))
    })
})
