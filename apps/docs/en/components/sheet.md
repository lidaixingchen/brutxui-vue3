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
import { DialogRoot as Sheet, DialogTrigger as SheetTrigger, DialogClose as SheetClose } from 'reka-ui'
import {
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
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
import { DialogRoot as Sheet, DialogTrigger as SheetTrigger } from 'reka-ui'
import { SheetContent, Button } from 'brutx-ui-vue'
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
| `Sheet` | Root primitive (`DialogRoot` imported from reka-ui as Sheet) |
| `SheetTrigger` | Trigger primitive (`DialogTrigger` imported from reka-ui) |
| `SheetPortal` | Portal primitive (`DialogPortal` imported from reka-ui) |
| `SheetContent` | Panel content with direction variants, built-in close button |
| `SheetHeader` | Header container |
| `SheetFooter` | Footer container |
| `SheetTitle` | Styled panel title wrapping Reka UI DialogTitle |
| `SheetDescription` | Styled panel description wrapping Reka UI DialogDescription |
| `SheetClose` | Close primitive (`DialogClose` imported from reka-ui) |

## Reka UI Primitives

`Sheet`, `SheetTrigger`, `SheetPortal`, and `SheetClose` are local aliases for `DialogRoot`, `DialogTrigger`, `DialogPortal`, and `DialogClose`, imported from `reka-ui`. The five styled components listed in the generated API below are imported from BrutxUI.

`Sheet` accepts the boolean `open` value for controlled state with `v-model:open`, and emits `update:open` with the new boolean state. `defaultOpen` initializes uncontrolled state and defaults to false; `modal` defaults to true. Its default slot contains the trigger and panel, and receives the current `open` state and a `close()` function.

`SheetContent` forwards additional attributes and event listeners to `DialogContent`. Event names such as `openAutoFocus` can be listened to using `@open-auto-focus` in templates. The built-in close button uses localized `sheet.close` text and sits at the top-left for `side="left"`, or at the top-right for other sides.

## API Reference

<span id="sheet-1"></span>
<span id="sheetcontent"></span>
<span id="sheetheader-sheetfooter-sheettitle-sheetdescription"></span>
<span id="sheet-2"></span>
<span id="sheetcontent-1"></span>
<span id="sheetcontent-2"></span>
<span id="sheetheader-sheetfooter-sheettitle-sheetdescription-1"></span>

<ComponentApi name="sheet" />

## Accessibility

- **Keyboard**: Supports `Escape` to close the panel
- **ARIA Attributes**: Automatically manages `aria-labelledby` (linked to `SheetTitle`) and `aria-describedby` (linked to `SheetDescription`)
- **Focus Management**: Focus is locked inside the panel when open; focus is restored to the trigger when closed
