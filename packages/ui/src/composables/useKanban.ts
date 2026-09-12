import {
    ref,
    readonly,
    toValue,
    watch,
    nextTick,
    getCurrentInstance,
    onUnmounted,
    isRef,
    type Ref,
    type DeepReadonly,
    type MaybeRefOrGetter,
} from 'vue'
import { requestAnimationFrame, cancelAnimationFrame } from '../lib/env'
import type { MoveDirection } from '@/types/common'
import type {
    KanbanColumn,
    KanbanChange,
    KanbanMoveResult,
} from '../lib/kanban-types'
import {
    moveCard as moveCardOp,
    moveCardInColumn as moveCardInColumnOp,
    moveCardToAdjacentColumn as moveCardToAdjacentColumnOp,
    moveColumn as moveColumnOp,
} from '../lib/kanban-operations'

export type {
    KanbanCard,
    KanbanColumn,
    KanbanCardMoveChange,
    KanbanColumnMoveChange,
    KanbanChange,
    KanbanMoveStatus,
    KanbanMoveResult,
} from '../lib/kanban-types'

export interface UseKanbanOptions {
    columns: MaybeRefOrGetter<KanbanColumn[]>
    onColumnsChange?: (nextColumns: KanbanColumn[], change: KanbanChange) => void
    onCardMove?: (cardId: string, fromColumn: string, toColumn: string, index: number) => void
    onColumnMove?: (columnId: string, fromIndex: number, toIndex: number) => void
}

export interface UseKanbanReturn {
    draggingCard: DeepReadonly<Ref<{ cardId: string; fromColumn: string } | null>>
    draggingColumn: Readonly<Ref<string | null>>
    grabbedCard: DeepReadonly<Ref<{ cardId: string; columnId: string } | null>>
    dragOverColumn: Readonly<Ref<string | null>>
    isDragging: Readonly<Ref<boolean>>

    startCardDrag: (cardId: string, fromColumn: string) => void
    endCardDrag: () => void
    setDragOverColumn: (columnId: string | null) => void
    startColumnDrag: (columnId: string) => void
    endColumnDrag: () => void
    grabCard: (cardId: string, columnId: string) => void
    releaseCard: () => void

    moveCard: (cardId: string, toColumnId: string, targetIndex?: number) => KanbanMoveResult
    moveCardInColumn: (cardId: string, columnId: string, direction: MoveDirection) => KanbanMoveResult
    moveCardToAdjacentColumn: (cardId: string, columnId: string, direction: MoveDirection) => KanbanMoveResult
    moveColumn: (fromId: string, toIndexOrId: number | string) => KanbanMoveResult

    onDragStart: (cardId: string, fromColumn: string) => void
    onDragEnd: () => void
    onDragOver: (e: DragEvent, columnId: string) => void
    onDrop: (e: DragEvent, toColumnId: string) => KanbanColumn[] | undefined
    onCardKeydown: (e: KeyboardEvent, cardId: string, columnId: string) => void
}

