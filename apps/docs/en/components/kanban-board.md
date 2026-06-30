---
title: KanbanBoard
description: A kanban board component based on native HTML5 Drag and Drop API, supporting multi-column card drag-and-drop, tags, and color labels — ideal for task management scenarios.
translated: true
---

# KanbanBoard

A lightweight kanban board component with no external drag-and-drop library dependencies. Bold-bordered columns and sharp-shadow cards embody the tension of Neo-Brutalism.

## Demo

<ComponentPreview>
  <KanbanBoardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="kanban" />

## Usage

```vue
<script setup>
import { KanbanBoard } from 'brutx-ui-vue'
import type { KanbanColumn } from 'brutx-ui-vue'
import { ref } from 'vue'

const columns = ref<KanbanColumn[]>([
    {
        id: 'todo',
        title: 'Todo',
        color: '#FFE66D',
        cards: [
            { id: 'c1', title: 'Requirement analysis', tags: ['Dev'] },
        ],
    },
    {
        id: 'done',
        title: 'Done',
        cards: [],
    },
])
</script>

<template>
    <KanbanBoard
        v-model="columns"
        @card-move="(id, from, to) => console.log(id, from, to)"
    />
</template>
```

### Column Reordering

Drag column headers to reorder columns. The ordering is synced via `v-model` and triggers the `column-move` event.

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard } from 'brutx-ui-vue'

const columns = ref([
    { id: 'todo', title: 'Todo', cards: [] },
    { id: 'done', title: 'Done', cards: [] },
])

function handleColumnMove(columnId, fromIndex, toIndex) {
    console.log('Column', columnId, 'moved from', fromIndex, 'to', toIndex)
}
</script>

<template>
    <KanbanBoard v-model="columns" @column-move="handleColumnMove" />
</template>
```

### Custom Add Card Entry

Each column renders an `outline` style "Add card" button at the bottom by default, which triggers the `add-card` event on click. Use the `#add-{columnId}` slot to replace it with a custom entry.

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard, Button } from 'brutx-ui-vue'

const columns = ref([
    { id: 'todo', title: 'Todo', cards: [] },
])

function handleAddCard(columnId) {
    columns.value[0].cards.push({ id: Date.now().toString(), title: 'New card' })
}
</script>

<template>
    <KanbanBoard v-model="columns" @add-card="handleAddCard">
        <template #add-todo="{ columnId }">
            <Button variant="primary" size="sm" class="w-full" @click="handleAddCard(columnId)">
                New Task
            </Button>
        </template>
    </KanbanBoard>
</template>
```

## Data Types

```ts
interface KanbanCard {
    id: string
    title: string
    description?: string
    tags?: string[]
    color?: string
}

interface KanbanColumn {
    id: string
    title: string
    color?: string
    cards: KanbanCard[]
}
```

## Props

### KanbanBoard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `modelValue` | `KanbanColumn[]` | — | Kanban data (v-model) |
| `class` | `string` | — | Custom CSS class for the root element |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `KanbanColumn[]` | Emitted when column data is updated (after card move or column reorder) |
| `card-move` | `(cardId: string, fromColumn: string, toColumn: string)` | Emitted when a card is moved across columns |
| `card-click` | `(card: KanbanCard, columnId: string)` | Emitted when a card is clicked (not triggered during drag) |
| `column-move` | `(columnId: string, fromIndex: number, toIndex: number)` | Emitted when a column header drag reorder is completed |
| `add-card` | `columnId: string` | Emitted when the default "Add card" button is clicked |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `add-{columnId}` | `columnId: string` | Custom "Add card" entry at the bottom of the specified column; when not provided, renders a default `Button` (`variant="outline"` `size="sm"`) that triggers the `add-card` event |

## Accessibility

- Cards support keyboard navigation and can be focused via the `Tab` key
- Pressing `Enter` or `Space` after focusing triggers the `card-click` event
- Empty columns display a localized prompt text to guide users to drag and drop cards
- **Keyboard drag**: Focus a card and press `Space` to grab, use arrow keys to move, press `Space` again to drop, `Escape` to cancel
  - `↑/↓`: Move card up/down within the current column
  - `←/→`: Move card to an adjacent column
- Grabbed cards have `aria-grabbed="true"` attribute added
- Move results are automatically announced via `aria-live="polite"` region

### Keyboard Drag Example

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard } from 'brutx-ui-vue'

const columns = ref([
    { id: 'todo', title: 'Todo', cards: [
        { id: 'c1', title: 'Task 1' },
        { id: 'c2', title: 'Task 2' },
    ]},
    { id: 'done', title: 'Done', cards: [] },
])
</script>

<template>
    <!-- Users can:
         1. Tab to focus a card
         2. Press Space to grab the card
         3. Use arrow keys to move the card
         4. Press Space to drop the card
         5. Press Escape to cancel
    -->
    <KanbanBoard v-model="columns" />
</template>
```

## Exposed Methods (defineExpose)

| Method | Parameters | Description |
|--------|------------|-------------|
| `moveCard` | `(cardId, columnId, direction)` | Move card to adjacent column |
| `moveColumn` | `(fromId, toId)` | Swap two columns |
| `addCard` | `(columnId)` | Trigger add card event |
| `getColumn` | `(columnId)` | Get specific column data |
| `getAllColumns` | — | Get all column data (computed) |

```vue
<script setup>
import { ref } from 'vue'
import { KanbanBoard } from 'brutx-ui-vue'

const kanbanRef = ref(null)
const columns = ref([...])

function moveCardRight() {
    kanbanRef.value?.moveCard('card-1', 'todo', 1)
}
</script>

<template>
    <KanbanBoard ref="kanbanRef" v-model="columns" />
    <button @click="moveCardRight">Move Card Right</button>
</template>
```

## FAQ

**Q: Why isn't the data updated after dragging a card?**

A: `KanbanBoard` uses `v-model` for two-way data binding. Make sure the `columns` passed in are reactive data (using `ref` or `reactive`). The component automatically updates the data via the `update:modelValue` event after a card move or column reorder. If you use a plain variable, the data will not sync.

**Q: Does dragging work on mobile devices?**

A: The component is built on the native HTML5 Drag and Drop API, which may have limited support on mobile browsers. If you need to use it on mobile, test compatibility on the target device or consider providing an alternative interaction method (e.g., button-based actions) for mobile.

**Q: How can I limit the number of cards in a column?**

A: The component does not provide a built-in card count limit. You can implement this by listening to the `card-move` event, checking the card count of the target column in the event handler, and moving the card back to the original column by modifying the data if the limit is exceeded.
