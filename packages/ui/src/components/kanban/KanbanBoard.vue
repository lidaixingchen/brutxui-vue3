<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Plus } from '@lucide/vue'
import { getDocument } from '@/lib/env'
import { cn } from '@/lib/utils'
import { useLocale } from '@/composables/useLocale'
import { useKanban } from '@/composables/useKanban'
import { iconSizeVariants } from '@/lib/icon-size-variants'
import { kanbanColumnVariants, kanbanCardVariants, kanbanColumnHeaderVariants } from './kanban-variants'
import Button from '../button/Button.vue'
import type { KanbanCard, KanbanColumn, KanbanMoveResult } from './types'

export type { KanbanCard, KanbanColumn }

interface KanbanBoardProps {
    modelValue: KanbanColumn[]
    class?: string
}

const props = defineProps<KanbanBoardProps>()

const emit = defineEmits<{
    'update:modelValue': [columns: KanbanColumn[]]
    'card-move': [cardId: string, fromColumn: string, toColumn: string]
    'card-click': [card: KanbanCard, columnId: string]
    'column-move': [columnId: string, fromIndex: number, toIndex: number]
    'add-card': [columnId: string]
}>()

const { t } = useLocale()

const kanban = useKanban({
    columns: () => props.modelValue,
    onColumnsChange(nextColumns, change) {
        emit('update:modelValue', nextColumns)
        if (change.kind === 'card-move') {
            emit('card-move', change.cardId, change.fromColumn, change.toColumn)
        } else if (change.kind === 'column-move') {
            emit('column-move', change.columnId, change.fromIndex, change.toIndex)
        }
    },
})

const boardRef = ref<HTMLElement | null>(null)
const columns = computed(() => props.modelValue)
const dragOverColumnHeader = ref<string | null>(null)
const ariaLiveMessage = ref('')
const toggleAria = ref(false)

const grabbedCard = computed(() => kanban.grabbedCard.value)

function onDragStart(e: DragEvent, cardId: string, fromColumn: string) {
    if (kanban.draggingColumn.value) return
    kanban.startCardDrag(cardId, fromColumn)
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', cardId)
    }
}

function onDragEnd() {
    kanban.endCardDrag()
}

function onDragOver(e: DragEvent, columnId: string) {
    if (kanban.draggingColumn.value) return
    e.preventDefault()
    kanban.setDragOverColumn(columnId)
}

function onDragLeave(e: DragEvent, columnId: string) {
    const el = e.currentTarget
    if (!(el instanceof HTMLElement)) return
    const related = e.relatedTarget
    if (related instanceof Node && el.contains(related)) return
    if (kanban.dragOverColumn.value === columnId) {
        kanban.setDragOverColumn(null)
    }
}

function onCardClick(card: KanbanCard, columnId: string) {
    if (kanban.isDragging.value) return
    emit('card-click', card, columnId)
}

let activeKeyboardCardId: string | null = null

async function handleKeyboardCardMove(
    cardId: string,
    columnId: string,
    mode: 'in-column' | 'adjacent',
    direction: -1 | 1,
) {
    activeKeyboardCardId = cardId

    let result: KanbanMoveResult
    if (mode === 'in-column') {
        result = kanban.moveCardInColumn(cardId, columnId, direction)
    } else {
        result = kanban.moveCardToAdjacentColumn(cardId, columnId, direction)
    }

    if (result.status !== 'moved') {
        return
    }

    const change = result.change
    if (change.kind === 'card-move') {
        const toColId = change.toColumn
        if (change.fromColumn === toColId) {
            ariaLiveMessage.value = `${t('kanban.cardMoved')}${toggleAria.value ? '' : '\u200B'}`
            toggleAria.value = !toggleAria.value
        } else {
            const targetCol = result.nextColumns.find((c) => c.id === toColId)
            if (targetCol) {
                ariaLiveMessage.value = t('kanban.cardMovedToColumn', { column: targetCol.title })
            }
        }
    }

    await nextTick()
    if (activeKeyboardCardId !== cardId) return

    let currentColumn: KanbanColumn | undefined
    let currentIndex = -1
    for (const col of props.modelValue) {
        const idx = col.cards.findIndex((c) => c.id === cardId)
        if (idx !== -1) {
            currentColumn = col
            currentIndex = idx
            break
        }
    }

    const root = boardRef.value ?? getDocument()
    if (currentColumn && currentIndex !== -1) {
        const safeCardId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(cardId) : cardId
        const cardEl = root?.querySelector(`[data-card-id="${safeCardId}"]`)
        if (cardEl instanceof HTMLElement) {
            cardEl.focus()
        }
    } else {
        const safeColId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(columnId) : columnId
        const colEl = root?.querySelector(`[data-column-id="${safeColId}"]`)
        if (colEl instanceof HTMLElement) {
            colEl.focus()
        }
    }
}

