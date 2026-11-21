---
title: Scroll Area
description: Custom scroll area component with thick scrollbars styled for a neo-brutalist look.
translated: true
---

# Scroll Area

A neo-brutalist styled scroll area built on reka-ui's ScrollArea primitives, featuring custom scrollbar styling.

## Demo

<ComponentPreview>
  <ScrollAreaDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="scroll-area" />

## Usage

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'
</script>

<template>
    <ScrollArea class="h-72 w-48 border-3 border-brutal">
        <div class="p-4">
            <h4 class="mb-4 text-sm font-black leading-none">Tags</h4>
            <div class="space-y-1">
                <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                    {{ tag }}
                </div>
            </div>
        </div>
    </ScrollArea>
</template>
```

### Horizontal Scrolling

```vue
<script setup>
import { ScrollArea, ScrollBar } from 'brutx-ui-vue'
</script>

<template>
    <ScrollArea class="w-96 border-3 border-brutal">
        <div class="flex w-max space-x-4 p-4">
            <div v-for="artwork in artworks" :key="artwork" class="shrink-0">
                <div class="h-[250px] w-[200px] border-3 border-brutal bg-brutal-muted" />
            </div>
        </div>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
</template>
```

## Variants

Controls the scrollbar track and thumb colors. `ScrollArea` reserves space for the default vertical scrollbar so the content keeps its width as the scrollbar appears and disappears. Set the variant on `ScrollBar` for a manually added horizontal scrollbar.

| Variant | Track | Thumb |
|------|------|------|
| `default` | `bg-brutal-bg` | `bg-brutal-fg` |
| `primary` | `bg-brutal-primary` | `bg-brutal-primary-foreground` |
| `accent` | `bg-brutal-accent` | `bg-brutal-accent-foreground` |

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'

const tags = Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`)
</script>

<template>
    <ScrollArea variant="primary" class="h-72 w-48 border-3 border-brutal">
        <div class="p-4 space-y-1">
            <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                {{ tag }}
            </div>
        </div>
    </ScrollArea>
</template>
```

## Sizes

Controls the scrollbar thickness (via the `--scroll-thickness` token).

| Size | Thickness |
|------|------|
| `sm` | `0.5rem` |
| `default` | `0.75rem` |
| `lg` | `1rem` |

```vue
<script setup>
import { ScrollArea } from 'brutx-ui-vue'

const tags = Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`)
</script>

<template>
    <ScrollArea size="lg" class="h-72 w-48 border-3 border-brutal">
        <div class="p-4 space-y-1">
            <div v-for="tag in tags" :key="tag" class="text-sm font-medium">
                {{ tag }}
            </div>
        </div>
    </ScrollArea>
</template>
```

## Sub-components

| Component | Description |
|------|------|
| `ScrollArea` | Root scrollable container |
| `ScrollBar` | Custom scrollbar (vertical by default, supports horizontal) |

## API Reference

<span id="scrollarea"></span>
<span id="scrollbar"></span>

<ComponentApi name="scroll-area" />

## Accessibility

- **Keyboard operation**: Supports keyboard arrow keys, Page Up/Down, Home/End keys for scrolling content
- **ARIA attributes**: The scroll area automatically sets `role="region"` and `aria-label`; the scrollbar sets appropriate ARIA attributes
- **Scrollbar interaction**: The scrollbar thumb supports mouse dragging and keyboard operation, with visible focus indicators
- **Content overflow**: When content overflows, screen readers can identify the scrollable area and provide navigation hints
