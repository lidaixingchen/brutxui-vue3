export type MessageType = 'info' | 'success' | 'warning' | 'error'

export interface MessageItem {
    id: string
    type: MessageType
    title: string
    description?: string
    duration: number
    closable: boolean
}

export interface MessageOptions {
    type?: MessageType
    title?: string
    description?: string
    duration?: number
    closable?: boolean
}

export interface UseMessageReturn {
    info: (title: string, description?: string) => () => void
    success: (title: string, description?: string) => () => void
    warning: (title: string, description?: string) => () => void
    error: (title: string, description?: string) => () => void
    show: (options: MessageOptions) => () => void
}
