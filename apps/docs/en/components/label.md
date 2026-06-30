---
title: Label
description: Text label associated with form controls, supporting disabled state and click-to-focus behavior.
translated: true
---

# Label

Neo-brutalist label component for form fields, with variant support.

## Demo

<ComponentPreview>
  <LabelDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="label" />

## Usage

```vue
<script setup>
import { Label, Input } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" />
    </div>
</template>
```

### Required Indicator

When the `required` prop is set, a red `*` asterisk is automatically rendered at the end of the label (marked as `aria-hidden`), and the root element gets `aria-required="true"` to help accessibility tools identify required fields.

```vue
<script setup>
import { Label, Input } from 'brutx-ui-vue'
</script>

<template>
    <div class="space-y-2">
        <Label for="username" required>Username</Label>
        <Input id="username" placeholder="Enter your username" />
    </div>
</template>
```

## Variants

| Variant | Description |
|------|------|
| `default` | Standard foreground text |
| `error` | Destructive (red) text |
| `success` | Success (green) text |
| `muted` | Muted foreground text |

## Sizes

| Size | Font Size | Line Height |
|------|----------|------|
| `sm` | `text-xs` | `leading-none` |
| `default` | `text-sm` | `leading-none` |
| `lg` | `text-base` | `leading-none` |

```vue
<script setup>
import { Label } from 'brutx-ui-vue'
</script>

<template>
    <div class="flex flex-wrap items-center gap-4">
        <Label size="sm">Small Label</Label>
        <Label size="default">Default Label</Label>
        <Label size="lg">Large Label</Label>
    </div>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `variant` | `'default' \| 'error' \| 'success' \| 'muted'` | `'default'` | Label variant style |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Label size |
| `required` | `boolean` | `false` | Whether to show the required indicator |
| `for` | `string` | — | ID of the associated form control |
| `class` | `string` | — | Custom CSS class name |

## Slots

| Slot | Scope | Description |
|------|--------|------|
| `default` | — | Label content |

## Accessibility

The Label component renders as an HTML `<label>` element. When using the `for` attribute, it associates with the matching form control, improving accessibility and click-to-focus behavior.

- When `required` is `true`, the component automatically adds the `aria-required="true"` attribute
- The required indicator `*` is marked as `aria-hidden="true"` to avoid duplicate announcements by screen readers
- The component supports `peer-disabled` state, displaying a disabled style when the associated form control is disabled
