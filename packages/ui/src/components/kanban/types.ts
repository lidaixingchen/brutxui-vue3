export interface KanbanCard {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    color?: string;
}

export interface KanbanColumn {
    id: string;
    title: string;
    color?: string;
    cards: KanbanCard[];
}
