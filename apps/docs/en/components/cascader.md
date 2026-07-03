---
title: Cascader
description: A Neo-Brutalist cascading selection component for multi-level hierarchical options, supporting path binding, single/multiple selection, and keyboard navigation.
---

# Cascader

A Neo-Brutalist styled cascading dropdown selection component. It displays multi-level hierarchical options in grid-cascaded panels, supporting path binding (single/multiple select), parent-child relation control, and complete keyboard interactions.

## Preview

Due to the VitePress runtime environment constraints, please check the component preview within the Demo packages.

## Installation

<InstallationTabs componentName="cascader" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { Cascader } from 'brutx-ui-vue'

const options = [
    {
        value: 'us',
        label: 'USA',
        children: [
            {
                value: 'ny',
                label: 'New York',
                children: [
                    { value: 'man', label: 'Manhattan' },
                    { value: 'qns', label: 'Queens' },
                ]
            },
            {
                value: 'ca',
                label: 'California',
            }
        ]
    },
    {
        value: 'cn',
        label: 'China',
        children: [
            { value: 'bj', label: 'Beijing' },
            { value: 'sh', label: 'Shanghai' },
        ]
    }
]

const selected = ref([])
</script>

<template>
    <Cascader
        v-model="selected"
        :options="options"
        placeholder="Select region"
        clearable
    />
</template>
```

### Multiple Selection

Set the `multiple` attribute to enable multi-select. The `v-model` bound value will be a two-dimensional array representing the selected full path arrays. By default, checking a parent node checks all its descendant leaf nodes.

```vue
<script setup>
import { ref } from 'vue'
import { Cascader } from 'brutx-ui-vue'

const selected = ref([]) // e.g. [['us', 'ny', 'man'], ['cn', 'bj']]
</script>

<template>
    <Cascader
        v-model="selected"
        :options="options"
        multiple
        placeholder="Select multiple regions"
    />
</template>
```

### Check Strictly (Any level selection)

By default, only leaf nodes can be selected. Set `checkStrictly` to `true` to allow selecting nodes of any level (parent nodes can be bound as paths).

```vue
<template>
    <Cascader
        v-model="selected"
        :options="options"
        check-strictly
        placeholder="Select any level"
    />
</template>
```

## API

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `CascaderOption[]` | `[]` | Hierarchical options list |
| `modelValue` | `CascaderValue[] \| CascaderValue[][]` | `[]` | Selected value path(s) |
| `open` | `boolean` | `undefined` | Controlled dropdown open state |
| `multiple` | `boolean` | `false` | Enable multiple path selections |
| `clearable` | `boolean` | `false` | Display clear selection button |
| `checkStrictly` | `boolean` | `false` | Enable selecting parent nodes (uncorrelated parent-child) |
| `separator` | `string` | `' / '` | Custom character separating paths |
| `maxDisplay` | `number` | `2` | Max selected paths displayed in trigger before collapsing |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Size of the trigger button |
| `placeholder` | `string` | `undefined` | Trigger placeholder text |
| `disabled` | `boolean` | `false` | Disable component interaction |
| `dropdownClass` | `string` | `undefined` | Custom CSS class for dropdown wrapper |
| `class` | `string` | `undefined` | Custom CSS class for trigger button |
| `ariaLabel` | `string` | `undefined` | ARIA label |

### Events

| Event | Parameters | Description |
|---|---|---|
| `update:modelValue` | `CascaderValue[] \| CascaderValue[][]` | Emitted when value selection changes |
| `update:open` | `boolean` | Emitted when open state changes, supporting `v-model:open` |
| `change` | `CascaderValue[] \| CascaderValue[][]` | Selection change event |
| `open-change` | `boolean` | Emitted when dropdown state toggles |

### Type Declarations

```typescript
export type CascaderValue = string | number

export interface CascaderOption {
    value: CascaderValue
    label: string
    children?: CascaderOption[]
    disabled?: boolean
    data?: unknown
}
```

## Accessibility (A11y)

- **Keyboard Navigation**:
  - `ArrowDown` / `ArrowUp`: Move focus up and down within the active column.
  - `ArrowRight`: Expand the focused option's sub-column.
  - `ArrowLeft`: Collapse the sub-column, returning to parent option.
  - `Enter` / `Space`: Select the current option or expand if not check-strictly.
  - `Escape`: Close dropdown panel.
- **ARIA Attributes**:
  - Combobox has `role="combobox"`, `aria-expanded` and `aria-disabled` indicators.
  - Options have `role="menuitem"`.