function onCardKeydown(e: KeyboardEvent, card: KanbanCard, columnId: string) {
    if (e.key === ' ') {
        e.preventDefault()
        if (kanban.grabbedCard.value) {
            kanban.releaseCard()
            ariaLiveMessage.value = t('kanban.cardReleased')
        } else {
            kanban.grabCard(card.id, columnId)
            ariaLiveMessage.value = t('kanban.cardGrabbed')
        }
        return
    }
    if (e.key === 'Enter') {
        e.preventDefault()
        onCardClick(card, columnId)
        return
    }

    if (!kanban.grabbedCard.value) return

    if (e.key === 'Escape') {
        kanban.releaseCard()
        ariaLiveMessage.value = t('kanban.cardReleased')
        return
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        void handleKeyboardCardMove(kanban.grabbedCard.value.cardId, kanban.grabbedCard.value.columnId, 'in-column', e.key === 'ArrowUp' ? -1 : 1)
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        void handleKeyboardCardMove(kanban.grabbedCard.value.cardId, kanban.grabbedCard.value.columnId, 'adjacent', e.key === 'ArrowLeft' ? -1 : 1)
    }
}

function onDrop(e: DragEvent, toColumnId: string) {
    kanban.onDrop(e, toColumnId)
}

function onColumnDragStart(e: DragEvent, columnId: string) {
    if (kanban.draggingCard.value) {
        e.preventDefault()
        return
    }
    kanban.startColumnDrag(columnId)
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', columnId)
    }
}

function onColumnDragEnd() {
    kanban.endColumnDrag()
    dragOverColumnHeader.value = null
}

function onColumnDragOver(e: DragEvent, columnId: string) {
    if (!kanban.draggingColumn.value) return
    e.preventDefault()
    e.stopPropagation()
    if (dragOverColumnHeader.value !== columnId) {
        dragOverColumnHeader.value = columnId
    }
}

function onColumnDrop(e: DragEvent, toColumnId: string) {
    if (!kanban.draggingColumn.value) return
    e.preventDefault()
    e.stopPropagation()
    const fromId = kanban.draggingColumn.value
    dragOverColumnHeader.value = null
    kanban.endColumnDrag()

    if (fromId === toColumnId) return

    kanban.moveColumn(fromId, toColumnId)
}

function onAddCard(columnId: string) {
    emit('add-card', columnId)
}

const boardClass = computed(() => cn('flex gap-4 overflow-x-auto pb-4', props.class))

const columnClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        map.set(col.id, cn(kanbanColumnVariants({ dragOver: kanban.dragOverColumn.value === col.id })))
    })
    return map
})

const cardClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        col.cards.forEach((card) => {
            map.set(card.id, cn(kanbanCardVariants({ dragging: kanban.draggingCard.value?.cardId === card.id })))
        })
    })
    return map
})

const columnHeaderClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        map.set(col.id, cn(kanbanColumnHeaderVariants({
            dragging: kanban.draggingColumn.value === col.id,
            dragOver: dragOverColumnHeader.value === col.id && kanban.draggingColumn.value !== col.id,
        })))
    })
    return map
})

const addIconClasses = computed(() => iconSizeVariants({ size: 'sm' }))

