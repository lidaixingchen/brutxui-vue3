import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@/test/browser-mount'
import TreeView from './TreeView.vue'
import type { TreeNode } from './types'

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
    wrapper?.unmount()
    wrapper = null
})

function treeItem(label: string): HTMLElement {
    const item = Array.from(wrapper!.element.querySelectorAll<HTMLElement>('[role="treeitem"]'))
        .find(element => element.firstElementChild?.textContent?.trim() === label)
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
