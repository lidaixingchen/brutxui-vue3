---
title: CopyToClipboard
description: Copy button component with strong tactile and physics-inspired feedback, enabling one-click text copying.
translated: true
---

# CopyToClipboard

One-click copy-to-clipboard component. When the user clicks and successfully copies, the button displays a physically pressed-down state with green badge feedback for 2 seconds.

## Demo

<ComponentPreview>
  <CopyToClipboardDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="copy-to-clipboard" />

## Usage

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="pnpm install brutx-ui-vue" />
</template>
```

### Custom Display Slot

The component provides a default slot that exposes the `copied` state (whether a copy was just successful), allowing you to customize various display formats of the button.

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="Custom Text">
        <template #default="{ copied }">
            <span>{{ copied ? 'Copied!' : 'Click to copy' }}</span>
        </template>
    </CopyToClipboard>
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Default background with standard foreground text |
| `primary` | Primary (coral) background with high-contrast foreground |
| `outline` | Transparent background, retaining only border and shadow |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-3">
        <CopyToClipboard text="default" variant="default" />
        <CopyToClipboard text="primary" variant="primary" />
        <CopyToClipboard text="outline" variant="outline" />
    </div>
</template>
```

## Sizes

| Size | Description |
|------|------|
| `sm` | Small size, height `h-9`, padding `px-3`, font `text-sm` |
| `default` | Default size, height `h-11`, padding `px-5`, font `text-base` |
| `lg` | Large size, height `h-14`, padding `px-7`, font `text-lg` |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-3">
        <CopyToClipboard text="sm" size="sm" />
        <CopyToClipboard text="default" size="default" />
        <CopyToClipboard text="lg" size="lg" />
    </div>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `text` | `string` | — | Text to copy to the clipboard (required) |
| `duration` | `number` | `2000` | Duration in milliseconds to maintain the "copied" feedback state |
| `variant` | `'default' \| 'primary' \| 'outline'` | `'default'` | Button color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Button size preset |
| `iconSize` | `'xs' \| 'sm' \| 'default' \| 'lg' \| 'xl' \| '2xl'` | `'default'` | Icon size preset |
| `class` | `string` | `undefined` | Custom style class for the button container |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | `{ copied: boolean }` | Custom button content; `copied` indicates whether a copy was just successful |

```vue
<script setup>
import { CopyToClipboard } from 'brutx-ui-vue'
</script>

<template>
    <CopyToClipboard text="Custom Text">
        <template #default="{ copied }">
            <span>{{ copied ? 'Copied!' : 'Click to copy' }}</span>
        </template>
    </CopyToClipboard>
</template>
```

## Accessibility

- **Keyboard**: Supports `Enter` / `Space` to trigger the copy operation
- **ARIA Attributes**: The button includes a text description of the copy state