defineExpose({
    moveCard: (cardId: string, columnId: string, direction: number, mode: 'in-column' | 'adjacent' = 'adjacent') => {
        void handleKeyboardCardMove(cardId, columnId, mode, direction === 1 ? 1 : -1)
    },
    moveColumn: (fromId: string, toId: string) => {
        kanban.moveColumn(fromId, toId)
    },
    addCard: (columnId: string) => emit('add-card', columnId),
    getColumn: (columnId: string) => columns.value.find(c => c.id === columnId),
    getAllColumns: () => columns.value,
})
</script>

<template>
    <div ref="boardRef" :class="boardClass">
        <div
            v-for="col in columns"
            :key="col.id"
            :class="columnClassesMap.get(col.id)"
            @dragover="onDragOver($event, col.id)"
            @dragleave="onDragLeave($event, col.id)"
            @drop="onDrop($event, col.id)"
        >
            <!-- Column Header (draggable for column sorting) -->
            <div
                data-slot="kanban-column-header"
                :data-column-id="col.id"
                tabindex="-1"
                :class="columnHeaderClassesMap.get(col.id)"
                draggable="true"
                @dragstart="onColumnDragStart($event, col.id)"
                @dragend="onColumnDragEnd"
                @dragover="onColumnDragOver($event, col.id)"
                @drop="onColumnDrop($event, col.id)"
            >
                <div class="flex min-w-0 items-center gap-2">
                    <span
                        v-if="col.color"
                        class="inline-block w-3 h-3 rounded-brutal border-3 border-brutal"
                        :style="{ background: col.color }"
                    />
                    <h3 class="min-w-0 break-words font-black text-sm tracking-wide uppercase text-brutal-fg cursor-grab active:cursor-grabbing">
                        {{ col.title }}
                    </h3>
                </div>
                <span class="text-xs font-bold border-3 border-brutal px-1.5 py-0.5 rounded-brutal bg-brutal-bg shadow-brutal">
                    {{ col.cards.length }}
                </span>
            </div>

            <!-- Cards -->
            <div class="flex flex-col gap-2 min-h-[120px]">
                <div
                    v-for="card in col.cards"
                    :key="card.id"
                    :data-card-id="card.id"
                    :class="cardClassesMap.get(card.id)"
                    :tabindex="0"
                    role="button"
                    :aria-label="card.title"
                    :aria-grabbed="grabbedCard?.cardId === card.id ? 'true' : undefined"
                    draggable="true"
                    @dragstart="onDragStart($event, card.id, col.id)"
                    @dragend="onDragEnd"
                    @click="onCardClick(card, col.id)"
                    @keydown="onCardKeydown($event, card, col.id)"
                >
                    <p class="min-w-0 break-words font-bold text-sm text-brutal-fg">
                        {{ card.title }}
                    </p>
                    <p v-if="card.description" class="min-w-0 break-words text-xs text-brutal-fg opacity-70 mt-1">
                        {{ card.description }}
                    </p>
                    <div v-if="card.tags && card.tags.length" class="flex flex-wrap gap-1 mt-2">
                        <span
                            v-for="tag in card.tags"
                            :key="tag"
                            class="min-w-0 break-words text-xs font-bold px-1.5 py-0.5 border-3 border-brutal rounded-brutal bg-brutal-accent"
                        >
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <!-- Empty State -->
                <div
                    v-if="col.cards.length === 0"
                    class="flex items-center justify-center h-16 border-3 border-dashed border-brutal rounded-brutal text-xs font-medium opacity-40"
                >
                    {{ t('kanban.dropCardsHere') }}
                </div>
            </div>

            <!-- Add Card Slot (with default + button fallback) -->
            <slot :name="`add-${col.id}`" :column-id="col.id">
                <Button
                    variant="outline"
                    size="sm"
                    class="w-full"
                    :aria-label="t('kanban.addCard')"
                    @click="onAddCard(col.id)"
                >
                    <Plus :class="addIconClasses" />
                    {{ t('kanban.addCard') }}
                </Button>
            </slot>
        </div>
    </div>
    <!-- 无障碍：实时播报卡片移动结果 -->
    <div class="sr-only" aria-live="polite" role="status">
        {{ ariaLiveMessage }}
    </div>
</template>
