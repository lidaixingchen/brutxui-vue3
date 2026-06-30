export interface ActivityEntry {
    id: string
    action: string
    user: string
    timestamp: string
    details?: string
    type?: 'info' | 'warning' | 'error' | 'success'
}
