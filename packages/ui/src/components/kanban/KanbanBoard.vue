<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@lucide/vue';
import { cn } from '@/lib/utils';
import { useLocale } from '@/composables/useLocale';
import { iconSizeVariants } from '@/lib/icon-size-variants';
import { kanbanColumnVariants, kanbanCardVariants, kanbanColumnHeaderVariants } from './kanban-variants';
import Button from '../button/Button.vue';
import type { KanbanCard, KanbanColumn } from './types';

export type { KanbanCard, KanbanColumn };

interface KanbanBoardProps {
    modelValue: KanbanColumn[];
    class?: string;
}

const props = defineProps<KanbanBoardProps>();

const emit = defineEmits<{
    'update:modelValue': [columns: KanbanColumn[]];
    'card-move': [cardId: string, fromColumn: string, toColumn: string];
    'card-click': [card: KanbanCard, columnId: string];
    'column-move': [columnId: string, fromIndex: number, toIndex: number];
    'add-card': [columnId: string];
}>();

const { t } = useLocale();

const draggingCard = ref<{ cardId: string; fromColumn: string } | null>(null);
const draggingColumn = ref<string | null>(null);
const dragOverColumn = ref<string | null>(null);
const dragOverColumnHeader = ref<string | null>(null);
const isDragging = ref(false);
const grabbedCard = ref<{ cardId: string; columnId: string } | null>(null);
const ariaLiveMessage = ref('');

const columns = computed(() => props.modelValue);

function onDragStart(e: DragEvent, cardId: string, fromColumn: string) {
    if (draggingColumn.value) return;
    draggingCard.value = { cardId, fromColumn };
    isDragging.value = true;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', cardId);
    }
}

function onDragEnd() {
    draggingCard.value = null;
    dragOverColumn.value = null;
    requestAnimationFrame(() => { isDragging.value = false });
}

function onDragOver(e: DragEvent, columnId: string) {
    if (draggingColumn.value) return;
    e.preventDefault();
    dragOverColumn.value = columnId;
}

function onDragLeave(e: DragEvent, columnId: string) {
    const el = e.currentTarget
    if (!(el instanceof HTMLElement)) return
    const related = e.relatedTarget
    if (related instanceof Node && el.contains(related)) return
    if (dragOverColumn.value === columnId) {
        dragOverColumn.value = null;
    }
}

function onCardClick(card: KanbanCard, columnId: string) {
    if (isDragging.value) return;
    emit('card-click', card, columnId);
}

function onCardKeydown(e: KeyboardEvent, card: KanbanCard, columnId: string) {
    // Space 抓取/放下卡片
    if (e.key === ' ') {
        e.preventDefault();
        if (grabbedCard.value) {
            grabbedCard.value = null;
            ariaLiveMessage.value = t('kanban.cardReleased');
        } else {
            grabbedCard.value = { cardId: card.id, columnId };
            ariaLiveMessage.value = t('kanban.cardGrabbed');
        }
        return;
    }
    // Enter 触发 click 事件
    if (e.key === 'Enter') {
        e.preventDefault();
        onCardClick(card, columnId);
        return;
    }

    if (!grabbedCard.value) return;

    if (e.key === 'Escape') {
        grabbedCard.value = null;
        ariaLiveMessage.value = t('kanban.cardReleased');
        return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveCardInColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowUp' ? -1 : 1);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        moveCardToAdjacentColumn(grabbedCard.value.cardId, grabbedCard.value.columnId, e.key === 'ArrowLeft' ? -1 : 1);
    }
}

function moveCardInColumn(cardId: string, columnId: string, direction: number) {
    const col = columns.value.find(c => c.id === columnId);
    if (!col) return;
    const index = col.cards.findIndex(c => c.id === cardId);
    if (index === -1) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= col.cards.length) return;

    const newColumns = columns.value.map(c => {
        if (c.id !== columnId) return c;
        const newCards = [...c.cards];
        const [moved] = newCards.splice(index, 1);
        newCards.splice(newIndex, 0, moved);
        return { ...c, cards: newCards };
    });
    emit('update:modelValue', newColumns);
    ariaLiveMessage.value = t('kanban.cardMoved');
}

function moveCardToAdjacentColumn(cardId: string, columnId: string, direction: number) {
    const colIndex = columns.value.findIndex(c => c.id === columnId);
    if (colIndex === -1) return;
    const newColIndex = colIndex + direction;
    if (newColIndex < 0 || newColIndex >= columns.value.length) return;

    const col = columns.value[colIndex];
    const card = col.cards.find(c => c.id === cardId);
    if (!card) return;

    const newColumns = columns.value.map((c, i) => {
        if (i === colIndex) {
            return { ...c, cards: c.cards.filter(cc => cc.id !== cardId) };
        }
        if (i === newColIndex) {
            return { ...c, cards: [...c.cards, card] };
        }
        return c;
    });
    emit('update:modelValue', newColumns);
    grabbedCard.value = { cardId, columnId: columns.value[newColIndex].id };
    ariaLiveMessage.value = t('kanban.cardMovedToColumn', { column: columns.value[newColIndex].title });
}

