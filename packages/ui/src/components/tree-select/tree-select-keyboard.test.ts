import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import TreeSelect from './TreeSelect.vue'
import { en } from '@/locales/en'
import { LOCALE_INJECTION_KEY } from '@/composables/useLocale'
import type { TreeNode } from './tree-select-types'

const localeProvide = { global: { provide: { [LOCALE_INJECTION_KEY]: en } } }
type TreeSelectWrapper = ReturnType<typeof mount>

const navigationNodes: TreeNode[] = [
    {
        id: 'root',
        label: 'Root',
        children: [
            { id: 'first', label: 'First' },
            { id: 'disabled', label: 'Disabled', disabled: true },
            {
                id: 'branch',
                label: 'Branch',
                children: [{ id: 'grandchild', label: 'Grandchild' }],
            },
        ],
    },
    { id: 'after', label: 'After' },
    { id: 'last', label: 'Last' },
]

let wrapper: TreeSelectWrapper | null = null

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.replaceChildren()
})

async function openTreeSelect(nodes: TreeNode[] = navigationNodes, props: Record<string, unknown> = {}): Promise<TreeSelectWrapper> {
    wrapper?.unmount()
    wrapper = mount(TreeSelect, {
        ...localeProvide,
        props: { nodes, ...props },
        attachTo: document.body,
    })
    await wrapper.find('[role="combobox"]').trigger('click')
    await nextTick()
    await nextTick()
    await expect.poll(() => document.activeElement).toBe(document.body.querySelector('input[type="text"]'))
    return wrapper
}

function getTreeItems(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll<HTMLElement>('[role="treeitem"]'))
}

function getTreeItem(label: string): HTMLElement {
    const item = getTreeItems().find((candidate) =>
        candidate.querySelector('span.min-w-0')?.textContent === label
    )
    if (!item) throw new Error(`Tree item not found: ${label}`)
    return item
}

function getTreeItemRow(label: string): HTMLElement {
    const row = getTreeItem(label).firstElementChild
    if (!(row instanceof HTMLElement)) throw new Error(`Tree item row not found: ${label}`)
    return row
}

async function expectRovingFocus(item: HTMLElement): Promise<void> {
    expect(document.activeElement).toBe(item)
    await expect.poll(() => getTreeItems().filter((candidate) => candidate.getAttribute('tabindex') === '0')).toHaveLength(1)
    await expect.poll(() => getTreeItems().find((candidate) => candidate.getAttribute('tabindex') === '0')).toBe(item)
}

async function pressKey(item: HTMLElement, key: string): Promise<void> {
    item.focus()
    await nextTick()
    item.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    await nextTick()
    await nextTick()
}

