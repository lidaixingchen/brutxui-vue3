import { type Ref, ref } from 'vue'

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

export interface UseKanbanOptions {
    columns: Ref<KanbanColumn[]>
    onCardMove?: (cardId: string, fromColumn: string, toColumn: string, index: number) => void
    onColumnMove?: (columnId: string, fromIndex: number, toIndex: number) => void
}

export function useKanban(options: UseKanbanOptions) {
    const draggingCard = ref<{ cardId: string; fromColumn: string } | null>(null)
    const draggingColumn = ref<string | null>(null)
    const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null)
    const dragOverColumn = ref<string | null>(null)
    const isDragging = ref(false)

    function onDragStart(cardId: string, fromColumn: string) {
        if (draggingColumn.value) return
        draggingCard.value = { cardId, fromColumn }
        isDragging.value = true
    }

    function onDragEnd() {
        draggingCard.value = null
        dragOverColumn.value = null
        requestAnimationFrame(() => { isDragging.value = false })
    }

    function onDragOver(e: DragEvent, columnId: string) {
        if (draggingColumn.value) return
        e.preventDefault()
        dragOverColumn.value = columnId
    }

    function onDrop(e: DragEvent, toColumnId: string) {
        if (draggingColumn.value) return
        if (!draggingCard.value) return
        const { cardId, fromColumn } = draggingCard.value

        const sourceColumn = options.columns.value.find((col) => col.id === fromColumn)
        const card = sourceColumn?.cards.find((c) => c.id === cardId)
        if (!card) {
            draggingCard.value = null
            dragOverColumn.value = null
            return
        }

        const columnEl = e.currentTarget
        if (!(columnEl instanceof HTMLElement)) return
        const cardEls = Array.from(columnEl.querySelectorAll('[data-card-id]'))
        let insertIndex = cardEls.length
        const mouseY = e.clientY
        for (let i = 0; i < cardEls.length; i++) {
            const rect = cardEls[i].getBoundingClientRect()
            if (mouseY < rect.top + rect.height / 2) {
                insertIndex = i
                break
            }
        }

        const isSameColumn = fromColumn === toColumnId
        const newColumns = options.columns.value.map((col) => {
            if (col.id === toColumnId) {
                const newCards = col.cards.filter((c) => c.id !== cardId)
                let adjustedIndex = insertIndex
                if (isSameColumn) {
                    const originalIndex = col.cards.findIndex((c) => c.id === cardId)
                    if (originalIndex !== -1 && originalIndex < insertIndex) {
                        adjustedIndex = insertIndex - 1
                    }
                }
                newCards.splice(adjustedIndex, 0, card)
                return { ...col, cards: newCards }
            }
            if (col.id === fromColumn) {
                return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
            }
            return col
        })

        options.onCardMove?.(cardId, fromColumn, toColumnId, insertIndex)
        draggingCard.value = null
        dragOverColumn.value = null
        return newColumns
    }

    function onCardKeydown(e: KeyboardEvent, cardId: string, columnId: string) {
        if (e.key === ' ') {
            e.preventDefault()
            grabbedCard.value = grabbedCard.value ? null : { cardId, columnId }
            return
        }

        if (!grabbedCard.value) return

        if (e.key === 'Escape') {
            grabbedCard.value = null
            return
        }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            moveCardInColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowUp' ? -1 : 1)
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            moveCardToAdjacentColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowLeft' ? -1 : 1)
        }
    }

    function moveCardInColumn(cardId: string, columnId: string, direction: number) {
        const col = options.columns.value.find(c => c.id === columnId)
        if (!col) return
        const index = col.cards.findIndex(c => c.id === cardId)
        if (index === -1) return
        const newIndex = index + direction
        if (newIndex < 0 || newIndex >= col.cards.length) return

        const newColumns = options.columns.value.map(c => {
            if (c.id !== columnId) return c
            const newCards = [...c.cards]
            const [moved] = newCards.splice(index, 1)
            newCards.splice(newIndex, 0, moved)
            return { ...c, cards: newCards }
        })
        return newColumns
    }

    function moveCardToAdjacentColumn(cardId: string, columnId: string, direction: number) {
        const colIndex = options.columns.value.findIndex(c => c.id === columnId)
        if (colIndex === -1) return
        const newColIndex = colIndex + direction
        if (newColIndex < 0 || newColIndex >= options.columns.value.length) return

        const col = options.columns.value[colIndex]
        const card = col.cards.find(c => c.id === cardId)
        if (!card) return

        const newColumns = options.columns.value.map((c, i) => {
            if (i === colIndex) {
                return { ...c, cards: c.cards.filter(cc => cc.id !== cardId) }
            }
            if (i === newColIndex) {
                return { ...c, cards: [...c.cards, card] }
            }
            return c
        })

        options.onCardMove?.(cardId, columnId, options.columns.value[newColIndex].id, options.columns.value[newColIndex].cards.length)
        grabbedCard.value = { cardId, columnId: options.columns.value[newColIndex].id }
        return newColumns
    }

    function moveColumn(fromId: string, toId: string) {
        const fromIndex = options.columns.value.findIndex(c => c.id === fromId)
        const toIndex = options.columns.value.findIndex(c => c.id === toId)
        if (fromIndex === -1 || toIndex === -1) return

        const newColumns = [...options.columns.value]
        const [moved] = newColumns.splice(fromIndex, 1)
        newColumns.splice(toIndex, 0, moved)

        options.onColumnMove?.(fromId, fromIndex, toIndex)
        return newColumns
    }

    return {
        draggingCard,
        draggingColumn,
        grabbedCard,
        dragOverColumn,
        isDragging,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDrop,
        onCardKeydown,
        moveCardInColumn,
        moveCardToAdjacentColumn,
        moveColumn,
    }
}