function onDrop(e: DragEvent, toColumnId: string) {
    if (draggingColumn.value) return;
    if (!draggingCard.value) return;
    const { cardId, fromColumn } = draggingCard.value;

    const sourceColumn = columns.value.find((col) => col.id === fromColumn);
    const card = sourceColumn?.cards.find((c) => c.id === cardId);
    if (!card) {
        draggingCard.value = null;
        dragOverColumn.value = null;
        return;
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

    const newColumns = columns.value.map((col) => {
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
            return { ...col, cards: col.cards.filter((c) => c.id !== cardId) };
        }
        return col;
    });

    emit('update:modelValue', newColumns);
    emit('card-move', cardId, fromColumn, toColumnId);
    draggingCard.value = null;
    dragOverColumn.value = null;
}

function onColumnDragStart(e: DragEvent, columnId: string) {
    if (draggingCard.value) {
        e.preventDefault();
        return;
    }
    draggingColumn.value = columnId;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnId);
    }
}

function onColumnDragEnd() {
    draggingColumn.value = null;
    dragOverColumnHeader.value = null;
}

function onColumnDragOver(e: DragEvent, columnId: string) {
    if (!draggingColumn.value) return;
    e.preventDefault();
    e.stopPropagation();
    if (dragOverColumnHeader.value !== columnId) {
        dragOverColumnHeader.value = columnId;
    }
}

function onColumnDrop(e: DragEvent, toColumnId: string) {
    if (!draggingColumn.value) return;
    e.preventDefault();
    e.stopPropagation();
    const fromId = draggingColumn.value;
    dragOverColumnHeader.value = null;
    draggingColumn.value = null;

    if (fromId === toColumnId) return;

    const fromIndex = columns.value.findIndex((col) => col.id === fromId);
    const toIndex = columns.value.findIndex((col) => col.id === toColumnId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newColumns = [...columns.value];
    const [moved] = newColumns.splice(fromIndex, 1);
    const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newColumns.splice(adjustedIndex, 0, moved);

    emit('update:modelValue', newColumns);
    emit('column-move', fromId, fromIndex, toIndex);
}

function onAddCard(columnId: string) {
    emit('add-card', columnId);
}

const boardClass = computed(() => cn('flex gap-4 overflow-x-auto pb-4', props.class));

const columnClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        map.set(col.id, cn(kanbanColumnVariants({ dragOver: dragOverColumn.value === col.id })))
    })
    return map
})

const cardClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        col.cards.forEach((card) => {
            map.set(card.id, cn(kanbanCardVariants({ dragging: draggingCard.value?.cardId === card.id })))
        })
    })
    return map
})

const columnHeaderClassesMap = computed(() => {
    const map = new Map<string, string>()
    columns.value.forEach((col) => {
        map.set(col.id, cn(kanbanColumnHeaderVariants({
            dragging: draggingColumn.value === col.id,
            dragOver: dragOverColumnHeader.value === col.id && draggingColumn.value !== col.id,
        })))
    })
    return map
})

const addIconClasses = computed(() => iconSizeVariants({ size: 'sm' }));

defineExpose({
    moveCard: moveCardToAdjacentColumn,
    moveColumn: (fromId: string, toId: string) => {
        const fromIndex = columns.value.findIndex(c => c.id === fromId);
        const toIndex = columns.value.findIndex(c => c.id === toId);
        if (fromIndex === -1 || toIndex === -1) return;
        const newColumns = [...columns.value];
        const [moved] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, moved);
        emit('update:modelValue', newColumns);
    },
    addCard: (columnId: string) => emit('add-card', columnId),
    getColumn: (columnId: string) => columns.value.find(c => c.id === columnId),
    getAllColumns: computed(() => props.modelValue),
});
</script>

<template>
    <div :class="boardClass">
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
                :class="columnHeaderClassesMap.get(col.id)"
                draggable="true"
                @dragstart="onColumnDragStart($event, col.id)"
                @dragend="onColumnDragEnd"
                @dragover="onColumnDragOver($event, col.id)"
                @drop="onColumnDrop($event, col.id)"
            >
                <div class="flex items-center gap-2">
                    <span
                        v-if="col.color"
                        class="inline-block w-3 h-3 rounded-brutal border-3 border-brutal"
                        :style="{ background: col.color }"
                    />
                    <h3 class="font-black text-sm tracking-wide uppercase text-brutal-fg cursor-grab active:cursor-grabbing">
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
                    <p class="font-bold text-sm text-brutal-fg">
{{ card.title }}
</p>
                    <p v-if="card.description" class="text-xs text-brutal-fg opacity-70 mt-1">
                        {{ card.description }}
                    </p>
                    <div v-if="card.tags && card.tags.length" class="flex flex-wrap gap-1 mt-2">
                        <span
                            v-for="tag in card.tags"
                            :key="tag"
                            class="text-xs font-bold px-1.5 py-0.5 border-3 border-brutal rounded-brutal bg-brutal-accent"
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
