import { Comment, Fragment, type VNode } from 'vue'

/**
 * 递归判断 VNode 列表中是否包含真实的有效渲染内容
 * 过滤空节点、注释节点以及纯空白字符串节点
 */
export function hasSlotContent(nodes: VNode[] | undefined): boolean {
    if (!nodes || nodes.length === 0) return false
    return nodes.some((node) => {
        if (!node) return false
        if (typeof (node as unknown) === 'string') {
            return (node as unknown as string).trim().length > 0
        }
        if (node.type === Comment) return false
        if (node.type === Fragment && Array.isArray(node.children)) {
            return hasSlotContent(node.children as VNode[])
        }
        if (typeof node.children === 'string') {
            return node.children.trim().length > 0
        }
        if (Array.isArray(node.children)) {
            return hasSlotContent(node.children as VNode[])
        }
        return true
    })
}
