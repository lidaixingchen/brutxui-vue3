/** 树节点 */
export interface TreeNode {
    /** 节点唯一标识 */
    id: string
    /** 节点显示文本 */
    label: string
    /** 子节点 */
    children?: TreeNode[]
    /** 节点图标 */
    icon?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 附加数据 */
    data?: unknown
}
