---
title: ScratchCard
description: A Canvas overlay-driven scratch card component with custom overlay support, progress callback, and keyboard accessibility.
translated: true
---

# ScratchCard

Neobrutalist-style scratch card component that uses HTML5 Canvas overlay on top of the content, drawing a mottled stripe layer. After the user erases a certain area with mouse/finger, the Canvas fades out and is destroyed, fully revealing the Vue content in the slot.

## Demo

<ComponentPreview>
  <ScratchCardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="scratch-card" />

## Usage

```vue
<script setup>
import { ScratchCard } from 'brutx-ui-vue'
</script>

<template>
    <ScratchCard class="w-full max-w-sm h-48">
        <div class="flex items-center justify-center h-full bg-brutal-accent">
            <p class="text-2xl font-black">🎉 Congratulations!</p>
        </div>
    </ScratchCard>
</template>
```

### Custom Overlay

By default, a Neobrutalist two-color stripe pattern is drawn (`--brutal-primary` + `--brutal-secondary`). You can set a solid color overlay via the `overlayColor` prop:

```vue
<ScratchCard overlay-color="#FFE66D">
    <p>Content underneath</p>
</ScratchCard>
```

## Programmatic Control

```vue
<script setup>
import { ref } from 'vue'
import { ScratchCard } from 'brutx-ui-vue'

const scratchCardRef = ref()
</script>

<template>
    <ScratchCard ref="scratchCardRef" />
    <button @click="scratchCardRef?.revealAll()">Reveal All</button>
</template>
```

### Exposed API

| Method/Property | Type | Description |
|-----------|------|------|
| `isRevealed` | `boolean` | Whether it has been revealed |
| `revealAll()` | `() => void` | Immediately reveal all content |

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `percentage` | `number` | `50` | Area percentage threshold for automatic full reveal (0-100) |
| `brushRadius` | `number` | `20` | Eraser brush radius (px) |
| `overlayColor` | `string` | — | Overlay base color; if not set, a two-color stripe pattern is drawn by default |
| `fadeDuration` | `number` | `300` | Canvas fade-out animation duration after threshold is reached (ms) |
| `class` | `string` | — | Custom style class |

## Events

| Event | Payload | Description |
|------|------|------|
| `progress` | `number` | Scratch progress change callback (throttled) |
| `completed` | — | Triggered after scratch completion (after fade-out upon reaching threshold) |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Scratch card content underneath |

## Accessibility

- **Keyboard control**: The component sets `tabindex="0"`; pressing `Enter` or `Space` automatically reveals all content
- **ARIA attributes**: The component sets `role="region"`, and `aria-label` defaults to the localized text `scratchCard.ariaLabel` (default: "Scratch Card")
- **Motion reduction**: When the user prefers `prefers-reduced-motion: reduce`, the fade-out animation is skipped and the Canvas is removed immediately
- **Interaction hint**: The Canvas overlay uses `cursor-crosshair` cursor to indicate interactivity
