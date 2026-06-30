---
title: Tooltip
translated: true
description: Tooltip overlay component that quickly displays auxiliary text on hover or focus.
---

# Tooltip

A neo-brutalist tooltip built on reka-ui's Tooltip primitive, showing informational text on hover. `TooltipProvider` provides global configuration for all descendant tooltips, supporting custom delay, controlled mode, and more.

## Demo

<ComponentPreview>
  <TooltipDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tooltip" />

## Usage

### Basic Usage

```vue
<script setup>
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger as-child>
                <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>This is a tooltip</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
```

### Using with Provider

Wrap your application (or a section) with `TooltipProvider` to enable tooltips:

```vue
<script setup>
import { TooltipProvider } from 'brutx-ui-vue'
</script>

<template>
    <TooltipProvider>
        <router-view />
    </TooltipProvider>
</template>
```

### Trigger Delay

Control the delay from when the pointer enters the trigger element to when the tooltip opens via the `delayDuration` prop on `TooltipProvider` (in milliseconds). You can also override the global setting on individual `Tooltip` components via `delayDuration`.

```vue
<TooltipProvider :delay-duration="0">
    <Tooltip>
        <TooltipTrigger>
            <Button>Show Immediately</Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>No delay</p>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>

<TooltipProvider>
    <Tooltip :delay-duration="1500">
        <TooltipTrigger>
            <Button>Long Delay</Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>Overridden to 1500ms</p>
        </TooltipContent>
    </Tooltip>
</TooltipProvider>
```

### Controlled Mode

Control the tooltip's visibility via `open` and `@update:open`:

```vue
<script setup>
import { ref } from 'vue'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Button } from 'brutx-ui-vue'

const isOpen = ref(false)
</script>

<template>
    <TooltipProvider>
        <Tooltip v-model:open="isOpen">
            <TooltipTrigger as-child>
                <Button variant="outline">Controlled Tooltip</Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Current state: {{ isOpen ? 'Open' : 'Closed' }}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `TooltipProvider` | Context provider (required ancestor component) |
| `Tooltip` | Root component (re-exported from reka-ui's `TooltipRoot`) |
| `TooltipTrigger` | Element that triggers the tooltip on hover |
| `TooltipContent` | Tooltip content panel |

## Props

### TooltipProvider

Re-exported from reka-ui's `TooltipProvider`. Provides global configuration for all descendant tooltips.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `delayDuration` | `number` | `400` | Delay from pointer entering the trigger element to tooltip opening (in milliseconds) |
| `skipDelayDuration` | `number` | `300` | Time window to skip delay when moving between tooltips (in milliseconds) |
| `disableHoverableContent` | `boolean` | `false` | When `true`, moving the pointer into the content area will close the tooltip |
| `disableClosingTrigger` | `boolean` | `false` | When `true`, clicking the trigger element will not close the tooltip |
| `disabled` | `boolean` | `false` | When `true`, disables all tooltips |
| `ignoreNonKeyboardFocus` | `boolean` | `false` | When `true`, only keyboard focus (`:focus-visible`) triggers the tooltip |

### Tooltip

Re-exported from reka-ui's `TooltipRoot`. Manages the state of a single tooltip.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultOpen` | `boolean` | — | Initial open state in uncontrolled mode |
| `open` | `boolean` | — | Controlled open state |
| `delayDuration` | `number` | `700` | Overrides the Provider's delay duration for this individual tooltip |
| `disableHoverableContent` | `boolean` | — | Inherited from Provider, can be overridden individually |
| `disableClosingTrigger` | `boolean` | `false` | When `true`, clicking the trigger element will not close the tooltip |
| `disabled` | `boolean` | `false` | When `true`, disables this tooltip |
| `ignoreNonKeyboardFocus` | `boolean` | `false` | When `true`, only keyboard focus triggers |

### TooltipTrigger

Trigger component that opens the tooltip on hover or focus.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string \| Component` | `'button'` | Element type to render |
| `asChild` | `boolean` | — | Render styles onto the child element |

### TooltipContent

Tooltip content panel with neo-brutalist styling. Rendered via Portal to `body` by default.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sideOffset` | `number` | `6` | Distance from the trigger (in pixels) |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Display direction |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment relative to the trigger |
| `alignOffset` | `number` | — | Alignment offset (in pixels) |
| `avoidCollisions` | `boolean` | — | Whether to automatically avoid collisions |
| `collisionBoundary` | `Element \| Element[]` | — | Collision detection boundary |
| `collisionPadding` | `number \| Record<string, number>` | — | Collision detection padding |
| `arrowPadding` | `number` | — | Arrow padding |
| `sticky` | `'partial' \| 'always'` | — | Sticky positioning strategy |
| `hideWhenDetached` | `boolean` | — | Hide when obscured |
| `forceMount` | `boolean` | — | Force mount (for custom animation control) |
| `ariaLabel` | `string` | — | Screen reader label |
| `class` | `string` | — | Custom CSS class |

## Events

### Tooltip

| Event | Payload | Description |
|-------|---------|-------------|
| `update:open` | `value: boolean` | Emitted when the open state changes |

### TooltipContent

| Event | Payload | Description |
|-------|---------|-------------|
| `escapeKeyDown` | `KeyboardEvent` | Emitted when the Escape key is pressed, can prevent default behavior |
| `pointerDownOutside` | `Event` | Emitted when pressing a pointer outside, can prevent default behavior |

## Slots

### Tooltip

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | `{ open: boolean }` | Scoped slot, provides current open state |

### TooltipTrigger / TooltipContent

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Default slot content |

## Accessibility

- **Keyboard**: Press `Escape` to close the tooltip
- **ARIA Attributes**: Tooltip content is readable by screen readers; `ariaLabel` provides a more precise screen reader description
- **Focus Management**: Tooltip appears on hover and focus; supports `ignoreNonKeyboardFocus` to avoid triggering on non-keyboard interactions
