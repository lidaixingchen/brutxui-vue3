import type { TreeNode } from './types'

export type CheckState = 'checked' | 'unchecked' | 'indeterminate'

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
    if (checked === total) return 'checked'
    if (checked === 0) return 'unchecked'
    return 'indeterminate'
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
            const cloned = cloneNode(node)
            if (node.children) {
                cloned.children = clone(node.children)
            }
            result.push(cloned)
        }
        return result
    }

    function cloneNode(node: TreeNode): TreeNode {
        return {
            ...node,
            children: node.children ? [...node.children] : undefined,
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

export function moveNode(
    nodes: TreeNode[],
    dragId: string,
    dropId: string,
    dropType: 'before' | 'after' | 'inner'
): TreeNode[] {
    if (dragId === dropId) {
        return nodes
    }

    const [treeWithoutDrag, dragNode] = cloneTreeAndExtract(nodes, dragId)

    if (!dragNode) {
        return treeWithoutDrag
    }

    const descendantIds = getAllDescendantIds(dragNode)
    if (descendantIds.includes(dropId)) {
        return cloneTreeAndExtract(nodes, '')[0]
    }

    const inserted = insertNode(treeWithoutDrag, dropId, dragNode, dropType)
    if (!inserted) {
        return cloneTreeAndExtract(nodes, '')[0]
    }

    return treeWithoutDrag
}

export function cloneTree(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node: TreeNode) => ({
        ...node,
        children: node.children ? cloneTree(node.children) : undefined,
    }))
}


