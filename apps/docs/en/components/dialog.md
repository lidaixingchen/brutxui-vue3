---
title: Dialog
translated: true
description: Modal dialog with focus locking, ARIA role markup, and hard-edge overlay design.
---

# Dialog

A neo-brutalist modal dialog built on top of reka-ui's Dialog primitive. Supports overlay, close button, and composable sub-components.

## Demo

<ComponentPreview>
  <DialogDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="dialog" />

## Usage

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                    Make changes to your profile here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose as-child>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="primary">Save</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
```

## Sizes

Control the max-width of the dialog via the `size` prop on `DialogContent`. Defaults to `default` (`max-w-lg`).

| Size | Max Width | Use Case |
|------|-----------|----------|
| `sm` | `max-w-sm` | Confirmation dialogs, simple prompts |
| `default` | `max-w-lg` | Standard forms, general content |
| `lg` | `max-w-2xl` | Multi-column forms, detailed settings |
| `xl` | `max-w-4xl` | Complex content, data display |
| `full` | `max-w-[calc(100vw-2rem)]` | Large content, full-screen interactions |

```vue
<script setup>
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'brutx-ui-vue'
import { Button } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger as-child>
            <Button variant="primary">Open Small Dialog</Button>
        </DialogTrigger>
        <DialogContent size="sm">
            <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>This action cannot be undone. Are you sure you want to continue?</DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
</template>
```

## Sub-components

| Component | Description |
|-----------|-------------|
| `Dialog` | Root component (re-exported from reka-ui's `DialogRoot`) |
| `DialogTrigger` | Button that opens the dialog (re-exported from reka-ui) |
| `DialogContent` | Dialog content panel with overlay |
| `DialogHeader` | Header container |
| `DialogFooter` | Footer container with flex layout |
| `DialogTitle` | Dialog title |
| `DialogDescription` | Dialog description text |
| `DialogClose` | Close button (re-exported from reka-ui) |
| `DialogOverlay` | Background overlay |
| `DialogPortal` | Portal container (re-exported from reka-ui) |
| `DialogEnhanced` | Enhanced dialog with draggable and resizable support |

### DialogEnhanced Usage

An enhanced dialog that supports dragging and resizing:

```vue
<script setup>
import { Dialog, DialogTrigger, DialogEnhanced, DialogHeader, DialogTitle } from 'brutx-ui-vue'
</script>

<template>
    <Dialog>
        <DialogTrigger>Open Draggable Dialog</DialogTrigger>
        <DialogEnhanced
            draggable
            resizable
            :min-width="300"
            :min-height="200"
            drag-handle=".dialog-header"
        >
            <DialogHeader class="dialog-header">
                <DialogTitle>Draggable Dialog</DialogTitle>
            </DialogHeader>
            <p>Drag the title bar to move, drag the edges to resize</p>
        </DialogEnhanced>
    </Dialog>
</template>
```

## Props

### Dialog (Root Component)

Re-exported from reka-ui's `DialogRoot`. Manages the open/close state of the dialog.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controlled open state |
| `defaultOpen` | `boolean` | `false` | Default open state in uncontrolled mode |
| `modal` | `boolean` | `true` | Whether the dialog is modal |

### DialogTrigger

Trigger button re-exported from reka-ui.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `asChild` | `boolean` | — | Whether to delegate rendering to child element |
| `as` | `string` | `'button'` | HTML element to render |

### DialogContent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showCloseButton` | `boolean` | `true` | Whether to show the close button |
| `size` | `'sm' \| 'default' \| 'lg' \| 'xl' \| 'full'` | `'default'` | Dialog size |
| `forceMount` | `boolean` | — | Force mount (for animation control) |
| `class` | `string` | — | Custom CSS class |

### DialogClose

Close button re-exported from reka-ui.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `asChild` | `boolean` | — | Whether to delegate rendering to child element |
| `as` | `string` | `'button'` | HTML element to render |

### DialogEnhanced

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `draggable` | `boolean` | `false` | Whether the dialog is draggable |
| `dragHandle` | `string \| HTMLElement` | — | Drag handle (CSS selector or element) |
| `bounds` | `'parent' \| 'viewport' \| { top, left, right, bottom }` | `'viewport'` | Drag boundaries |
| `initialPosition` | `{ x: number; y: number }` | — | Initial position |
| `resizable` | `boolean` | `false` | Whether the dialog is resizable |
| `minWidth` | `number` | `200` | Minimum width |
| `minHeight` | `number` | `150` | Minimum height |
| `maxWidth` | `number` | — | Maximum width |
| `maxHeight` | `number` | — | Maximum height |
| `aspectRatio` | `number` | — | Lock aspect ratio |
| `showCloseButton` | `boolean` | `true` | Whether to show the close button |
| `forceMount` | `boolean` | — | Force mount |
| `fullscreen` | `boolean` | `false` | Fullscreen mode (occupies entire viewport) |
| `beforeClose` | `((done) => void) \| (() => boolean \| Promise<boolean>)` | — | Close hook (supports callback and Promise mode) |
| `destroyOnClose` | `boolean` | `false` | Destroy content after closing |
| `zIndex` | `number` | — | Custom z-index |
| `class` | `string` | — | Custom CSS class |

### DialogHeader / DialogFooter / DialogTitle / DialogDescription / DialogOverlay

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `class` | `string` | — | Custom CSS class |

## Events

### DialogRoot

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `(value: boolean)` | Emitted when the dialog open state changes |

### DialogEnhanced Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:open` | `(value: boolean)` | Emitted when the dialog open state changes |
| `open` | — | Emitted when the dialog starts opening |
| `opened` | — | Emitted when the dialog open animation completes |
| `close` | — | Emitted when the dialog starts closing |
| `closed` | — | Emitted when the dialog close animation completes |

## Slots

### Dialog

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | `{ open: boolean, close: () => void }` | Default slot, provides current open state and close method |

### DialogContent / DialogHeader / DialogFooter / DialogTitle / DialogDescription / DialogOverlay / DialogEnhanced Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | — | Default slot |

## Accessibility

- **Keyboard**: Press `Escape` to close the dialog
- **Focus Management**: When the dialog opens, focus is trapped inside; when closed, focus is restored
- **ARIA Attributes**: Close button includes screen reader text
- **Interactive Elements**: Interactive elements (Input, Button, etc.) are automatically excluded during drag

## FAQ

**Q: The page is still scrollable after opening the dialog. What should I do?**

A: By default, the `Dialog` component has `modal` set to `true`, which locks background scrolling when open. If the background is still scrollable, check whether the `overflow` CSS property has been manually overridden, or if other global styles are interfering with the dialog overlay behavior.

**Q: How to programmatically open and close the dialog?**

A: Use controlled mode: bind the `open` prop of `Dialog` to a `ref` variable, then modify that variable to control the dialog state. You can also listen to the `update:open` event to respond to the dialog closing (e.g., pressing Escape or clicking the overlay).

**Q: The drag area of DialogEnhanced is incorrect. How do I set the drag handle?**

A: Use the `drag-handle` prop to specify the drag handle. It can be a CSS selector string (e.g., `".dialog-header"`) or a DOM element reference. Make sure the selector correctly matches an element inside the dialog; only pressing and holding that area will trigger dragging. If not set, the entire dialog content area is draggable by default.
