import type { TreeNode } from './TreeView.vue'

export function getAllDescendantIds(node: TreeNode): string[] {
    const result: string[] = [node.id]
    if (node.children) {
        for (const child of node.children) {
            result.push(...getAllDescendantIds(child))
        }
    }
    return result
}
