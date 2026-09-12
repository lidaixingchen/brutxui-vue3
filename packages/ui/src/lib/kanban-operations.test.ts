import { describe, it, expect } from 'vitest'
import { moveCard, moveCardInColumn, moveCardToAdjacentColumn, moveColumn } from './kanban-operations'
import type { KanbanColumn } from './kanban-types'

function createSampleColumns(): KanbanColumn[] {
    return [
        {
            id: 'col-1',
            title: 'Todo',
            cards: [
                { id: 'c1', title: 'Task 1' },
                { id: 'c2', title: 'Task 2' },
                { id: 'c3', title: 'Task 3' },
            ],
        },
        {
            id: 'col-2',
            title: 'In Progress',
            cards: [
                { id: 'c4', title: 'Task 4' },
            ],
        },
        {
            id: 'col-3',
            title: 'Done',
            cards: [],
        },
    ]
}

describe('kanban-operations', () => {
    describe('moveCard', () => {
        it('moves card within same column', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c1', 'col-1', 2)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.change).toEqual({
                    kind: 'card-move',
                    cardId: 'c1',
                    fromColumn: 'col-1',
                    toColumn: 'col-1',
                    fromIndex: 0,
                    toIndex: 2,
                })
                expect(result.nextColumns[0].cards.map((c) => c.id)).toEqual(['c2', 'c3', 'c1'])
            }
        })

        it('returns unchanged when moving to original position in same column', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c1', 'col-1', 0)
            expect(result.status).toBe('unchanged')
        })

        it('moves card across columns', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c2', 'col-2', 0)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.change).toEqual({
                    kind: 'card-move',
                    cardId: 'c2',
                    fromColumn: 'col-1',
                    toColumn: 'col-2',
                    fromIndex: 1,
                    toIndex: 0,
                })
                expect(result.nextColumns[0].cards.map((c) => c.id)).toEqual(['c1', 'c3'])
                expect(result.nextColumns[1].cards.map((c) => c.id)).toEqual(['c2', 'c4'])
            }
        })

        it('moves card to empty column', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c1', 'col-3', 0)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.nextColumns[2].cards.map((c) => c.id)).toEqual(['c1'])
            }
        })

        it('clamps targetIndex if out of bounds', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c1', 'col-2', 99)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.change.toIndex).toBe(1)
                expect(result.nextColumns[1].cards.map((c) => c.id)).toEqual(['c4', 'c1'])
            }
        })

        it('returns invalid if card does not exist', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'non-existent', 'col-1', 0)
            expect(result.status).toBe('invalid')
        })

        it('returns invalid if target column does not exist', () => {
            const columns = createSampleColumns()
            const result = moveCard(columns, 'c1', 'non-existent', 0)
            expect(result.status).toBe('invalid')
        })
    })

    describe('moveCardInColumn', () => {
        it('moves card down in column', () => {
            const columns = createSampleColumns()
            const result = moveCardInColumn(columns, 'c1', 'col-1', 1)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.nextColumns[0].cards.map((c) => c.id)).toEqual(['c2', 'c1', 'c3'])
            }
        })

        it('returns unchanged when moving past edge', () => {
            const columns = createSampleColumns()
            const result = moveCardInColumn(columns, 'c1', 'col-1', -1)
            expect(result.status).toBe('unchanged')
        })
    })

    describe('moveCardToAdjacentColumn', () => {
        it('moves card to right column placing at end', () => {
            const columns = createSampleColumns()
            const result = moveCardToAdjacentColumn(columns, 'c1', 'col-1', 1)
            expect(result.status).toBe('moved')
            if (result.status === 'moved' && result.change.kind === 'card-move') {
                expect(result.change.toColumn).toBe('col-2')
                expect(result.nextColumns[1].cards.map((c) => c.id)).toEqual(['c4', 'c1'])
            }
        })

        it('returns unchanged when moving past rightmost boundary', () => {
            const columns = createSampleColumns()
            const moveRes = moveCardToAdjacentColumn(columns, 'c4', 'col-2', 1)
            expect(moveRes.status).toBe('moved')
            if (moveRes.status === 'moved') {
                const lastColResult = moveCardToAdjacentColumn(moveRes.nextColumns, 'c4', 'col-3', 1)
                expect(lastColResult.status).toBe('unchanged')
            }
        })
    })

    describe('moveColumn', () => {
        it('moves column by index', () => {
            const columns = createSampleColumns()
            const result = moveColumn(columns, 'col-1', 2)
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.nextColumns.map((col) => col.id)).toEqual(['col-2', 'col-3', 'col-1'])
            }
        })

        it('moves column by target column id', () => {
            const columns = createSampleColumns()
            const result = moveColumn(columns, 'col-1', 'col-2')
            expect(result.status).toBe('moved')
            if (result.status === 'moved') {
                expect(result.nextColumns.map((col) => col.id)).toEqual(['col-2', 'col-1', 'col-3'])
            }
        })

        it('returns unchanged when target position is same', () => {
            const columns = createSampleColumns()
            const result = moveColumn(columns, 'col-1', 0)
            expect(result.status).toBe('unchanged')
        })
    })
})
