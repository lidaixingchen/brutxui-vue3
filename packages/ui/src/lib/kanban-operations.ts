import type { KanbanColumn, KanbanMoveResult } from './kanban-types'

export function moveCard(
    columns: KanbanColumn[],
    cardId: string,
    toColumnId: string,
    targetIndex?: number,
): KanbanMoveResult {
    const sourceColumnIndex = columns.findIndex((col) => col.cards.some((c) => c.id === cardId))
    if (sourceColumnIndex === -1) {
        return { status: 'invalid', reason: 'Card not found' }
    }
    const sourceColumn = columns[sourceColumnIndex]!
    const fromIndex = sourceColumn.cards.findIndex((c) => c.id === cardId)
    const card = sourceColumn.cards[fromIndex]!

    const targetColumnIndex = columns.findIndex((col) => col.id === toColumnId)
    if (targetColumnIndex === -1) {
        return { status: 'invalid', reason: 'Target column not found' }
    }
    const targetColumn = columns[targetColumnIndex]!
    const isSameColumn = sourceColumn.id === targetColumn.id

    if (isSameColumn) {
        const remainingCards = sourceColumn.cards.filter((c) => c.id !== cardId)
        const rawIndex = targetIndex === undefined ? remainingCards.length : targetIndex
        const clampedIndex = Math.max(0, Math.min(rawIndex, remainingCards.length))

        if (fromIndex === clampedIndex) {
            return { status: 'unchanged' }
        }

        const nextCards = [...remainingCards]
        nextCards.splice(clampedIndex, 0, card)

        const nextColumns = columns.map((col, idx) =>
            idx === sourceColumnIndex ? { ...col, cards: nextCards } : col,
        )

        return {
            status: 'moved',
            change: {
                kind: 'card-move',
                cardId,
                fromColumn: sourceColumn.id,
                toColumn: toColumnId,
                fromIndex,
                toIndex: clampedIndex,
            },
            nextColumns,
        }
    }

    const sourceCards = sourceColumn.cards.filter((c) => c.id !== cardId)
    const targetCards = [...targetColumn.cards]
    const rawIndex = targetIndex === undefined ? targetCards.length : targetIndex
    const clampedIndex = Math.max(0, Math.min(rawIndex, targetCards.length))

    targetCards.splice(clampedIndex, 0, card)

    const nextColumns = columns.map((col, idx) => {
        if (idx === sourceColumnIndex) return { ...col, cards: sourceCards }
        if (idx === targetColumnIndex) return { ...col, cards: targetCards }
        return col
    })

    return {
        status: 'moved',
        change: {
            kind: 'card-move',
            cardId,
            fromColumn: sourceColumn.id,
            toColumn: toColumnId,
            fromIndex,
            toIndex: clampedIndex,
        },
        nextColumns,
    }
}

export function moveCardInColumn(
    columns: KanbanColumn[],
    cardId: string,
    columnId: string,
    direction: -1 | 1,
): KanbanMoveResult {
    const col = columns.find((c) => c.id === columnId)
    if (!col) {
        return { status: 'invalid', reason: 'Column not found' }
    }
    const index = col.cards.findIndex((c) => c.id === cardId)
    if (index === -1) {
        return { status: 'invalid', reason: 'Card not found' }
    }
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= col.cards.length) {
        return { status: 'unchanged' }
    }
    return moveCard(columns, cardId, columnId, targetIndex)
}

export function moveCardToAdjacentColumn(
    columns: KanbanColumn[],
    cardId: string,
    currentColumnId: string,
    direction: -1 | 1,
): KanbanMoveResult {
    const colIndex = columns.findIndex((c) => c.id === currentColumnId)
    if (colIndex === -1) {
        return { status: 'invalid', reason: 'Column not found' }
    }
    const currentColumn = columns[colIndex]!
    if (!currentColumn.cards.some((c) => c.id === cardId)) {
        return { status: 'invalid', reason: 'Card not found in current column' }
    }
    const targetColIndex = colIndex + direction
    if (targetColIndex < 0 || targetColIndex >= columns.length) {
        return { status: 'unchanged' }
    }
    const targetColumn = columns[targetColIndex]!
    return moveCard(columns, cardId, targetColumn.id, targetColumn.cards.length)
}

export function moveColumn(
    columns: KanbanColumn[],
    fromId: string,
    toIndexOrId: number | string,
): KanbanMoveResult {
    const fromIndex = columns.findIndex((c) => c.id === fromId)
    if (fromIndex === -1) {
        return { status: 'invalid', reason: 'Column not found' }
    }
    let toIndex: number
    if (typeof toIndexOrId === 'string') {
        toIndex = columns.findIndex((c) => c.id === toIndexOrId)
        if (toIndex === -1) {
            return { status: 'invalid', reason: 'Target column not found' }
        }
    } else {
        toIndex = Math.max(0, Math.min(toIndexOrId, columns.length - 1))
    }
    if (fromIndex === toIndex) {
        return { status: 'unchanged' }
    }

    const nextColumns = [...columns]
    const [moved] = nextColumns.splice(fromIndex, 1)!
    nextColumns.splice(toIndex, 0, moved!)

    return {
        status: 'moved',
        change: {
            kind: 'column-move',
            columnId: fromId,
            fromIndex,
            toIndex,
        },
        nextColumns,
    }
}