describe('TreeSelect keyboard navigation', () => {
    it('moves real focus through visible enabled items and keeps the ends stable', async () => {
        await openTreeSelect()

        const root = getTreeItem('Root')
        await pressKey(root, 'ArrowRight')
        expect(root.getAttribute('aria-expanded')).toBe('true')
        await expectRovingFocus(root)

        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await expectRovingFocus(getTreeItem('First'))

        await pressKey(getTreeItem('First'), 'ArrowDown')
        await expectRovingFocus(getTreeItem('Branch'))

        await pressKey(getTreeItem('Branch'), 'ArrowDown')
        await expectRovingFocus(getTreeItem('After'))

        await pressKey(getTreeItem('After'), 'ArrowUp')
        await expectRovingFocus(getTreeItem('Branch'))

        await pressKey(getTreeItem('Branch'), 'ArrowUp')
        await expectRovingFocus(getTreeItem('First'))

        await pressKey(getTreeItem('First'), 'ArrowUp')
        await expectRovingFocus(getTreeItem('Root'))

        await pressKey(getTreeItem('Root'), 'ArrowUp')
        await expectRovingFocus(getTreeItem('Root'))

        await pressKey(getTreeItem('Root'), 'End')
        await expectRovingFocus(getTreeItem('Last'))
        await pressKey(getTreeItem('Last'), 'ArrowDown')
        await expectRovingFocus(getTreeItem('Last'))
    })

    it('expands a branch, enters its first enabled child, and leaves all-disabled children untouched', async () => {
        const nodes: TreeNode[] = [
            {
                id: 'branch',
                label: 'Branch',
                children: [
                    { id: 'disabled-child', label: 'Disabled Child', disabled: true },
                    { id: 'enabled-child', label: 'Enabled Child' },
                ],
            },
            {
                id: 'all-disabled',
                label: 'All Disabled',
                children: [{ id: 'only-disabled', label: 'Only Disabled', disabled: true }],
            },
        ]
        await openTreeSelect(nodes)

        const branch = getTreeItem('Branch')
        await pressKey(branch, 'ArrowRight')
        expect(branch.getAttribute('aria-expanded')).toBe('true')
        await expectRovingFocus(branch)

        await pressKey(getTreeItem('Branch'), 'ArrowRight')
        await expectRovingFocus(getTreeItem('Enabled Child'))

        const allDisabled = getTreeItem('All Disabled')
        await pressKey(allDisabled, 'ArrowRight')
        expect(allDisabled.getAttribute('aria-expanded')).toBe('true')
        await pressKey(getTreeItem('All Disabled'), 'ArrowRight')
        await expectRovingFocus(getTreeItem('All Disabled'))
    })

    it('collapses an expanded node and returns from a child to its enabled parent', async () => {
        await openTreeSelect()

        const root = getTreeItem('Root')
        await pressKey(root, 'ArrowRight')
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('First'), 'ArrowLeft')
        await expectRovingFocus(getTreeItem('Root'))

        await pressKey(getTreeItem('Root'), 'ArrowLeft')
        expect(getTreeItem('Root').getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(getTreeItem('Root'))
        expect(document.body.textContent).not.toContain('First')

        await pressKey(getTreeItem('Root'), 'ArrowLeft')
        await expectRovingFocus(getTreeItem('Root'))
    })

    it('returns focus past a disabled ancestor and forwards nested pointer highlighting', async () => {
        const nodes: TreeNode[] = [
            {
                id: 'root',
                label: 'Root',
                children: [
                    {
                        id: 'disabled-parent',
                        label: 'Disabled Parent',
                        disabled: true,
                        children: [{ id: 'leaf', label: 'Leaf' }],
                    },
                ],
            },
        ]
        await openTreeSelect(nodes, { searchable: true })

        const searchInput = document.body.querySelector<HTMLInputElement>('input[type="text"]')
        if (!searchInput) throw new Error('TreeSelect search input not found')
        searchInput.value = 'Leaf'
        searchInput.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
        await nextTick()

        const leaf = getTreeItem('Leaf')
        const leafRow = getTreeItemRow('Leaf')
        leafRow.dispatchEvent(new Event('pointerenter'))
        await nextTick()
        expect(leafRow.getAttribute('data-highlighted')).toBe('')

        leafRow.dispatchEvent(new Event('pointerleave'))
        await nextTick()
        expect(leafRow.hasAttribute('data-highlighted')).toBe(false)

        await pressKey(leaf, 'ArrowLeft')
        await expectRovingFocus(getTreeItem('Root'))
    })

    it('moves Home and End focus to the first and last visible enabled nodes', async () => {
        await openTreeSelect()

        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('Branch'), 'ArrowRight')
        await pressKey(getTreeItem('Branch'), 'ArrowRight')

        await pressKey(getTreeItem('Grandchild'), 'Home')
        await expectRovingFocus(getTreeItem('Root'))

        await pressKey(getTreeItem('Root'), 'End')
        await expectRovingFocus(getTreeItem('Last'))
    })

    it('uses the enabled sequence for Home and End when disabled nodes are at both ends', async () => {
        const nodes: TreeNode[] = [
            { id: 'disabled-first', label: 'Disabled First', disabled: true },
            { id: 'first', label: 'First Enabled' },
            { id: 'last', label: 'Last Enabled' },
            { id: 'disabled-last', label: 'Disabled Last', disabled: true },
        ]
        await openTreeSelect(nodes)

        await pressKey(getTreeItem('Last Enabled'), 'Home')
        await expectRovingFocus(getTreeItem('First Enabled'))

        await pressKey(getTreeItem('First Enabled'), 'End')
        await expectRovingFocus(getTreeItem('Last Enabled'))
    })

    it('keeps selection marked while keyboard focus moves to another node', async () => {
        const nodes: TreeNode[] = [
            { id: 'selected', label: 'Selected' },
            { id: 'current', label: 'Current' },
        ]
        await openTreeSelect(nodes, { modelValue: 'selected' })

        await pressKey(getTreeItem('Selected'), 'ArrowDown')

        const selected = getTreeItem('Selected')
        const current = getTreeItem('Current')
        const selectedSlot = getTreeItemRow('Selected').lastElementChild as HTMLElement
        const currentSlot = getTreeItemRow('Current').lastElementChild as HTMLElement
        await expectRovingFocus(current)
        expect(selected.getAttribute('aria-selected')).toBe('true')
        expect(getTreeItemRow('Selected').hasAttribute('data-highlighted')).toBe(false)
        expect(selectedSlot.querySelector('svg')).not.toBeNull()
        expect(current.getAttribute('aria-selected')).toBe('false')
        expect(getTreeItemRow('Current').getAttribute('data-highlighted')).toBe('')
        expect(currentSlot.childElementCount).toBe(0)

        const selectedRow = getTreeItemRow('Selected')
        selectedRow.dispatchEvent(new Event('pointerenter'))
        await nextTick()
        expect(selectedRow.getAttribute('data-highlighted')).toBe('')
        expect(getTreeItemRow('Current').hasAttribute('data-highlighted')).toBe(false)
        expect(selectedSlot.querySelector('svg')).not.toBeNull()

        selectedRow.dispatchEvent(new Event('pointerleave'))
        await nextTick()
        expect(getTreeItemRow('Current').getAttribute('data-highlighted')).toBe('')
    })

    it('restores keyboard highlight after the pointer leaves a nested selected node', async () => {
        const currentWrapper = await openTreeSelect(navigationNodes, { modelValue: 'first' })
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('First'), 'ArrowDown')

        const selectedRow = getTreeItemRow('First')
        const currentRow = getTreeItemRow('Branch')
        selectedRow.dispatchEvent(new Event('pointerenter'))
        await nextTick()
        expect(selectedRow.hasAttribute('data-highlighted')).toBe(true)
        expect(currentRow.hasAttribute('data-highlighted')).toBe(false)
        expect(getTreeItem('First').getAttribute('aria-selected')).toBe('true')

        selectedRow.dispatchEvent(new Event('pointerleave'))
        await nextTick()
        expect(selectedRow.hasAttribute('data-highlighted')).toBe(false)
        expect(currentRow.hasAttribute('data-highlighted')).toBe(true)
        expect(document.activeElement).toBe(getTreeItem('Branch'))
        expect(currentWrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('keeps the search input focused when opened with every visible node disabled', async () => {
        await openTreeSelect([
            { id: 'disabled-first', label: 'Disabled First', disabled: true },
            { id: 'disabled-last', label: 'Disabled Last', disabled: true },
        ])

        const searchInput = document.body.querySelector<HTMLInputElement>('input[type="text"]')
        if (!searchInput) throw new Error('TreeSelect search input not found')
        expect(document.activeElement).toBe(searchInput)
        expect(getTreeItems()).toHaveLength(2)
        expect(getTreeItems().every((item) => item.getAttribute('tabindex') === '-1')).toBe(true)
    })

    it('does not repeat a nested ArrowDown action through ancestor treeitems', async () => {
        await openTreeSelect()

        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('Root'), 'ArrowRight')
        await pressKey(getTreeItem('Branch'), 'ArrowRight')
        await pressKey(getTreeItem('Branch'), 'ArrowRight')

        await pressKey(getTreeItem('Grandchild'), 'ArrowDown')
        await expectRovingFocus(getTreeItem('After'))
    })

    it('moves out of a disabled item in the pressed direction', async () => {
        const nodes: TreeNode[] = [
            { id: 'before', label: 'Before' },
            { id: 'disabled', label: 'Disabled', disabled: true },
            { id: 'after', label: 'After' },
        ]
        await openTreeSelect(nodes)

        const disabled = getTreeItem('Disabled')
        disabled.focus()
        await nextTick()
        disabled.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }))
        await nextTick()
        await expectRovingFocus(getTreeItem('After'))

        disabled.focus()
        await nextTick()
        disabled.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true }))
        await nextTick()
        await expectRovingFocus(getTreeItem('Before'))
    })

    it('keeps disabled nodes from selecting or expanding with Enter and Space', async () => {
        const nodes: TreeNode[] = [
            { id: 'enabled', label: 'Enabled' },
            {
                id: 'disabled-branch',
                label: 'Disabled Branch',
                disabled: true,
                children: [{ id: 'hidden-child', label: 'Hidden Child' }],
            },
        ]
        await openTreeSelect(nodes)

        const disabledBranch = getTreeItem('Disabled Branch')
        disabledBranch.focus()
        await nextTick()
        disabledBranch.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
        disabledBranch.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }))
        await nextTick()

        expect(wrapper?.emitted('update:modelValue')).toBeUndefined()
        expect(disabledBranch.getAttribute('aria-expanded')).toBe('false')
    })

    it('uses Enter and Space for parent expansion and single or multiple selection contracts', async () => {
        await openTreeSelect()

        await pressKey(getTreeItem('Root'), 'Enter')
        expect(getTreeItem('Root').getAttribute('aria-expanded')).toBe('true')
        expect(wrapper?.emitted('update:modelValue')).toBeUndefined()

        await pressKey(getTreeItem('First'), 'Enter')
        expect(wrapper?.emitted('update:modelValue')).toEqual([['first']])
        expect(wrapper?.emitted('select')).toEqual([[navigationNodes[0].children?.[0]]])
        expect(document.body.querySelector('[role="combobox"]')?.getAttribute('aria-expanded')).toBe('false')

        await openTreeSelect(navigationNodes, { multiple: true, modelValue: ['first'] })
        await pressKey(getTreeItem('Root'), ' ')
        expect(getTreeItem('Root').getAttribute('aria-expanded')).toBe('true')
        await pressKey(getTreeItem('First'), ' ')
        expect(wrapper?.emitted('update:modelValue')).toEqual([[[]]])
    })

    it('returns focus to the trigger after the popover closes', async () => {
        await openTreeSelect()
        const trigger = document.body.querySelector<HTMLElement>('[role="combobox"]')
        if (!trigger) throw new Error('TreeSelect trigger not found')

        expect(getTreeItem('Root').getAttribute('tabindex')).toBe('0')
        expect(document.activeElement).toBe(document.body.querySelector('input[type="text"]'))
        trigger.focus()
        expect(document.activeElement).toBe(trigger)
        await pressKey(getTreeItem('Root'), 'Escape')
        await nextTick()

        expect(trigger.getAttribute('aria-expanded')).toBe('false')
        expect(document.activeElement).toBe(trigger)
    })
})
