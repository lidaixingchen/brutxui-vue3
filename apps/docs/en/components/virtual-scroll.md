---
title: Virtual Scroll
description: High-performance virtual scrolling component based on @tanstack/vue-virtual, ideal for large data lists.
translated: true
---

# Virtual Scroll

A virtual scrolling component wrapped around `@tanstack/vue-virtual`, designed for high-performance scrolling scenarios with large data lists. Only elements within the visible area are rendered, significantly improving rendering performance for long lists.

> **Note:** This component depends on `@tanstack/vue-virtual` via dynamic import as an optional dependency. If not installed, the component displays a prompt message instead of throwing an error. Install with: `pnpm add @tanstack/vue-virtual`

## Demo

<ComponentPreview>
  <VirtualScrollDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="virtual-scroll" />

## Usage

```vue
<script setup>
import { VirtualScroll } from 'brutx-ui-vue'

const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
}))
</script>

<template>
    <VirtualScroll :items="items" :item-height="48">
        <template #default="{ item, index }">
            <div class="p-4 border-b-2 border-brutal">
                {{ item.name }}
            </div>
        </template>
    </VirtualScroll>
</template>
```

### Striped List

```vue
<VirtualScroll
    :items="items"
    variant="striped"
    size="lg"
>
    <template #default="{ item }">
        <div class="p-4">{{ item.name }}</div>
    </template>
</VirtualScroll>
```

### Load More

```vue
<VirtualScroll
    :items="items"
    @scroll-end="loadMore"
>
    <template #default="{ item }">
        <div class="p-4">{{ item.name }}</div>
    </template>
    <template #loading>
        <div class="p-4 text-center">Loading...</div>
    </template>
</VirtualScroll>
```

### Empty State

```vue
<VirtualScroll :items="[]">
    <template #empty>
        <div class="p-8 text-center">
            <Icon name="empty" class="w-16 h-16 mx-auto mb-4" />
            <p>No data available</p>
        </div>
    </template>
</VirtualScroll>
```

### Bordered List

```vue
<VirtualScroll
    :items="items"
    variant="bordered"
    :item-height="64"
>
    <template #default="{ item }">
        <div class="flex items-center gap-4 p-4">
            <Avatar :src="item.avatar" />
            <div>
                <p class="font-bold">{{ item.name }}</p>
                <p class="text-sm text-muted">{{ item.email }}</p>
            </div>
        </div>
    </template>
</VirtualScroll>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Default style |
| `striped` | Zebra striping (even row background color) |
| `bordered` | Bottom border |

## Sizes

| Size | Max Height |
|------|----------|
| `sm` | `max-h-64` (16rem) |
| `default` | `max-h-96` (24rem) |
| `lg` | `max-h-[32rem]` |
| `xl` | `max-h-[48rem]` |
| `full` | `max-h-full` |

## Data Types

```ts
interface VirtualScrollItem {
    id: string | number
    [key: string]: unknown
}
```

## Programmatic Control

After referencing the component via `ref`, you can call the following methods (exposed via `defineExpose`):

```vue
<script setup>
import { ref } from 'vue'
import { VirtualScroll } from 'brutx-ui-vue'

const listRef = ref(null)
const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i + 1}` }))

function jumpToMiddle() {
    listRef.value?.scrollToIndex(Math.floor(items.length / 2))
}
</script>

<template>
    <Button @click="jumpToMiddle">Jump to Middle</Button>
    <VirtualScroll ref="listRef" :items="items" :item-height="48">
        <template #default="{ item }">
            <div class="p-4">{{ item.name }}</div>
        </template>
    </VirtualScroll>
</template>
```

### Exposed API

| Method | Parameter | Description |
|------|------|------|
| `scrollToIndex` | `index: number` | Scroll to the list item at the specified index |

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `items` | `VirtualScrollItem[]` | — | Data array (required), each item must have an `id` field |
| `itemHeight` | `number` | `48` | Height of each item (in pixels) |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | Container size variant |
| `variant` | `'default' \| 'striped' \| 'bordered'` | `'default'` | List item style variant |
| `overscan` | `number` | `5` | Number of items to pre-render outside the visible area |
| `scrollEndThreshold` | `number` | `50` | Scroll-to-bottom detection threshold (in pixels) |
| `class` | `string` | — | External CSS class override |

## Events

| Event | Payload | Description |
|------|------|------|
| `scroll` | `scrollTop: number` | Fired on scroll |
| `scroll-end` | — | Fired when scrolled to the bottom |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | `{ item: VirtualScrollItem, index: number }` | List item rendering |
| `empty` | — | Empty state display (shown when `items` is an empty array) |
| `loading` | — | Load more display (only rendered when this slot is provided) |

## Accessibility

- **ARIA Attributes**: Uses `role="list"` and `role="listitem"` for semantic markup; supports `aria-setsize` and `aria-posinset` attributes
- **Keyboard**: Supports `aria-label` for internationalized labels

## FAQ

**Q: What should I do when list items have variable heights and the virtual scroll jumps around?**

A: `itemHeight` is an estimated value used to calculate scroll position. If list items vary significantly in height, it may cause jumping during scrolling. It is recommended to set `itemHeight` to the average height of most list items, or ensure consistent heights via CSS. Increasing the `overscan` value can also help reduce the jumping effect.

**Q: The component shows a prompt message instead of rendering normally after installation. Why?**

A: `VirtualScroll` depends on `@tanstack/vue-virtual`, which is an optional dependency. If the package is not installed, the component displays an installation prompt instead of throwing an error. Run `pnpm add @tanstack/vue-virtual` to install the dependency and restart your project.

**Q: The `scroll-end` event is not firing when I scroll to the bottom?**

A: Please check whether the data source is provided correctly. The `scroll-end` event only fires when the container actually scrolls and reaches the bottom. If the data volume is insufficient to produce a scrollbar (the list height does not exceed the container), the event will not fire. You can adjust the `scrollEndThreshold` value to control the trigger sensitivity.
