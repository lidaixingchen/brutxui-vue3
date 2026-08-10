import { type Ref, ref, readonly, onUnmounted, type DeepReadonly } from 'vue'
import { requestAnimationFrame, cancelAnimationFrame } from '../lib/env'
import type { MoveDirection } from '@/types'

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

export interface UseKanbanReturn {
    /** 只读视图：拖拽状态由 onDragStart/onDragEnd/onDragOver/onDrop 等维护 */
    draggingCard: DeepReadonly<Ref<{ cardId: string; fromColumn: string } | null>>
    draggingColumn: Readonly<Ref<string | null>>
    grabbedCard: DeepReadonly<Ref<{ cardId: string; columnId: string } | null>>
    dragOverColumn: Readonly<Ref<string | null>>
    isDragging: Readonly<Ref<boolean>>
    onDragStart: (cardId: string, fromColumn: string) => void
    onDragEnd: () => void
    onDragOver: (e: DragEvent, columnId: string) => void
    onDrop: (e: DragEvent, toColumnId: string) => KanbanColumn[] | undefined
    onCardKeydown: (e: KeyboardEvent, cardId: string, columnId: string) => void
    moveCardInColumn: (cardId: string, columnId: string, direction: MoveDirection) => KanbanColumn[] | undefined
    moveCardToAdjacentColumn: (cardId: string, columnId: string, direction: MoveDirection) => KanbanColumn[] | undefined
    moveColumn: (fromId: string, toId: string) => KanbanColumn[] | undefined
}

export function useKanban(options: UseKanbanOptions): UseKanbanReturn {
    const draggingCard = ref<{ cardId: string; fromColumn: string } | null>(null)
    const draggingColumn = ref<string | null>(null)
    const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null)
    const dragOverColumn = ref<string | null>(null)
    const isDragging = ref(false)
    let dragEndRafId: number | null = null

    function onDragStart(cardId: string, fromColumn: string) {
        if (draggingColumn.value) return
        if (dragEndRafId !== null) {
            cancelAnimationFrame(dragEndRafId)
            dragEndRafId = null
        }
        // 鼠标拖拽与键盘抓取互斥：开始拖拽时清掉键盘抓取态，避免残留干扰后续键盘操作
        grabbedCard.value = null
        draggingCard.value = { cardId, fromColumn }
        isDragging.value = true
    }

    function onDragEnd() {
        grabbedCard.value = null
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

    onUnmounted(() => {
        if (dragEndRafId !== null) {
            cancelAnimationFrame(dragEndRafId)
        }
    })

    function onDragOver(e: DragEvent, columnId: string) {
        if (draggingColumn.value) return
        e.preventDefault()
        dragOverColumn.value = columnId
    }

    function onDrop(e: DragEvent, toColumnId: string) {
        // drop 事件默认行为（拖拽链接/文本时可能触发导航或文本插入）需被阻止，
        // 与 onDragOver 中的 preventDefault 保持一致
        e.preventDefault()
        if (draggingColumn.value) return
        if (!draggingCard.value) return
        // 目标列不存在时清理拖拽状态，避免卡片只从源列移除而静默丢失
        if (!options.columns.value.some((col) => col.id === toColumnId)) {
            draggingCard.value = null
            dragOverColumn.value = null
            return
        }
        const { cardId, fromColumn } = draggingCard.value

        const sourceColumn = options.columns.value.find((col) => col.id === fromColumn)
        const card = sourceColumn?.cards.find((c) => c.id === cardId)
        if (!sourceColumn || !card) {
            draggingCard.value = null
            dragOverColumn.value = null
            return
        }

        const columnEl = e.currentTarget
        if (!(columnEl instanceof HTMLElement)) {
            // 无法计算插入位置时同样清理拖拽状态，避免状态残留
            draggingCard.value = null
            dragOverColumn.value = null
            return
        }
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

        // 实际插入位置：同列向下移动时源卡片移除会让后续元素前移一位，
        // 统一在 map 前计算，onCardMove 收到与最终数组顺序一致的位置（跨列时即 insertIndex）
        const isSameColumn = fromColumn === toColumnId
        let adjustedIndex = insertIndex
        if (isSameColumn) {
            const originalIndex = sourceColumn.cards.findIndex((c) => c.id === cardId)
            if (originalIndex !== -1 && originalIndex < insertIndex) {
                adjustedIndex = insertIndex - 1
            }
        }

        const newColumns = options.columns.value.map((col) => {
            if (col.id === toColumnId) {
                const newCards = col.cards.filter((c) => c.id !== cardId)
                newCards.splice(adjustedIndex, 0, card)
                return { ...col, cards: newCards }
            }
            if (col.id === fromColumn) {
                return { ...col, cards: col.cards.filter((c) => c.id !== cardId) }
            }
            return col
        })

        options.columns.value = newColumns
        options.onCardMove?.(cardId, fromColumn, toColumnId, adjustedIndex)
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

    function moveCardInColumn(cardId: string, columnId: string, direction: MoveDirection) {
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
        options.columns.value = newColumns
        // 与 onDrop / moveCardToAdjacentColumn 一致，通知外部持久化列内排序
        options.onCardMove?.(cardId, columnId, columnId, newIndex)
        return newColumns
    }

    function moveCardToAdjacentColumn(cardId: string, columnId: string, direction: MoveDirection) {
        const colIndex = options.columns.value.findIndex(c => c.id === columnId)
        if (colIndex === -1) return
        const newColIndex = colIndex + direction
        if (newColIndex < 0 || newColIndex >= options.columns.value.length) return

        const col = options.columns.value[colIndex]
        const card = col.cards.find(c => c.id === cardId)
        if (!card) return

        const targetColumnId = options.columns.value[newColIndex].id
        const targetIndex = options.columns.value[newColIndex].cards.length

        const newColumns = options.columns.value.map((c, i) => {
            if (i === colIndex) {
                return { ...c, cards: c.cards.filter(cc => cc.id !== cardId) }
            }
            if (i === newColIndex) {
                return { ...c, cards: [...c.cards, card] }
            }
            return c
        })

        options.columns.value = newColumns
        options.onCardMove?.(cardId, columnId, targetColumnId, targetIndex)
        grabbedCard.value = { cardId, columnId: targetColumnId }
        return newColumns
    }

    function moveColumn(fromId: string, toId: string) {
        const fromIndex = options.columns.value.findIndex(c => c.id === fromId)
        const toIndex = options.columns.value.findIndex(c => c.id === toId)
        if (fromIndex === -1 || toIndex === -1) return

        const newColumns = [...options.columns.value]
        const [moved] = newColumns.splice(fromIndex, 1)
        newColumns.splice(toIndex, 0, moved)

        options.columns.value = newColumns
        options.onColumnMove?.(fromId, fromIndex, toIndex)
        return newColumns
    }

    return {
        draggingCard: readonly(draggingCard),
        draggingColumn: readonly(draggingColumn),
        grabbedCard: readonly(grabbedCard),
        dragOverColumn: readonly(dragOverColumn),
        isDragging: readonly(isDragging),
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
