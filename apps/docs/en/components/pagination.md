---
title: Pagination
description: Pagination control component with solid page-turning buttons, adaptable to various list and data table scenarios.
translated: true
---

# Pagination

A neo-brutalist style pagination component built with a built-in pagination range calculation algorithm. Supports responsive pagination range computation (automatic ellipsis display), first/last page quick navigation, configurable sibling count (`siblingCount`) to control the visible range, multiple variants and size options, full accessibility support (`aria-label`, `aria-current`), and clickable ellipsis for custom page-jump interactions.

## Demo

<ComponentPreview>
  <PaginationDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="pagination" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const totalPages = 10
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="totalPages"
    />
</template>
```

### With Full Options

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="50"
        :sibling-count="2"
        :show-first-last="true"
        :show-page-numbers="true"
        variant="default"
        size="default"
    />
</template>
```

### Custom Layout & Quick Jumper

You can arrange and display different functional blocks by configuring the `layout` prop, including: total items count (`total`), page size selector (`sizes`), previous page (`prev`), page numbers (`pager`), next page (`next`), and quick jumper (`jumper`).
The default value is `'sizes, prev, pager, next, jumper, total'`. In the jumper input field, you can input a target page number and press `Enter` to jump.

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
const pageSize = ref(10)
</script>

<template>
    <Pagination
        v-model="currentPage"
        v-model:page-size="pageSize"
        :total="100"
        layout="total, sizes, prev, pager, next, jumper"
    />
</template>
```

### Without Page Numbers

When `showPageNumbers` is set to `false`, the component displays a counter showing the current page and total pages (e.g., "3 / 10") instead of page number buttons.

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="10"
        :show-page-numbers="false"
    />
</template>
```

### Clickable Ellipsis

When the total page count is large, the pagination range uses ellipsis `...` to represent collapsed page numbers. The ellipsis is a clickable `<button>` element (with `aria-label="Jump pages"` for accessibility), which triggers the `jump` event (no payload) when clicked. Developers can implement custom page-jump interactions in this event, such as showing an input dialog for the user to enter a target page number.

```vue
<script setup>
import { ref } from 'vue'
import { Pagination } from 'brutx-ui-vue'

const currentPage = ref(1)

function handleJump() {
    const input = window.prompt('Jump to which page?')
    if (input !== null) {
        const page = Number(input)
        if (Number.isFinite(page)) {
            currentPage.value = page
        }
    }
}
</script>

<template>
    <Pagination
        v-model="currentPage"
        :total-pages="50"
        :sibling-count="1"
        @jump="handleJump"
    />
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | Standard button style |
| `rounded` | Buttons use `--brutal-radius` border radius |
| `minimal` | Buttons without border and shadow |

## Sizes

| Size | Button Height | Gap | Icon Size |
| --- | --- | --- | --- |
| `sm` | `h-8` | `gap-1` | `h-3 w-3` |
| `default` | `h-10` | `gap-2` | `h-4 w-4` |
| `lg` | `h-12` | `gap-3` | `h-5 w-5` |

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `modelValue` | `number` | — (required) | Current page number, supports `v-model` two-way binding |
| `totalPages` | `number` | — | Total number of pages (mutually exclusive with `total` + `pageSize`) |
| `total` | `number` | — | Total number of items |
| `pageSize` | `number` | `10` | Number of items per page |
| `pageSizes` | `number[]` | `[10, 20, 50, 100]` | Page size options |
| `layout` | `string` | `'sizes, prev, pager, next, jumper, total'` | Custom layout (comma-separated: `total`, `sizes`, `prev`, `pager`, `next`, `jumper`) |
| `disabled` | `boolean` | `false` | Whether disabled |
| `background` | `boolean` | `false` | Whether page buttons have background color |
| `hideOnSinglePage` | `boolean` | `false` | Whether to hide when there is only one page |
| `siblingCount` | `number` | `1` | Number of sibling pages displayed on each side of the current page |
| `showFirstLast` | `boolean` | `true` | Whether to show first/last page buttons |
| `showPageNumbers` | `boolean` | `true` | Whether to show page number buttons; when `false`, displays a page counter instead |
| `variant` | `'default' \| 'rounded' \| 'minimal'` | `'default'` | Component variant style |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Component size |
| `class` | `string` | — | Custom CSS class name, merged onto the root `<nav>` element |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `page: number` | Triggered when the page number changes, used for `v-model` binding |
| `update:pageSize` | `size: number` | Triggered when the page size changes |
| `jump` | — | Triggered when the ellipsis `...` button is clicked, used for custom page-jump interactions |

## Accessibility

- **ARIA Attributes**: The root element uses a `<nav>` tag with `role="navigation"` and `aria-label` attributes; page number buttons use the format `aria-label="Go to page X"`; the current page button is identified with `aria-current="page"`
- **Focus Management**: Navigation buttons use semantic labels (first page, previous page, next page, last page); disabled states use the `disabled` attribute with corresponding styles
