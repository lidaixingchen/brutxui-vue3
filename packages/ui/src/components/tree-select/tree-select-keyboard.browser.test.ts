import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
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
}

describe('TreeSelect keyboard browser integration', () => {
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
