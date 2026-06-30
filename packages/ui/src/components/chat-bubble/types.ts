export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ChatMessage {
    id: string
    content: string
    variant?: 'sent' | 'received' | 'system'
    avatar?: string
    name?: string
    timestamp?: string | Date
    status?: MessageStatus
}
