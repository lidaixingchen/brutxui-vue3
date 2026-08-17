export type SelectionMode = 'single' | 'checkbox';

/** 树节点接口 */
export interface TreeNode<T = unknown> {
    /** 节点唯一标识 */
    id: string;
    /** 节点显示文本 */
    label: string;
    /** 节点图标名称或自定义图标类名 */
    icon?: string;
    /** 子节点列表 */
    children?: TreeNode<T>[];
    /** 自定义业务数据 */
    data?: T;
    /** 是否禁用交互 */
    disabled?: boolean;
    /** 是否叶子节点（懒加载时若为 true 则不展示展开图标） */
    isLeaf?: boolean;
    /** 懒加载子节点是否已加载 */
    loaded?: boolean;
    /** 懒加载是否处于请求中 */
    loading?: boolean;
    /** 过滤搜索时是否隐藏 */
    hidden?: boolean;
}
