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

## API Reference

<span id="popover-root-component"></span>
<span id="popovertrigger"></span>
<span id="popovercontent"></span>
<span id="popoveranchor"></span>
<span id="popover-root-component-1"></span>
<span id="popovercontent-1"></span>
<span id="popover-root-component-2"></span>
<span id="popovertrigger-popovercontent-popoveranchor"></span>

<ComponentApi name="popover" />

### Reka UI Primitive Features

`Popover` wraps Reka UI’s `PopoverRoot`, while `PopoverTrigger` and `PopoverContent` wrap their corresponding primitives. Import `PopoverAnchor` from `reka-ui`. The API above lists members declared by the local components. `PopoverContent` forwards undeclared Vue attributes and event listeners to the Reka UI primitive, including `openAutoFocus`, `closeAutoFocus`, `pointerDownOutside`, `interactOutside`, `escapeKeyDown`, and `focusOutside`.

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
