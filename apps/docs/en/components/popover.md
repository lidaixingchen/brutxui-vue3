---
title: Popover
translated: true
description: Floating overlay popover that supports displaying complex bubble content around a specified element.
---

# Popover

A neo-brutalist popover component for displaying floating content anchored to a trigger element. Built on reka-ui's `PopoverRoot`, supporting modal/non-modal modes and custom anchor positioning.

## Demo

<ComponentPreview>
  <PopoverDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="popover" />

## Usage

```vue
<script setup>
import { PopoverRoot as Popover, PopoverTrigger, PopoverAnchor } from 'reka-ui'
import { PopoverContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
            <div class="grid gap-4">
                <div class="space-y-2">
                    <h4 class="font-black leading-none">Dimensions</h4>
                    <p class="text-sm text-brutal-muted-foreground">
                        Set the dimensions for the layer.
                    </p>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `Popover` | Root component (re-exported from reka-ui's `PopoverRoot`) |
| `PopoverTrigger` | Button that opens the popover |
| `PopoverContent` | Popover content panel |
| `PopoverAnchor` | Anchor element for positioning |

## Props

### Popover (Root Component)

Re-exported from reka-ui's `PopoverRoot`. Manages the open/close state of the popover.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Initial open state in uncontrolled mode |
| `modal` | `boolean` | `false` | Modal mode; when enabled, disables interaction with external elements |

### PopoverTrigger

Trigger component, renders as a `button` element by default.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string \| Component` | `'button'` | Element type to render |
| `asChild` | `boolean` | — | Render styles onto the child element |

### PopoverContent

Popover content panel with neo-brutalist styling.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment relative to the trigger |
| `sideOffset` | `number` | `8` | Distance from the trigger (in pixels) |
| `class` | `string` | — | Custom CSS class |

### PopoverAnchor

Custom anchor element for precise popover positioning.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `reference` | `ReferenceElement` | — | Custom positioning reference element |

## Events

### Popover (Root Component)

| Event | Payload | Description |
|-------|---------|-------------|
| `update:open` | `value: boolean` | Emitted when the open state changes |

### PopoverContent

| Event | Payload | Description |
|-------|---------|-------------|
| `openAutoFocus` | `Event` | Emitted on auto-focus when opening, can be prevented |
| `closeAutoFocus` | `Event` | Emitted on auto-focus when closing, can be prevented |
| `pointerDownOutside` | `Event` | Emitted when pressing a pointer outside |
| `interactOutside` | `Event` | Emitted when interacting outside |
| `escapeKeyDown` | `Event` | Emitted when the Escape key is pressed |
| `focusOutside` | `Event` | Emitted when focus moves outside |

## Slots

### Popover (Root Component)

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | `{ open: boolean, close: () => void }` | Scoped slot, provides current state and close method |

### PopoverTrigger / PopoverContent / PopoverAnchor

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Default slot content |

## Accessibility

- **Keyboard**: Press `Escape` to close the popover
- **ARIA Attributes**: The popover uses `role="dialog"` semantics and automatically links `aria-labelledby` to the trigger
- **Focus Management**: The popover auto-focuses when opened
- **Interaction Behavior**: Clicking outside closes the popover; in modal mode, interaction with external elements is disabled

## Relationship with Popconfirm

[Popconfirm](/en/components/popconfirm) is essentially a Popover + confirm/cancel button combination. It internally uses `Popover`/`PopoverTrigger`/`PopoverContent` directly, adding a `TriangleAlert` warning icon and confirm/cancel button logic.

### When to use Popconfirm

- Simple "confirm/cancel" binary operations
- Out-of-the-box usage without assembling buttons and events manually
- Consistent dangerous action confirmation experience

### When to use Popover manually

- Custom button text, styling, or layout
- Complex content like forms or lists inside the popover
- Fine-grained control over open/close timing

```vue
<!-- Popconfirm: one-line confirm action -->
<Popconfirm title="Are you sure to delete?" @confirm="handleDelete">
    <Button variant="destructive">Delete</Button>
</Popconfirm>

<!-- Popover manual combination: fully custom -->
<Popover>
    <PopoverTrigger as-child>
        <Button variant="outline">Custom</Button>
    </PopoverTrigger>
    <PopoverContent>
        <!-- Any content: forms, lists, custom buttons, etc. -->
    </PopoverContent>
</Popover>
```
