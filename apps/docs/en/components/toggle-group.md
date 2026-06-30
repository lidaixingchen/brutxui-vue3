---
title: Toggle Group
description: Toggle button group supporting single or multiple selection, ideal for controlling views or formatting.
translated: true
---

# Toggle Group

Neobrutalist-styled toggle button group built on reka-ui's ToggleGroup primitive, supporting single or multiple selection. Variants and sizes are distributed to all child items via provide/inject, with support for horizontal and vertical orientations.

## Demo

<ComponentPreview>
  <ToggleGroupDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="toggle-group" />

## Usage

### Single Selection

When `type="single"`, only one button can be selected at a time. `modelValue` is `string`.

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { AlignLeft, AlignCenter, AlignRight } from '@lucide/vue'

const align = ref('left')
</script>

<template>
    <ToggleGroup type="single" v-model="align" variant="default">
        <ToggleGroupItem value="left">
            <AlignLeft class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center">
            <AlignCenter class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right">
            <AlignRight class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### Multiple Selection

When `type="multiple"`, multiple buttons can be selected simultaneously. `modelValue` is `string[]`.

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'
import { Bold, Italic, Underline } from '@lucide/vue'

const styles = ref([])
</script>

<template>
    <ToggleGroup type="multiple" v-model="styles" variant="default">
        <ToggleGroupItem value="bold">
            <Bold class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic">
            <Italic class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">
            <Underline class="h-4 w-4" />
        </ToggleGroupItem>
    </ToggleGroup>
</template>
```

### Orientation

Control the layout direction via the `orientation` prop. When set to `vertical`, the container uses `flex-col` and passes the value to the reka-ui primitive to set `aria-orientation`.

```vue
<script setup>
import { ref } from 'vue'
import { ToggleGroup, ToggleGroupItem } from 'brutx-ui-vue'

const styles = ref([])
</script>

<template>
    <ToggleGroup type="multiple" v-model="styles" orientation="vertical">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
</template>
```

## Variants

| Variant | Description |
| --- | --- |
| `default` | With background and small shadow, primary color background when pressed |
| `outline` | Transparent with border, secondary color background when pressed |

Variants are set on `ToggleGroup` and distributed to all `ToggleGroupItem` children via provide/inject. Children can also override individually.

## Sizes

| Size | Height | Min Width | Font Size |
| --- | --- | --- | --- |
| `sm` | `h-8` | `min-w-8` | `text-xs` |
| `default` | `h-10` | `min-w-10` | `text-sm` |
| `lg` | `h-12` | `min-w-12` | `text-sm` |

## Sub-components

| Component | Description |
| --- | --- |
| `ToggleGroup` | Root component, manages selected state and group configuration |
| `ToggleGroupItem` | Child item button, inherits variant and size from parent |

## Props

### ToggleGroup

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'single' \| 'multiple'` | `'single'` | Single or multiple selection |
| `modelValue` | `string \| string[]` | — | v-model value |
| `variant` | `'default' \| 'outline'` | `'default'` | Variant, distributed to child items |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size, distributed to child items |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction; when `vertical`, container uses `flex-col` and passes value to reka-ui primitive |
| `disabled` | `boolean` | `false` | Whether disabled |
| `class` | `string` | — | Additional class name |

### ToggleGroupItem

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — (required) | Item value |
| `variant` | `'default' \| 'outline'` | Inherited from ToggleGroup | Variant; uses parent ToggleGroup's variant when not set |
| `size` | `'sm' \| 'default' \| 'lg'` | Inherited from ToggleGroup | Size; uses parent ToggleGroup's size when not set |
| `disabled` | `boolean` | `false` | Whether disabled; final state is the logical OR of parent ToggleGroup's disabled and its own disabled |
| `class` | `string` | — | Additional class name |

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `update:modelValue` | `string \| string[]` | Triggered when selected value changes |

## Slots

### ToggleGroup Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | — | Default slot for placing ToggleGroupItem children |

### ToggleGroupItem Slots

| Slot | Scope | Description |
| --- | --- | --- |
| `default` | — | Default slot for placing button content (icons, text, etc.) |

## Accessibility

- **ARIA attributes**: Automatically manages `aria-pressed` state; sets `aria-orientation="vertical"` when direction is `vertical`
- **Keyboard**: Supports arrow keys for navigation within the group, `Space` / `Enter` to toggle selected state
