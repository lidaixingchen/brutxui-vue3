---
title: CardWindowHeader
description: Retro OS window title bar with tri-color status lamps, monospace uppercase title and ASCII window controls, giving cards a mechanical terminal feel.
---

# CardWindowHeader

A retro operating system window title bar featuring tri-color status lamps on the left, a centered monospace uppercase title, and ASCII-style window controls on the right. Supports a multi-mode adaptive architecture: serves as a purely decorative layer in presentation cards, or as full interactive control buttons with keyboard focus and accessibility semantics.

## Preview

<ComponentPreview>
  <CardWindowHeaderDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="card-window-header" />

## Usage

### Basic Usage (Decorative)

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

### Interactive Control Mode

Enable window control actions with `closable`, `minimizable`, or `maximizable`. Supports Tab keyboard navigation, Enter / Space activation, and `@close` / `@minimize` / `@maximize` event handling.

```vue
<script setup>
import { ref } from 'vue'
import { CardWindowHeader } from 'brutx-ui-vue'

const isCollapsed = ref(false)

function onClose() {
    console.log('Window closed')
}
function onMinimize() {
    isCollapsed.value = !isCollapsed.value
}
</script>

<template>
    <div class="border-3 border-brutal shadow-brutal">
        <CardWindowHeader
            title="Terminal_Shell"
            closable
            minimizable
            maximizable
            interactive-lamps
            @close="onClose"
            @minimize="onMinimize"
        />
        <div v-show="!isCollapsed" class="p-4">Collapsible console content…</div>
    </div>
</template>
```

### Custom Actions Area Slot

The `actions` slot has highest priority and replaces the default control buttons with arbitrary action components.

```vue
<template>
    <CardWindowHeader title="Config Editor">
        <template #actions>
            <Button size="sm" variant="accent">SAVE</Button>
        </template>
    </CardWindowHeader>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | *(required)* | Window title rendered in monospace uppercase |
| `showControls` | `boolean` | `true` | Whether to render decorative ASCII controls (effective when not in interactive mode and no actions slot) |
| `closable` | `boolean` | `false` | Enable close button `[ X ]` (interactive mode) |
| `minimizable` | `boolean` | `false` | Enable minimize/fold button `[ _ ]` (interactive mode) |
| `maximizable` | `boolean` | `false` | Enable maximize/expand button `[ □ ]` (interactive mode) |
| `interactiveLamps` | `boolean` | `false` | Enable interactive clicks on tri-color status lamps (red=close, yellow=minimize, green=maximize) |
| `closeAriaLabel` | `string` | `undefined` | Accessible label for close button (falls back to locale translation) |
| `minimizeAriaLabel` | `string` | `undefined` | Accessible label for minimize button |
| `maximizeAriaLabel` | `string` | `undefined` | Accessible label for maximize button |
| `class` | `string` | `undefined` | Custom CSS class name |

## Emits

| Event | Parameters | Description |
|-------|------------|-------------|
| `close` | `(event: MouseEvent \| KeyboardEvent)` | Fired when clicking close button or red lamp |
| `minimize` | `(event: MouseEvent \| KeyboardEvent)` | Fired when clicking minimize button or yellow lamp |
| `maximize` | `(event: MouseEvent \| KeyboardEvent)` | Fired when clicking maximize button or green lamp |

## Slots

| Slot | Description |
|------|-------------|
| `actions` | Custom actions area on the right; highest priority, replaces default controls and interactive buttons |

## Accessibility

- **Adaptive semantics**: When no interactive props are set, controls and status lamps carry `aria-hidden="true"`, producing zero screen reader clutter. When interactive props are provided, elements upgrade to semantic `<button>` tags with accurate `aria-label`s.
- **Keyboard navigation**: Buttons feature `FOCUS_RING_CLASSES` high-contrast brutalist focus rings, supporting Tab key focus and Enter / Space activation.

