---
title: Skeleton
description: Skeleton placeholder component supporting circular, text line, card, and other layout previews.
translated: true
---

# Skeleton

Neo-brutalist skeleton loading component providing sub-components for common loading patterns.

## Demo

<ComponentPreview>
  <SkeletonDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="skeleton" />

## Usage

### Basic Skeleton

```vue
<script setup>
import { Skeleton } from 'brutx-ui-vue'
</script>

<template>
    <Skeleton class="h-12 w-12" />
</template>
```

### Shapes

| Shape | Description |
|------|------|
| `rect` | Rounded rectangle (`rounded-brutal`) |
| `circle` | Circle (`rounded-full`) with equal width and height |

```vue
<template>
    <div class="flex items-center gap-4">
        <Skeleton shape="rect" size="lg" width="80px" />
        <Skeleton shape="circle" size="lg" />
    </div>
</template>
```

### Custom Width

`width` accepts any CSS width string, including percentages. When `shape="circle"`, it also sets the height.

```vue
<template>
    <div class="space-y-2 w-full">
        <Skeleton width="100%" />
        <Skeleton width="75%" />
        <Skeleton width="50%" />
    </div>
</template>
```

### SkeletonText

```vue
<script setup>
import { SkeletonText } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonText :lines="3" />
</template>
```

### SkeletonAvatar

```vue
<script setup>
import { SkeletonAvatar } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonAvatar size="default" />
</template>
```

### SkeletonCard

```vue
<script setup>
import { SkeletonCard } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonCard />
</template>
```

### SkeletonTable

```vue
<script setup>
import { SkeletonTable } from 'brutx-ui-vue'
</script>

<template>
    <SkeletonTable :rows="5" :columns="4" />
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Gray background |
| `primary` | Primary color at 30% opacity |
| `secondary` | Secondary color at 30% opacity |
| `accent` | Accent color at 30% opacity |

## Sizes

| Size | Height |
|------|------|
| `sm` | `h-8` |
| `default` | `h-10` |
| `lg` | `h-14` |
| `xl` | `h-20` |

When `shape="circle"`, width matches height (`w-8`/`w-10`/`w-14`/`w-20`).

```vue
<template>
    <div class="space-y-2">
        <Skeleton size="sm" width="200px" />
        <Skeleton size="default" width="200px" />
        <Skeleton size="lg" width="200px" />
        <Skeleton size="xl" width="200px" />
    </div>
</template>
```

## Sub-components

| Component | Description |
|------|------|
| `Skeleton` | Basic skeleton block with built-in `role="status"` and `aria-busy="true"` accessibility attributes |
| `SkeletonText` | Multi-line skeleton text with customizable line count and last line width |
| `SkeletonAvatar` | Circular avatar placeholder |
| `SkeletonCard` | Complete card skeleton with image area, title, text, and button placeholders |
| `SkeletonTable` | Table skeleton with built-in `role="table"` and `aria-busy="true"` accessibility attributes |

## Props

### Skeleton

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Controls height (also controls width for `circle`) |
| `shape` | `'rect' \| 'circle'` | `'rect'` | Shape; `circle` uses `rounded-full` with equal width and height |
| `width` | `string` | — | Custom width, supports percentages like `'100%'`; also sets height for `circle` |
| `class` | `string` | — | Custom style class |

### SkeletonText

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `lines` | `number` | `3` | Number of text lines |
| `lastLineWidth` | `string` | `'60%'` | Width of the last line, supports any CSS width value |
| `class` | `string` | — | Custom style class |

### SkeletonAvatar

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl'` | `'default'` | Avatar size with equal width and height |
| `class` | `string` | — | Custom style class |

### SkeletonCard

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `class` | `string` | — | Custom style class |

### SkeletonTable

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'accent'` | `'default'` | Color variant |
| `rows` | `number` | `5` | Number of data rows |
| `columns` | `number` | `4` | Number of columns |
| `class` | `string` | — | Custom style class |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Content inside the skeleton block, can hold custom loading indicators or other elements |

## Accessibility

- **ARIA Attributes**: `Skeleton` has built-in `role="status"` and `aria-busy="true"`; `SkeletonTable` has built-in `role="table"` and `aria-busy="true"`
