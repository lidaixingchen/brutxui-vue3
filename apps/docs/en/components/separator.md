---
title: Separator
description: Separator component for modular visual division in brutalist layouts.
translated: true
---

# Separator

Neo-brutalist visual separator supporting horizontal and vertical orientations.

## Demo

<ComponentPreview>
  <SeparatorDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="separator" />

## Usage

```vue
<script setup>
import { Separator } from 'brutx-ui-vue'
</script>

<template>
    <div>
        <p class="text-sm font-medium">Content above</p>
        <Separator />
        <p class="text-sm font-medium">Content below</p>
    </div>
</template>
```

### Orientation

Horizontal (default):

```vue
<template>
    <Separator orientation="horizontal" />
</template>
```

Vertical:

```vue
<template>
    <div class="flex h-8 items-center gap-4">
        <span class="text-sm font-bold">Item 1</span>
        <Separator orientation="vertical" />
        <span class="text-sm font-bold">Item 2</span>
    </div>
</template>
```

### Separator with Text

When `orientation="horizontal"` and the default slot has content, the Separator renders as a centered text separator: separators on both sides with the slot content in the middle.

```vue
<template>
    <Separator>Section Title</Separator>
</template>
```

Text separators also support `variant` and `size`:

```vue
<template>
    <Separator variant="primary" size="lg">Primary Title</Separator>
</template>
```

> **Note**: In text separator mode, the `class` attribute is applied to the separators on both sides rather than the outer container. This is consistent with the behavior in normal mode where `class` is applied to the separator element.

## Variants

| Variant | Description |
|------|------|
| `default` | Foreground color (`bg-brutal-fg`) |
| `primary` | Primary color (`bg-brutal-primary`) |
| `muted` | Muted color (`bg-brutal-muted`) |

```vue
<template>
    <div class="space-y-2">
        <Separator variant="default" />
        <Separator variant="primary" />
        <Separator variant="muted" />
    </div>
</template>
```

## Sizes

| Size | Thickness |
|------|------|
| `sm` | `2px` |
| `default` | `var(--brutal-border-width, 3px)` |
| `lg` | `5px` |

```vue
<template>
    <div class="space-y-2">
        <Separator size="sm" />
        <Separator size="default" />
        <Separator size="lg" />
    </div>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'primary' \| 'muted'` | `'default'` | Color variant |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Controls thickness |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Orientation |
| `decorative` | `boolean` | `true` | Whether it is decorative (no semantic role) |
| `class` | `string` | — | Custom style class |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Text separator content; only renders as a centered text separator when `orientation="horizontal"` and the slot has content |

## Accessibility

- **ARIA Attributes**: When `decorative` is `true`, no semantic role is set; when `false`, `role="separator"` is automatically set
