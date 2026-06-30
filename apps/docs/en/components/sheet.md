---
title: Sheet
translated: true
description: Sliding drawer component that supports sliding in from top, bottom, left, and right directions.
---

# Sheet

A neo-brutalist side panel component that can slide in from any edge. Built on top of reka-ui's Dialog primitive.

## Demo

<ComponentPreview>
  <SheetDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="sheet" />

## Usage

```vue
<script setup>
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
    Button,
} from 'brutx-ui-vue'
</script>

<template>
    <Sheet>
        <SheetTrigger as-child>
            <Button variant="outline">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent side="right">
            <SheetHeader>
                <SheetTitle>Edit Profile</SheetTitle>
                <SheetDescription>
                    Make changes to your profile here.
                </SheetDescription>
            </SheetHeader>
            <div class="py-4">
                <p class="text-sm">Sheet content goes here.</p>
            </div>
            <SheetFooter>
                <SheetClose as-child>
                    <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button variant="primary">Save</Button>
            </SheetFooter>
        </SheetContent>
    </Sheet>
</template>
```

### Direction Variants

| Direction | Description |
|-----------|-------------|
| `top` | Slides in from the top |
| `bottom` | Slides in from the bottom |
| `left` | Slides in from the left (max `sm:max-w-sm`) |
| `right` | Slides in from the right (default, max `sm:max-w-sm`) |

```vue
<script setup>
import { Sheet, SheetTrigger, SheetContent, Button } from 'brutx-ui-vue'
</script>

<template>
    <Sheet>
        <SheetTrigger as-child>
            <Button>Open Left Sheet</Button>
        </SheetTrigger>
        <SheetContent side="left">
            <p>Content slides in from the left.</p>
        </SheetContent>
    </Sheet>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `Sheet` | Root component (re-exported `DialogRoot` from reka-ui) |
| `SheetTrigger` | Trigger to open the panel (re-exported `DialogTrigger` from reka-ui) |
| `SheetPortal` | Portal rendering container (re-exported `DialogPortal` from reka-ui) |
| `SheetContent` | Panel content with direction variants, built-in close button |
| `SheetHeader` | Header container |
| `SheetFooter` | Footer container |
| `SheetTitle` | Panel title (re-exported `DialogTitle` from reka-ui) |
| `SheetDescription` | Panel description text (re-exported `DialogDescription` from reka-ui) |
| `SheetClose` | Close button (re-exported `DialogClose` from reka-ui) |

## Props

### Sheet

Root component, inherits all props from reka-ui's `DialogRoot`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controlled open state |
| `defaultOpen` | `boolean` | — | Default open state in uncontrolled mode |
| `modal` | `boolean` | `true` | Whether the dialog is modal |

### SheetContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'right'` | Panel slide direction |
| `class` | `string` | — | Custom CSS class |

> **Note:** `SheetContent` has a built-in close button (X icon in the top-right or top-left corner; when `side="left"`, it appears in the top-left corner), so there is no need to add one manually. The close button's accessible text supports internationalization (`sheet.close`).

### SheetHeader / SheetFooter / SheetTitle / SheetDescription

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

## Events

### Sheet

| Event | Payload | Description |
|-------|---------|-------------|
| `update:open` | `boolean` | Emitted when the open state changes, used for `v-model:open` two-way binding |
| `open-change` | `boolean` | Emitted when the open state changes |

### SheetContent

Inherits all events from reka-ui's `DialogContent`.

| Event | Payload | Description |
|-------|---------|-------------|
| `open-auto-focus` | `Event` | Emitted when auto-focused after content opens |
| `close-auto-focus` | `Event` | Emitted when auto-focused after content closes |
| `interact-outside` | `InteractOutsideEvent` | Emitted when interacting outside the content |
| `escape-key-down` | `KeyboardEvent` | Emitted when the Escape key is pressed |
| `pointer-down-outside` | `PointerDownOutsideEvent` | Emitted when pressing a pointer outside the content |

## Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Default slot for placing `SheetTrigger`, `SheetContent`, and other sub-components |

### SheetContent

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Default slot for placing panel content (`SheetHeader`, content area, `SheetFooter`, etc.) |

### SheetHeader / SheetFooter / SheetTitle / SheetDescription

| Slot | Scope | Description |
|------|-------|-------------|
| `default` | — | Default slot |

## Accessibility

- **Keyboard**: Supports `Escape` to close the panel
- **ARIA Attributes**: Automatically manages `aria-labelledby` (linked to `SheetTitle`) and `aria-describedby` (linked to `SheetDescription`)
- **Focus Management**: Focus is locked inside the panel when open; focus is restored to the trigger when closed
