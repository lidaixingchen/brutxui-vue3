---
title: InfiniteScroll
description: Automatically load more data when scrolling to the bottom.
---

# InfiniteScroll

Automatically load more data when scrolling to the bottom. Uses `IntersectionObserver` for efficient scroll detection.

## Preview

<ComponentPreview>
  <InfiniteScrollDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="infinite-scroll" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll } from 'brutx-ui-vue'

const items = ref(Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`))
const loading = ref(false)

async function loadMore() {
    loading.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newItems = Array.from(
        { length: 10 },
        (_, i) => `Item ${items.value.length + i + 1}`
    )
    items.value.push(...newItems)
    loading.value = false
}
</script>

<template>
    <InfiniteScroll @load="loadMore">
        <div v-for="item in items" :key="item" class="p-4 border-b">
            {{ item }}
        </div>
    </InfiniteScroll>
</template>
```

### With Custom Loading

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll, Spinner } from 'brutx-ui-vue'

const items = ref([])

async function loadMore() {
    // Load data
}
</script>

<template>
    <InfiniteScroll @load="loadMore">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>

        <template #loading>
            <div class="flex items-center justify-center py-4">
                <Spinner size="sm" />
                <span class="ml-2">Loading more...</span>
            </div>
        </template>
    </InfiniteScroll>
</template>
```

### Disabled State

```vue
<script setup>
import { ref } from 'vue'
import { InfiniteScroll } from 'brutx-ui-vue'

const items = ref([])
const hasMore = ref(true)

async function loadMore() {
    if (!hasMore.value) return
    // Load data...
    // If no more data:
    // hasMore.value = false
}
</script>

<template>
    <InfiniteScroll :disabled="!hasMore" @load="loadMore">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>
    </InfiniteScroll>
</template>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `distance` | `number` | `100` | Trigger distance threshold in pixels |
| `delay` | `number` | `200` | Debounce delay in milliseconds |
| `disabled` | `boolean` | `false` | Whether disabled |
| `immediate` | `boolean` | `true` | Whether to check immediately on mount |
| `class` | `string` | — | Custom CSS class |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `load` | — | Emitted when more data should be loaded |

## Slots

| Slot | Description |
| --- | --- |
| `default` | Content list |
| `loading` | Custom loading indicator |

## Exposed Methods

| Method | Description |
| --- | --- |
| `resetLoading()` | Reset loading state (call after data is loaded) |

## Composable

For more flexible usage, use the `useInfiniteScroll` composable:

```vue
<script setup>
import { ref } from 'vue'
import { useInfiniteScroll } from 'brutx-ui-vue'

const containerRef = ref(null)
const items = ref([])

const { isLoading, resetLoading } = useInfiniteScroll(containerRef, {
    distance: 100,
    delay: 200,
    onLoad: async () => {
        // Load data
        const newItems = await fetchItems()
        items.value.push(...newItems)
        resetLoading()
    },
})
</script>

<template>
    <div ref="containerRef">
        <div v-for="item in items" :key="item.id">
            {{ item.name }}
        </div>
    </div>
</template>
```

### useInfiniteScroll Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `distance` | `number` | `100` | Trigger distance threshold in pixels |
| `delay` | `number` | `200` | Debounce delay in milliseconds |
| `disabled` | `boolean` | `false` | Whether disabled |
| `immediate` | `boolean` | `true` | Whether to check immediately on mount |
| `onLoad` | `() => void` | — (required) | Load callback |

### useInfiniteScroll Returns

| Property | Type | Description |
| --- | --- | --- |
| `isLoading` | `Ref<boolean>` | Whether currently loading |
| `resetLoading` | `() => void` | Reset loading state |

## Accessibility

- **Screen Readers**: Loading state is announced
- **Reduced Motion**: Loading animation respects `prefers-reduced-motion`
