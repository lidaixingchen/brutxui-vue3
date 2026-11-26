import type { InjectionKey } from 'vue'
import type { TreeNode } from './tree-select-types'

export const treeSelectVisibleChildrenKey: InjectionKey<(node: TreeNode) => TreeNode[] | undefined> = Symbol('treeSelectVisibleChildren')

export function searchTreeSelectNodes(nodes: TreeNode[], query: string) {
    const lowerQuery = query.toLowerCase()
    const childrenByNode = new Map<TreeNode, TreeNode[]>()
    const expandedIds = new Set<string>()

    function collectMatches(items: TreeNode[]): TreeNode[] {
        const matches: TreeNode[] = []
        for (const node of items) {
            const children = node.children?.length ? collectMatches(node.children) : undefined
            if (children?.length) {
                childrenByNode.set(node, children)
                expandedIds.add(node.id)
                matches.push(node)
            } else if (node.label.toLowerCase().includes(lowerQuery)) {
                matches.push(node)
            }
        }
        return matches
    }

    return { nodes: collectMatches(nodes), childrenByNode, expandedIds }
}
