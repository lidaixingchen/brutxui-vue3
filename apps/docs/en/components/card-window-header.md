---
title: CardWindowHeader
description: Retro OS window title bar with tri-color status lamps, monospace uppercase title and ASCII window controls, giving cards a mechanical terminal feel.
---

# CardWindowHeader

A retro operating system window title bar: tri-color status lamps on the left, a centered monospace uppercase title, and ASCII-style window controls on the right. Place it at the top of a card container, separated from the body by a bottom border, to give content a mechanical terminal window character.

## Preview

<ComponentPreview>
  <CardWindowHeaderDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="card-window-header" />

## Usage

### Basic Usage

```vue
<script setup>
import { CardWindowHeader } from 'brutx-ui-vue'
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal">
        <CardWindowHeader title="System Monitor v2.0" />
        <div class="p-4">Window body…</div>
    </div>
</template>
```

### Custom Actions Area

The `actions` slot replaces the default controls on the right with arbitrary action buttons.

```vue
<template>
    <CardWindowHeader title="Config Editor">
        <template #actions>
            <Button size="sm">SAVE</Button>
        </template>
    </CardWindowHeader>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | *(required)* | Window title rendered in monospace uppercase |
| `showControls` | `boolean` | `true` | Whether to render the decorative ASCII window controls |
| `class` | `string` | `undefined` | Custom CSS class name |

## Slots

| Slot | Description |
|------|-------------|
| `actions` | Custom actions area on the right; replaces the default ASCII controls when present |

## Accessibility

- **Decorative elements**: status lamps and ASCII controls are marked `aria-hidden`, producing no screen reader noise; the title text is the only semantic content.
- **Motion agnostic**: static layout with no animation dependencies, inherently respecting `prefers-reduced-motion`.
