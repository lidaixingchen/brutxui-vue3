import type { CheckState, TreeNode } from './types'
import type { ComputedRef, InjectionKey } from 'vue'

export type { CheckState } from './types'

export const TREE_CHECK_STATES_KEY: InjectionKey<ComputedRef<ReadonlyMap<string, CheckState>>> = Symbol('TreeViewCheckStates')

export function getAllDescendantIds(node: TreeNode): string[] {
    const result: string[] = []
    const stack: TreeNode[] = [node]
    while (stack.length > 0) {
        const current = stack.pop() as TreeNode
        result.push(current.id)
        if (current.children) {
            for (let i = current.children.length - 1; i >= 0; i--) {
                stack.push(current.children[i])
            }
        }
    }
    return result
}

export function getCheckState(node: TreeNode, checkedIds: Set<string>): CheckState {
    let total = 0
    let checked = 0
    const stack: TreeNode[] = [node]
    while (stack.length > 0) {
        const current = stack.pop() as TreeNode
        total++
        if (checkedIds.has(current.id)) checked++
        if (current.children) {
            for (const child of current.children) {
                stack.push(child)
            }
        }
    }
    return resolveCheckState(total, checked)
}

interface TreeNodeCheckSummary {
    total: number
    checked: number
}

interface TreeNodeTraversalFrame {
    node: TreeNode
    postOrder: boolean
}

function resolveCheckState(total: number, checked: number): CheckState {
    if (checked === total) return 'checked'
    if (checked === 0) return 'unchecked'
    return 'indeterminate'
}

export function getCheckStateMap(
    nodes: readonly TreeNode[],
    checkedIds: ReadonlySet<string>,
): ReadonlyMap<string, CheckState> {
    const states: Map<string, CheckState> = new Map<string, CheckState>()
    const summaries: Map<TreeNode, TreeNodeCheckSummary> = new Map<TreeNode, TreeNodeCheckSummary>()
    const pending: TreeNodeTraversalFrame[] = []

    for (let index: number = nodes.length - 1; index >= 0; index -= 1) {
        pending.push({ node: nodes[index]!, postOrder: false })
    }

    while (pending.length > 0) {
        const frame: TreeNodeTraversalFrame = pending.pop()!
        const node: TreeNode = frame.node

        if (!frame.postOrder) {
            pending.push({ node, postOrder: true })
            const children: TreeNode[] | undefined = node.children
            if (children) {
                for (let index: number = children.length - 1; index >= 0; index -= 1) {
                    pending.push({ node: children[index]!, postOrder: false })
                }
            }
            continue
        }

        let total: number = 1
        let checked: number = checkedIds.has(node.id) ? 1 : 0
        const children: TreeNode[] | undefined = node.children
        if (children) {
            for (const child of children) {
                const childSummary: TreeNodeCheckSummary = summaries.get(child)!
                total += childSummary.total
                checked += childSummary.checked
            }
        }

        summaries.set(node, { total, checked })
        states.set(node.id, resolveCheckState(total, checked))
    }

    return states
}

function cloneTreeAndExtract(nodes: TreeNode[], dragId: string): [TreeNode[], TreeNode | null] {
    let extracted: TreeNode | null = null

    function clone(list: TreeNode[]): TreeNode[] {
        const result: TreeNode[] = []
        for (const node of list) {
            if (node.id === dragId) {
                extracted = cloneNode(node)
                continue
            }
            result.push(cloneNode(node))
        }
        return result
    }

    function cloneNode(node: TreeNode): TreeNode {
        return {
            ...node,
            // 递归走 clone()：既做深拷贝，又能在每个层级检查并提取嵌套的 dragId 节点
            children: node.children ? clone(node.children) : undefined,
        }
    }

    const newNodes = clone(nodes)
    return [newNodes, extracted]
}

function insertNode(
    nodes: TreeNode[],
    dropId: string,
    extracted: TreeNode,
    dropType: 'before' | 'after' | 'inner'
): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.id === dropId) {
            if (dropType === 'before') {
                nodes.splice(i, 0, extracted)
                return true
            } else if (dropType === 'after') {
                nodes.splice(i + 1, 0, extracted)
                return true
            } else if (dropType === 'inner') {
                if (!node.children) {
                    node.children = []
                }
                node.children.push(extracted)
                node.isLeaf = false
                return true
            }
        }
        if (node.children && node.children.length > 0) {
            const inserted = insertNode(node.children, dropId, extracted, dropType)
            if (inserted) return true
        }
    }
    return false
}

export function cloneTree(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node: TreeNode) => ({
        ...node,
        children: node.children ? cloneTree(node.children) : undefined,
    }))
}

export function moveNode(
    nodes: TreeNode[],
    dragId: string,
    dropId: string,
    dropType: 'before' | 'after' | 'inner'
): TreeNode[] {
    if (dragId === dropId) {
        return cloneTree(nodes)
    }

    const [treeWithoutDrag, dragNode] = cloneTreeAndExtract(nodes, dragId)

    if (!dragNode) {
        return treeWithoutDrag
    }

    const descendantIds = getAllDescendantIds(dragNode)
    if (descendantIds.includes(dropId)) {
        return cloneTree(nodes)
    }

    const inserted = insertNode(treeWithoutDrag, dropId, dragNode, dropType)
    if (!inserted) {
        return cloneTree(nodes)
    }

    return treeWithoutDrag
}
