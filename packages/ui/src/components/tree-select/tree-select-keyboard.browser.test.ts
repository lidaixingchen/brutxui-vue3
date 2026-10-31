import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { userEvent } from 'vitest/browser'
import { mount } from '@/test/browser-mount'
import TreeSelect from './TreeSelect.vue'
import type { TreeNode } from './tree-select-types'

type BrowserMountResult = ReturnType<typeof mount>

const nodes: TreeNode[] = [
    {
        id: 'root',
        label: 'Root',
        children: [
            {
                id: 'branch',
                label: 'Branch',
                children: [{ id: 'grandchild', label: 'Grandchild' }],
            },
            { id: 'first-sibling', label: 'First Sibling' },
            { id: 'second-sibling', label: 'Second Sibling' },
        ],
    },
    { id: 'outside', label: 'Outside' },
]

let host: HTMLDivElement | null = null
let wrapper: BrowserMountResult | null = null

beforeEach(() => {
    host = document.createElement('div')
    document.body.appendChild(host)
})

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    if (host?.parentNode) host.parentNode.removeChild(host)
    host = null
})

function getTreeItem(label: string): HTMLElement {
    const item = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]')).find((candidate) =>
        candidate.querySelector('span.min-w-0')?.textContent === label
    )
    if (!item) throw new Error(`Tree item not found: ${label}`)
    return item
}

async function pressKey(item: HTMLElement, key: string): Promise<void> {
    expect(document.activeElement).toBe(item)
    await userEvent.keyboard(`[${key}]`)
    await nextTick()
    const focused = document.activeElement
    if (focused?.getAttribute('role') === 'treeitem') {
        await expect.poll(() => document.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1)
        await expect.poll(() => document.querySelector('[role="treeitem"][tabindex="0"]')).toBe(focused)
    }
}

