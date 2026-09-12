export interface KanbanCard {
    id: string
    title: string
    description?: string
    tags?: string[]
    color?: string
}

export interface KanbanColumn {
    id: string
    title: string
    color?: string
    cards: KanbanCard[]
}

export interface KanbanCardMoveChange {
    kind: 'card-move'
    cardId: string
    fromColumn: string
    toColumn: string
    fromIndex: number
    toIndex: number
}

export interface KanbanColumnMoveChange {
    kind: 'column-move'
    columnId: string
    fromIndex: number
    toIndex: number
}

export type KanbanChange = KanbanCardMoveChange | KanbanColumnMoveChange

export type KanbanMoveStatus = 'moved' | 'unchanged' | 'invalid'

export type KanbanMoveResult =
    | { status: 'moved'; change: KanbanChange; nextColumns: KanbanColumn[] }
    | { status: 'unchanged' }
    | { status: 'invalid'; reason: string }
