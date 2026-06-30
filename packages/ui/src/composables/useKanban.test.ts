import { ref, toValue } from 'vue'
import { useKanban, type KanbanCard, type KanbanColumn } from './useKanban'

function createCard(id: string, title = `Card ${id}`): KanbanCard {
    return { id, title }
}

function createColumn(id: string, title = `Column ${id}`, cards: KanbanCard[] = []): KanbanColumn {
    return { id, title, cards }
}

function createDefaultColumns(): KanbanColumn[] {
    return [
        createColumn('todo', 'To Do', [createCard('a', 'Card A'), createCard('b', 'Card B'), createCard('c', 'Card C')]),
        createColumn('doing', 'Doing', [createCard('d', 'Card D')]),
        createColumn('done', 'Done', []),
    ]
}

function createKanban(options: Partial<Parameters<typeof useKanban>[0]> = {}) {
    const columns = ref<KanbanColumn[]>(toValue(options.columns) ?? createDefaultColumns())
    return useKanban({
        columns,
        ...options,
    })
}

describe('useKanban', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('initial state', () => {
        it('has correct initial values', () => {
            const { draggingCard, draggingColumn, grabbedCard, dragOverColumn, isDragging } = createKanban()
            expect(draggingCard.value).toBeNull()
            expect(draggingColumn.value).toBeNull()
            expect(grabbedCard.value).toBeNull()
            expect(dragOverColumn.value).toBeNull()
            expect(isDragging.value).toBe(false)
        })
    })

    describe('onDragStart', () => {
        it('sets draggingCard and isDragging', () => {
            const { draggingCard, isDragging, onDragStart } = createKanban()
            onDragStart('a', 'todo')
            expect(draggingCard.value).toEqual({ cardId: 'a', fromColumn: 'todo' })
            expect(isDragging.value).toBe(true)
        })

        it('does nothing when draggingColumn is set', () => {
            const { draggingCard, isDragging, draggingColumn, onDragStart } = createKanban()
            draggingColumn.value = 'todo'
            onDragStart('a', 'todo')
            expect(draggingCard.value).toBeNull()
            expect(isDragging.value).toBe(false)
        })
    })

    describe('onDragEnd', () => {
        it('resets draggingCard and dragOverColumn', () => {
            const { draggingCard, dragOverColumn, onDragStart, onDragEnd } = createKanban()
            onDragStart('a', 'todo')
            onDragEnd()
            expect(draggingCard.value).toBeNull()
            expect(dragOverColumn.value).toBeNull()
        })

        it('resets isDragging after requestAnimationFrame', () => {
            const { isDragging, onDragStart, onDragEnd } = createKanban()
            onDragStart('a', 'todo')
            expect(isDragging.value).toBe(true)
            onDragEnd()
            expect(isDragging.value).toBe(true)
            // Flush requestAnimationFrame
            vi.runAllTimers()
            expect(isDragging.value).toBe(false)
        })
    })

    describe('onDragOver', () => {
        it('sets dragOverColumn and calls preventDefault', () => {
            const { dragOverColumn, onDragOver } = createKanban()
            const preventDefault = vi.fn()
            const event = { preventDefault } as unknown as DragEvent
            onDragOver(event, 'doing')
            expect(dragOverColumn.value).toBe('doing')
            expect(preventDefault).toHaveBeenCalled()
        })

        it('does nothing when draggingColumn is set', () => {
            const { dragOverColumn, draggingColumn, onDragOver } = createKanban()
            draggingColumn.value = 'todo'
            const preventDefault = vi.fn()
            const event = { preventDefault } as unknown as DragEvent
            onDragOver(event, 'doing')
            expect(dragOverColumn.value).toBeNull()
            expect(preventDefault).not.toHaveBeenCalled()
        })
    })

    describe('onDrop', () => {
        function createCardElement(cardId: string, rect: { top: number; height: number }) {
            const el = document.createElement('div')
            el.setAttribute('data-card-id', cardId)
            el.getBoundingClientRect = () => rect as DOMRect
            return el
        }

        function createDropEvent(clientY: number, cardElements: Array<{ cardId: string; rect: { top: number; height: number } }> = []) {
            const currentTarget = document.createElement('div')
            const cardEls = cardElements.map(({ cardId, rect }) => createCardElement(cardId, rect))
            currentTarget.querySelectorAll = () => cardEls as unknown as NodeListOf<Element>
            return {
                clientY,
                currentTarget,
            } as unknown as DragEvent
        }

        it('does nothing when draggingColumn is set', () => {
            const { draggingColumn, onDragStart, onDrop } = createKanban()
            draggingColumn.value = 'todo'
            onDragStart('a', 'todo')
            const event = createDropEvent(100)
            const result = onDrop(event, 'doing')
            expect(result).toBeUndefined()
        })

        it('does nothing when no card is being dragged', () => {
            const { onDrop } = createKanban()
            const event = createDropEvent(100)
            const result = onDrop(event, 'doing')
            expect(result).toBeUndefined()
        })

        it('resets when source card not found', () => {
            const columns = ref<KanbanColumn[]>([createColumn('todo', 'To Do', [])])
            const { draggingCard, dragOverColumn, onDragStart, onDrop } = useKanban({ columns })
            onDragStart('nonexistent', 'todo')
            const event = createDropEvent(100)
            onDrop(event, 'doing')
            expect(draggingCard.value).toBeNull()
            expect(dragOverColumn.value).toBeNull()
        })

        it('returns undefined when currentTarget is not HTMLElement', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            const event = { clientY: 100, currentTarget: {} } as unknown as DragEvent
            const result = onDrop(event, 'doing')
            expect(result).toBeUndefined()
        })

        it('moves card to empty column', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            const event = createDropEvent(100)
            const result = onDrop(event, 'done')
            expect(result).toBeDefined()
            expect(result![2].cards).toHaveLength(1)
            expect(result![2].cards[0].id).toBe('a')
            expect(result![0].cards).toHaveLength(2)
        })

        it('moves card to specific position based on mouse Y', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b')]),
                createColumn('doing', 'Doing', [createCard('d'), createCard('e')]),
            ])
            const { onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            // Mouse Y is above first card (index 0)
            const event = createDropEvent(50, [
                { cardId: 'd', rect: { top: 100, height: 40 } },
                { cardId: 'e', rect: { top: 150, height: 40 } },
            ])
            const result = onDrop(event, 'doing')
            expect(result).toBeDefined()
            expect(result![1].cards[0].id).toBe('a')
        })

        it('inserts at end when mouse Y is below all cards', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a')]),
                createColumn('doing', 'Doing', [createCard('d'), createCard('e')]),
            ])
            const { onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            const event = createDropEvent(300, [
                { cardId: 'd', rect: { top: 100, height: 40 } },
                { cardId: 'e', rect: { top: 150, height: 40 } },
            ])
            const result = onDrop(event, 'doing')
            expect(result).toBeDefined()
            expect(result![1].cards[2].id).toBe('a')
        })

        it('handles same column move with index adjustment', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b'), createCard('c')]),
            ])
            const { onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            // Move card 'a' (index 0) to position below card 'b' (index 2)
            const event = createDropEvent(200, [
                { cardId: 'a', rect: { top: 100, height: 40 } },
                { cardId: 'b', rect: { top: 150, height: 40 } },
                { cardId: 'c', rect: { top: 200, height: 40 } },
            ])
            const result = onDrop(event, 'todo')
            expect(result).toBeDefined()
            expect(result![0].cards.map((c: KanbanCard) => c.id)).toEqual(['b', 'a', 'c'])
        })

        it('resets draggingCard and dragOverColumn after drop', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { draggingCard, dragOverColumn, onDragStart, onDrop } = useKanban({ columns })
            onDragStart('a', 'todo')
            const event = createDropEvent(100)
            onDrop(event, 'done')
            expect(draggingCard.value).toBeNull()
            expect(dragOverColumn.value).toBeNull()
        })

        it('calls onCardMove callback', () => {
            const onCardMove = vi.fn()
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { onDragStart, onDrop } = useKanban({ columns, onCardMove })
            onDragStart('a', 'todo')
            const event = createDropEvent(100)
            onDrop(event, 'done')
            expect(onCardMove).toHaveBeenCalledWith('a', 'todo', 'done', 0)
        })

        it('does not call onCardMove when card not found', () => {
            const onCardMove = vi.fn()
            const columns = ref<KanbanColumn[]>([createColumn('todo', 'To Do', [])])
            const { onDragStart, onDrop } = useKanban({ columns, onCardMove })
            onDragStart('nonexistent', 'todo')
            const event = createDropEvent(100)
            onDrop(event, 'doing')
            expect(onCardMove).not.toHaveBeenCalled()
        })
    })

    describe('moveCardInColumn', () => {
        it('moves card up', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b'), createCard('c')]),
            ])
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('b', 'todo', -1)
            expect(result).toBeDefined()
            expect(result![0].cards.map((c: KanbanCard) => c.id)).toEqual(['b', 'a', 'c'])
        })

        it('moves card down', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b'), createCard('c')]),
            ])
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('b', 'todo', 1)
            expect(result).toBeDefined()
            expect(result![0].cards.map((c: KanbanCard) => c.id)).toEqual(['a', 'c', 'b'])
        })

        it('returns undefined when column not found', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('a', 'nonexistent', -1)
            expect(result).toBeUndefined()
        })

        it('returns undefined when card not found', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('nonexistent', 'todo', -1)
            expect(result).toBeUndefined()
        })

        it('returns undefined when moving past start boundary', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('a', 'todo', -1)
            expect(result).toBeUndefined()
        })

        it('returns undefined when moving past end boundary', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardInColumn } = useKanban({ columns })
            const result = moveCardInColumn('c', 'todo', 1)
            expect(result).toBeUndefined()
        })

        it('does not mutate original columns', () => {
            const cols = createDefaultColumns()
            const columns = ref<KanbanColumn[]>(cols)
            const { moveCardInColumn } = useKanban({ columns })
            moveCardInColumn('b', 'todo', -1)
            expect(cols[0].cards.map(c => c.id)).toEqual(['a', 'b', 'c'])
        })
    })

    describe('moveCardToAdjacentColumn', () => {
        it('moves card to the right column', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('a', 'todo', 1)
            expect(result).toBeDefined()
            expect(result![0].cards).toHaveLength(2)
            expect(result![1].cards).toHaveLength(2)
            expect(result![1].cards[1].id).toBe('a')
        })

        it('moves card to the left column', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('d', 'doing', -1)
            expect(result).toBeDefined()
            expect(result![0].cards).toHaveLength(4)
            expect(result![1].cards).toHaveLength(0)
        })

        it('returns undefined when column not found', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('a', 'nonexistent', 1)
            expect(result).toBeUndefined()
        })

        it('returns undefined when moving past left boundary', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('a', 'todo', -1)
            expect(result).toBeUndefined()
        })

        it('returns undefined when moving past right boundary', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('d', 'done', 1) // done is last, d is not in done but test boundary
            expect(result).toBeUndefined()
        })

        it('returns undefined when card not found in column', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            const result = moveCardToAdjacentColumn('nonexistent', 'todo', 1)
            expect(result).toBeUndefined()
        })

        it('calls onCardMove callback', () => {
            const onCardMove = vi.fn()
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns, onCardMove })
            moveCardToAdjacentColumn('a', 'todo', 1)
            expect(onCardMove).toHaveBeenCalledWith('a', 'todo', 'doing', 1)
        })

        it('updates grabbedCard to new column', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { grabbedCard, moveCardToAdjacentColumn } = useKanban({ columns })
            moveCardToAdjacentColumn('a', 'todo', 1)
            expect(grabbedCard.value).toEqual({ cardId: 'a', columnId: 'doing' })
        })

        it('does not mutate original columns', () => {
            const cols = createDefaultColumns()
            const columns = ref<KanbanColumn[]>(cols)
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            moveCardToAdjacentColumn('a', 'todo', 1)
            expect(cols[0].cards).toHaveLength(3)
            expect(cols[1].cards).toHaveLength(1)
        })
    })

    describe('moveColumn', () => {
        it('moves column from left to right', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns })
            const result = moveColumn('todo', 'done')
            expect(result).toBeDefined()
            expect(result!.map(c => c.id)).toEqual(['doing', 'done', 'todo'])
        })

        it('moves column from right to left', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns })
            const result = moveColumn('done', 'todo')
            expect(result).toBeDefined()
            expect(result!.map(c => c.id)).toEqual(['done', 'todo', 'doing'])
        })

        it('returns undefined when fromId not found', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns })
            const result = moveColumn('nonexistent', 'todo')
            expect(result).toBeUndefined()
        })

        it('returns undefined when toId not found', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns })
            const result = moveColumn('todo', 'nonexistent')
            expect(result).toBeUndefined()
        })

        it('calls onColumnMove callback', () => {
            const onColumnMove = vi.fn()
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns, onColumnMove })
            moveColumn('todo', 'done')
            expect(onColumnMove).toHaveBeenCalledWith('todo', 0, 2)
        })

        it('does not call onColumnMove when column not found', () => {
            const onColumnMove = vi.fn()
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns, onColumnMove })
            moveColumn('nonexistent', 'todo')
            expect(onColumnMove).not.toHaveBeenCalled()
        })

        it('does not mutate original columns', () => {
            const cols = createDefaultColumns()
            const columns = ref<KanbanColumn[]>(cols)
            const { moveColumn } = useKanban({ columns })
            moveColumn('todo', 'done')
            expect(cols.map(c => c.id)).toEqual(['todo', 'doing', 'done'])
        })
    })

    describe('onCardKeydown', () => {
        function createKeyEvent(key: string): KeyboardEvent {
            return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent
        }

        it('toggles grabbedCard on Space key', () => {
            const { grabbedCard, onCardKeydown } = createKanban()
            const e = createKeyEvent(' ')
            onCardKeydown(e, 'a', 'todo')
            expect(grabbedCard.value).toEqual({ cardId: 'a', columnId: 'todo' })
            expect(e.preventDefault).toHaveBeenCalled()
        })

        it('ungrab on second Space press', () => {
            const { grabbedCard, onCardKeydown } = createKanban()
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            expect(grabbedCard.value).toEqual({ cardId: 'a', columnId: 'todo' })
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            expect(grabbedCard.value).toBeNull()
        })

        it('does nothing on other keys when not grabbed', () => {
            const { grabbedCard, onCardKeydown } = createKanban()
            onCardKeydown(createKeyEvent('ArrowUp'), 'a', 'todo')
            expect(grabbedCard.value).toBeNull()
        })

        it('ungrab on Escape key', () => {
            const { grabbedCard, onCardKeydown } = createKanban()
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            expect(grabbedCard.value).not.toBeNull()
            onCardKeydown(createKeyEvent('Escape'), 'a', 'todo')
            expect(grabbedCard.value).toBeNull()
        })

        it('moves card up with ArrowUp', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b')]),
            ])
            const { onCardKeydown } = useKanban({ columns })
            onCardKeydown(createKeyEvent(' '), 'b', 'todo')
            const e = createKeyEvent('ArrowUp')
            onCardKeydown(e, 'b', 'todo')
            expect(e.preventDefault).toHaveBeenCalled()
        })

        it('moves card down with ArrowDown', () => {
            const columns = ref<KanbanColumn[]>([
                createColumn('todo', 'To Do', [createCard('a'), createCard('b')]),
            ])
            const { onCardKeydown } = useKanban({ columns })
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            const e = createKeyEvent('ArrowDown')
            onCardKeydown(e, 'a', 'todo')
            expect(e.preventDefault).toHaveBeenCalled()
        })

        it('moves card left with ArrowLeft', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { onCardKeydown } = useKanban({ columns })
            onCardKeydown(createKeyEvent(' '), 'd', 'doing')
            const e = createKeyEvent('ArrowLeft')
            onCardKeydown(e, 'd', 'doing')
            expect(e.preventDefault).toHaveBeenCalled()
        })

        it('moves card right with ArrowRight', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { onCardKeydown } = useKanban({ columns })
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            const e = createKeyEvent('ArrowRight')
            onCardKeydown(e, 'a', 'todo')
            expect(e.preventDefault).toHaveBeenCalled()
        })

        it('ignores non-handled keys when grabbed', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { grabbedCard, onCardKeydown } = useKanban({ columns })
            onCardKeydown(createKeyEvent(' '), 'a', 'todo')
            const before = grabbedCard.value
            onCardKeydown(createKeyEvent('Enter'), 'a', 'todo')
            expect(grabbedCard.value).toEqual(before)
        })
    })

    describe('optional callbacks', () => {
        it('works without onCardMove callback', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveCardToAdjacentColumn } = useKanban({ columns })
            expect(() => moveCardToAdjacentColumn('a', 'todo', 1)).not.toThrow()
        })

        it('works without onColumnMove callback', () => {
            const columns = ref<KanbanColumn[]>(createDefaultColumns())
            const { moveColumn } = useKanban({ columns })
            expect(() => moveColumn('todo', 'done')).not.toThrow()
        })
    })
})