describe('TreeSelect keyboard browser integration', () => {
    it('keeps the search input focused when opened with every node disabled', async () => {
        wrapper = mount(TreeSelect, {
            props: {
                nodes: [
                    { id: 'disabled-first', label: 'Disabled First', disabled: true },
                    { id: 'disabled-last', label: 'Disabled Last', disabled: true },
                ],
            },
            attachTo: host!,
        })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        await userEvent.click(trigger)
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        if (!searchInput) throw new Error('TreeSelect search input not found')

        await expect.poll(() => document.activeElement).toBe(searchInput)
        const items = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        expect(items).toHaveLength(2)
        expect(items.every((item) => item.getAttribute('tabindex') === '-1')).toBe(true)
    })

    it.each([
        { searchable: true, replaceNodes: false },
        { searchable: false, replaceNodes: false },
        { searchable: true, replaceNodes: true },
        { searchable: false, replaceNodes: true },
    ])('returns focus to an available control when all nodes become disabled ($searchable, $replaceNodes)', async ({ searchable, replaceNodes }) => {
        const nodes = ref<TreeNode[]>([
            { id: 'first', label: 'First Enabled' },
            { id: 'disabled', label: 'Disabled', disabled: true },
            { id: 'last', label: 'Last Enabled' },
        ])
        const harness = defineComponent({
            setup() {
                return () => h(TreeSelect, { nodes: nodes.value, searchable })
            },
        })
        wrapper = mount(harness, { attachTo: host! })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        await userEvent.click(trigger)
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        const firstEnabled = getTreeItem('First Enabled')
        if (searchable) {
            expect(searchInput).not.toBeNull()
            await userEvent.tab()
        }
        await expect.poll(() => document.activeElement).toBe(firstEnabled)
        await userEvent.keyboard('[ArrowDown]')
        const lastEnabled = getTreeItem('Last Enabled')
        await expect.poll(() => document.activeElement).toBe(lastEnabled)

        nodes.value = nodes.value.map(node => ({
            ...node,
            id: replaceNodes ? `disabled-${node.id}` : node.id,
            disabled: true,
        }))
        await nextTick()

        await expect.poll(() => document.activeElement).toBe(searchInput ?? trigger)
        const items = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        expect(items).toHaveLength(nodes.value.length)
        expect(items.every((item) => item.getAttribute('tabindex') === '-1')).toBe(true)
    })

    it('moves focus to the trigger when all nodes become disabled as search is hidden', async () => {
        const nodes = ref<TreeNode[]>([
            { id: 'first', label: 'First Enabled' },
            { id: 'last', label: 'Last Enabled' },
        ])
        const searchable = ref(true)
        const harness = defineComponent({
            setup() {
                return () => h(TreeSelect, { nodes: nodes.value, searchable: searchable.value })
            },
        })
        wrapper = mount(harness, { attachTo: host! })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        await userEvent.click(trigger)
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]')
        if (!searchInput) throw new Error('TreeSelect search input not found')
        await expect.poll(() => document.activeElement).toBe(searchInput)

        await userEvent.tab()
        const firstEnabled = getTreeItem('First Enabled')
        await expect.poll(() => document.activeElement).toBe(firstEnabled)
        await userEvent.keyboard('[ArrowDown]')
        const lastEnabled = getTreeItem('Last Enabled')
        await expect.poll(() => document.activeElement).toBe(lastEnabled)
        const originalItems = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'))

        nodes.value = nodes.value.map((node) => ({ ...node, disabled: true }))
        searchable.value = false
        await nextTick()

        await expect.poll(() => document.activeElement).toBe(trigger)
        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        expect(document.querySelector('input[type="text"]')).toBeNull()
        const updatedItems = Array.from(document.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        expect(updatedItems).toHaveLength(nodes.value.length)
        expect(updatedItems[0]).toBe(originalItems[0])
        expect(updatedItems[1]).toBe(originalItems[1])
        expect(updatedItems.map((item) => item.querySelector('span.min-w-0')?.textContent)).toEqual([
            'First Enabled',
            'Last Enabled',
        ])
        expect(updatedItems.every((item) => item.getAttribute('aria-disabled') === 'true')).toBe(true)
    })

    it('tabs to and selects a matching child below a disabled ancestor', async () => {
        const disabledRootNodes: TreeNode[] = [
            {
                id: 'disabled-root',
                label: 'Disabled Root',
                disabled: true,
                children: [
                    { id: 'enabled-child', label: 'Enabled Child' },
                    { id: 'enabled-peer', label: 'Enabled Peer' },
                ],
            },
            { id: 'outside', label: 'Outside' },
        ]
        const selectedValues: (string | string[] | undefined)[] = []
        wrapper = mount(TreeSelect, {
            props: {
                nodes: disabledRootNodes,
                'onUpdate:modelValue': (value: string | string[] | undefined) => selectedValues.push(value),
            },
            attachTo: host!,
        })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        await userEvent.click(trigger)
        const input = document.querySelector<HTMLInputElement>('input[type="text"]')
        if (!input) throw new Error('TreeSelect search input not found')
        await userEvent.click(input)
        await userEvent.type(input, 'Enabled')

        const child = getTreeItem('Enabled Child')
        await expect.poll(() => child.getAttribute('tabindex')).toBe('0')

        await userEvent.tab()
        await expect.poll(() => document.activeElement).toBe(child)
        await pressKey(child, 'ArrowDown')
        expect(document.activeElement).toBe(getTreeItem('Enabled Peer'))
        await pressKey(getTreeItem('Enabled Peer'), 'ArrowUp')
        expect(document.activeElement).toBe(child)
        await pressKey(child, 'Enter')

        await expect.poll(() => selectedValues).toEqual(['enabled-child'])
        await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')

        await userEvent.click(trigger)
        const outside = getTreeItem('Outside')
        expect(document.querySelectorAll('[role="treeitem"]')).toHaveLength(2)
        expect(outside.getAttribute('tabindex')).toBe('0')
        expect(document.body.textContent).not.toContain('Enabled Child')
    })

    it('enters the tree, navigates across nested levels once, and restores trigger focus on close', async () => {
        wrapper = mount(TreeSelect, { props: { nodes }, attachTo: host! })
        const trigger = host!.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        trigger.focus()
        expect(document.activeElement).toBe(trigger)
        await userEvent.click(trigger)
        await expect.poll(() => document.activeElement).toBe(document.querySelector('input[type="text"]'))

        expect(trigger.getAttribute('aria-expanded')).toBe('true')
        expect(document.querySelector('[role="tree"]')).not.toBeNull()
        expect(getTreeItem('Root').getAttribute('tabindex')).toBe('0')
        expect(document.activeElement).toBe(document.querySelector('input[type="text"]'))

        await userEvent.tab()
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        expect(getTreeItem('Root').getAttribute('aria-expanded')).toBe('true')
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        expect(document.activeElement).toBe(getTreeItem('Branch'))
        await pressKey(getTreeItem('Branch'), 'ArrowRight')
        await pressKey(getTreeItem('Branch'), 'ArrowRight')
        expect(document.activeElement).toBe(getTreeItem('Grandchild'))

        await pressKey(getTreeItem('Grandchild'), 'ArrowDown')
        expect(document.activeElement).toBe(getTreeItem('First Sibling'))

        await pressKey(getTreeItem('First Sibling'), 'Escape')
        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        await expect.poll(() => document.activeElement).toBe(trigger)
        await expect.poll(() => document.querySelector('[role="tree"]')).toBeNull()
    })
})
