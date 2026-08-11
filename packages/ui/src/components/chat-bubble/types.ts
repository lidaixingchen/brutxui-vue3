export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

/**
 * 聊天消息数据。
 *
 * 该结构是纯数据 DTO（通常直接来自接口），刻意保持平铺而非按 variant 拆成可辨识联合：
 * 类型系统不约束「system 携带 status」等非法组合，改由文档与渲染逻辑兜底
 * （status 仅对 `variant === 'sent'` 渲染；received/system 忽略 color 与 status）。
 */
export interface ChatMessage {
    id: string
    content: string
    /** 消息角色，默认 'received' */
    variant?: 'sent' | 'received' | 'system'
    /** 头像图片 URL；加载失败时回退为首字母缩写 */
    avatar?: string
    /** 发送者姓名，用于展示名称与生成首字母缩写 */
    name?: string
    /**
     * 时间戳。
     * - `string`：按原样直接展示（不做格式化，传入方负责提供展示格式）；
     * - `Date`：按 `dateFormat` 或 `toLocaleString` 格式化。
     */
    timestamp?: string | Date
    /**
     * 消息状态，**仅对 `variant === 'sent'` 生效**；received/system 携带时会被静默忽略。
     */
    status?: MessageStatus
}
