export type CascaderValue = string | number

/**
 * 级联选项节点。
 * - 泛型 `T` 用于注入业务数据类型（默认 `unknown`，兼容未携带 `data` 的场景）
 * - `children` 递归引用树结构：调用方应保证不构成循环引用（本库的
 *   columns/getLeafPaths 遍历依赖树形无环），并控制合理深度（极端深度
 *   可能导致递归遍历/序列化栈溢出）
 */
export interface CascaderOption<T = unknown> {
    value: CascaderValue
    label: string
    children?: CascaderOption<T>[]
    disabled?: boolean
    data?: T
}
