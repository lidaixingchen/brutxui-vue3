import type { TreeNode } from './TreeView.vue'

export type CheckState = 'checked' | 'unchecked' | 'indeterminate'

export function getAllDescendantIds(node: TreeNode): string[] {
    const result: string[] = [node.id]
    if (node.children) {
        for (const child of node.children) {
            result.push(...getAllDescendantIds(child))
        }
    }
    return result
}

export function getCheckState(node: TreeNode, checkedIds: Set<string>): CheckState {
    const descendantIds = getAllDescendantIds(node)
    const checkedCount = descendantIds.filter(id => checkedIds.has(id)).length

    if (checkedCount === descendantIds.length) return 'checked'
    if (checkedCount === 0) return 'unchecked'
    return 'indeterminate'
}