export function useKanban(options: UseKanbanOptions): UseKanbanReturn {
    const draggingCard = ref<{ cardId: string; fromColumn: string } | null>(null)
    const draggingColumn = ref<string | null>(null)
    const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null)
    const dragOverColumn = ref<string | null>(null)
    const isDragging = ref(false)
    let dragEndRafId: number | null = null

    let batchSnapshot: KanbanColumn[] | null = null
    let batchDrainScheduled = false

    function getWorkingColumns(): KanbanColumn[] {
        return batchSnapshot ?? toValue(options.columns)
    }

    function reconcileState(authoritativeColumns: KanbanColumn[]) {
        if (grabbedCard.value) {
            const { cardId } = grabbedCard.value
            let foundColId: string | null = null
            for (const col of authoritativeColumns) {
                if (col.cards.some((c) => c.id === cardId)) {
                    foundColId = col.id
                    break
                }
            }
            if (foundColId) {
                grabbedCard.value = { cardId, columnId: foundColId }
            } else {
                grabbedCard.value = null
            }
        }

        if (draggingCard.value) {
            const { cardId, fromColumn } = draggingCard.value
            let stillValid = false
            for (const col of authoritativeColumns) {
                if (col.id === fromColumn && col.cards.some((c) => c.id === cardId)) {
                    stillValid = true
                    break
                }
            }
            if (!stillValid) {
                draggingCard.value = null
                dragOverColumn.value = null
                isDragging.value = false
            }
        }

        if (draggingColumn.value) {
            const colId = draggingColumn.value
            if (!authoritativeColumns.some((col) => col.id === colId)) {
                draggingColumn.value = null
            }
        }
    }

    function scheduleBatchReconciliation() {
        if (batchDrainScheduled) return
        batchDrainScheduled = true
        void nextTick().then(() => {
            batchDrainScheduled = false
            batchSnapshot = null
            reconcileState(toValue(options.columns))
        })
    }

    watch(
        () => toValue(options.columns),
        (newColumns) => {
            batchSnapshot = null
            reconcileState(newColumns)
        },
        { deep: true },
    )

    function executeMove(
        operation: (cols: KanbanColumn[]) => KanbanMoveResult,
    ): KanbanMoveResult {
        const current = getWorkingColumns()
        const result = operation(current)
        if (result.status === 'moved') {
            batchSnapshot = result.nextColumns
            scheduleBatchReconciliation()

            if (options.onColumnsChange) {
                options.onColumnsChange(result.nextColumns, result.change)
            } else if (isRef(options.columns)) {
                (options.columns as Ref<KanbanColumn[]>).value = result.nextColumns
            }

            if (result.change.kind === 'card-move') {
                options.onCardMove?.(
                    result.change.cardId,
                    result.change.fromColumn,
                    result.change.toColumn,
                    result.change.toIndex,
                )
                if (grabbedCard.value?.cardId === result.change.cardId) {
                    grabbedCard.value = {
                        cardId: result.change.cardId,
                        columnId: result.change.toColumn,
                    }
                }
            } else if (result.change.kind === 'column-move') {
                options.onColumnMove?.(
                    result.change.columnId,
                    result.change.fromIndex,
                    result.change.toIndex,
                )
            }
        }
        return result
    }

    function startCardDrag(cardId: string, fromColumn: string) {
        if (draggingColumn.value) return
        if (dragEndRafId !== null) {
            cancelAnimationFrame(dragEndRafId)
            dragEndRafId = null
        }
        grabbedCard.value = null
        draggingCard.value = { cardId, fromColumn }
        isDragging.value = true
    }

    function endCardDrag() {
        draggingCard.value = null
        dragOverColumn.value = null
        if (dragEndRafId !== null) {
            cancelAnimationFrame(dragEndRafId)
        }
        dragEndRafId = requestAnimationFrame(() => {
            isDragging.value = false
            dragEndRafId = null
        })
    }

    function setDragOverColumn(columnId: string | null) {
        dragOverColumn.value = columnId
    }

    function startColumnDrag(columnId: string) {
        if (draggingCard.value) return
        grabbedCard.value = null
        draggingColumn.value = columnId
    }

    function endColumnDrag() {
        draggingColumn.value = null
    }

    function grabCard(cardId: string, columnId: string) {
        draggingCard.value = null
        draggingColumn.value = null
        dragOverColumn.value = null
        grabbedCard.value = { cardId, columnId }
    }

    function releaseCard() {
        grabbedCard.value = null
    }

    function moveCard(cardId: string, toColumnId: string, targetIndex?: number): KanbanMoveResult {
        return executeMove((cols) => moveCardOp(cols, cardId, toColumnId, targetIndex))
    }

    function moveCardInColumn(cardId: string, columnId: string, direction: MoveDirection): KanbanMoveResult {
        const dir = typeof direction === 'number' ? direction : (direction === 'down' ? 1 : -1)
        return executeMove((cols) => moveCardInColumnOp(cols, cardId, columnId, dir as -1 | 1))
    }

    function moveCardToAdjacentColumn(cardId: string, columnId: string, direction: MoveDirection): KanbanMoveResult {
        const dir = typeof direction === 'number' ? direction : (direction === 'right' ? 1 : -1)
        const result = executeMove((cols) => moveCardToAdjacentColumnOp(cols, cardId, columnId, dir as -1 | 1))
        if (result.status === 'moved' && result.change.kind === 'card-move') {
            grabbedCard.value = { cardId: result.change.cardId, columnId: result.change.toColumn }
        }
        return result
    }

    function moveColumn(fromId: string, toIndexOrId: number | string): KanbanMoveResult {
        return executeMove((cols) => moveColumnOp(cols, fromId, toIndexOrId))
    }

    function onDragStart(cardId: string, fromColumn: string) {
        startCardDrag(cardId, fromColumn)
    }

    function onDragEnd() {
        endCardDrag()
    }

    function onDragOver(e: DragEvent, columnId: string) {
        if (draggingColumn.value) return
        e.preventDefault()
        setDragOverColumn(columnId)
    }

    function onDrop(e: DragEvent, toColumnId: string): KanbanColumn[] | undefined {
        e.preventDefault()
        if (draggingColumn.value) return
        if (!draggingCard.value) return
        const { cardId } = draggingCard.value

        const columnEl = e.currentTarget
        if (!(columnEl instanceof HTMLElement)) {
            endCardDrag()
            return
        }

        const cardEls = Array.from(columnEl.querySelectorAll('[data-card-id]'))
            .filter((el) => el.getAttribute('data-card-id') !== cardId)
        let insertIndex = cardEls.length
        const mouseY = e.clientY
        for (let i = 0; i < cardEls.length; i++) {
            const rect = cardEls[i]!.getBoundingClientRect()
            if (mouseY < rect.top + rect.height / 2) {
                insertIndex = i
                break
            }
        }

        const result = moveCard(cardId, toColumnId, insertIndex)
        endCardDrag()
        return result.status === 'moved' ? result.nextColumns : undefined
    }

    function onCardKeydown(e: KeyboardEvent, cardId: string, columnId: string) {
        if (e.key === ' ') {
            e.preventDefault()
            if (grabbedCard.value) {
                releaseCard()
            } else {
                grabCard(cardId, columnId)
            }
            return
        }

        if (!grabbedCard.value) return

        if (e.key === 'Escape') {
            releaseCard()
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

    if (getCurrentInstance()) {
        onUnmounted(() => {
            if (dragEndRafId !== null) {
                cancelAnimationFrame(dragEndRafId)
            }
        })
    }

    return {
        draggingCard: readonly(draggingCard),
        draggingColumn: readonly(draggingColumn),
        grabbedCard: readonly(grabbedCard),
        dragOverColumn: readonly(dragOverColumn),
        isDragging: readonly(isDragging),

        startCardDrag,
        endCardDrag,
        setDragOverColumn,
        startColumnDrag,
        endColumnDrag,
        grabCard,
        releaseCard,

        moveCard,
        moveCardInColumn,
        moveCardToAdjacentColumn,
        moveColumn,

        onDragStart,
        onDragEnd,
        onDragOver,
        onDrop,
        onCardKeydown,
    }
}
