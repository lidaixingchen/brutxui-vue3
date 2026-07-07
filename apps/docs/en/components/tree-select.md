---
title: Tree Select
description: A tree dropdown select using the recursive TreeSelectNode component with Popover, supporting single-select, multi-select, search filtering, and arbitrary depth tree structures.
translated: true
---

# Tree Select

A neo-brutalist style tree dropdown select component that uses the recursive `TreeSelectNode` component to render hierarchical structures, combined with `Popover` for dropdown interaction. Supports single-select, multi-select, and search filtering. Ideal for file selection, category selection, organization charts, and similar scenarios.

## Demo

<ComponentPreview>
    <TreeSelectDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tree-select" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'docs',
        label: 'Documentation',
        children: [
            { id: 'guide', label: 'Guide' },
            { id: 'api', label: 'API Reference' },
        ],
    },
    {
        id: 'src',
        label: 'Source',
        children: [
            {
                id: 'components',
                label: 'Components',
                children: [
                    { id: 'button', label: 'Button.vue' },
                    { id: 'input', label: 'Input.vue' },
                ],
            },
            { id: 'utils', label: 'Utilities' },
        ],
    },
]

const selected = ref(undefined)
</script>

<template>
    <TreeSelect
        v-model="selected"
        :nodes="nodes"
        placeholder="Select a file..."
        searchable
        clearable
    />
</template>
```

### Multi-select Mode

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'

const selected = ref([])
</script>

<template>
    <TreeSelect
        v-model="selected"
        :nodes="nodes"
        multiple
        searchable
        clearable
        placeholder="Select multiple files..."
    />
</template>
```

### Search Filtering

When `searchable` is enabled, user input recursively filters tree nodes. When a match is found, the ancestor path is preserved to maintain visibility.

### Disabling Nodes

Set `disabled: true` on a `TreeNode` to disable selection of that node:

```ts
const nodes = [
    { id: '1', label: 'Selectable node' },
    { id: '2', label: 'Disabled node', disabled: true },
]
```

### Controlled Expansion

Use the `open` prop and `update:open` event to implement controlled management of the dropdown expansion state:

```vue
<script setup>
import { ref } from 'vue'
import { TreeSelect } from 'brutx-ui-vue'

const selected = ref(undefined)
const isOpen = ref(false)

function handleClose() {
    isOpen.value = false
}
</script>

<template>
    <TreeSelect
        v-model="selected"
        v-model:open="isOpen"
        :nodes="nodes"
    />
</template>
```

### Arbitrary Depth Support

The component uses recursive rendering and supports tree structures of any depth, not limited to two levels.

## Variants

| Variant | Description |
|---------|-------------|
| `single` | Default single-select mode, `modelValue` is `string \| undefined` |
| `multiple` | Multi-select mode (set the `multiple` prop), `modelValue` is `string[]` |

## Sizes

| Size | Description |
|------|-------------|
| `sm` | Small trigger |
| `default` | Default trigger |
| `lg` | Large trigger |

## Data Types

```ts
interface TreeNode {
    id: string              // Unique identifier
    label: string           // Display text
    children?: TreeNode[]   // Child nodes (omit for leaf nodes)
    icon?: string           // Node icon
    disabled?: boolean      // Whether disabled
    data?: unknown          // Custom attached data
}
```

### TreeSelectLocale

The component uses the `useLocale` composable for i18n support. You can customize text via `TreeSelectLocale`:

```ts
interface TreeSelectLocale {
    placeholder: string        // Trigger placeholder text
    searchPlaceholder: string  // Search box placeholder text
    search: string             // Search box ARIA label
    emptyText: string          // No results text
    selectedCount: string      // Count text when multi-select exceeds maxDisplay, supports {count} interpolation
    clear: string              // Clear button ARIA label
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `TreeNode[]` | — (required) | Tree data source |
| `modelValue` | `string \| string[]` | `undefined` | Selected value (string for single-select, string[] for multi-select) |
| `open` | `boolean` | `undefined` | Controlled expansion state, use with `update:open` for `v-model:open` |
| `multiple` | `boolean` | `false` | Whether to support multi-select |
| `searchable` | `boolean` | `true` | Whether to show the search box |
| `placeholder` | `string` | locale: `treeSelect.placeholder` | Placeholder text |
| `searchPlaceholder` | `string` | locale: `treeSelect.searchPlaceholder` | Search box placeholder text |
| `emptyText` | `string` | locale: `treeSelect.emptyText` | Text shown when no results found |
| `clearable` | `boolean` | `false` | Whether to show the clear button |
| `disabled` | `boolean` | `false` | Whether disabled |
| `size` | `'sm' \| 'default' \| 'lg'` | `'default'` | Trigger size |
| `ariaLabel` | `string` | `undefined` | ARIA label |
| `maxDisplay` | `number` | `3` | Maximum number of tags to display in multi-select mode |
| `maxHeight` | `string` | `'15rem'` | Maximum height of the dropdown list |
| `dropdownClass` | `string` | `undefined` | Custom CSS class for the dropdown list |
| `iconSize` | `IconSize` | `'default'` | Icon size |
| `itemVariant` | `'default' \| 'primary' \| 'secondary'` | `'default'` | Dropdown item variant (selection highlight color) |
| `class` | `string` | `undefined` | Custom CSS class for the trigger |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `string \| string[] \| undefined` | Selected value change |
| `update:open` | `boolean` | Dropdown open/close state change, use with `open` prop for `v-model:open` |
| `select` | `TreeNode \| TreeNode[] \| undefined` | Selected node change |
| `open-change` | `boolean` | Dropdown open/close |

## Accessibility

- **Keyboard**: Nodes support `Arrow Up` / `Arrow Down` navigation; non-leaf nodes support `Arrow Right` to expand / `Arrow Left` to collapse; `Home` / `End` keys jump to the first/last node; the clear button supports `Enter` / `Space` activation
- **ARIA Attributes**: The trigger uses `role="combobox"` and `aria-expanded`; the dropdown list uses `role="tree"` and `role="treeitem"`; multi-select mode adds `aria-multiselectable`; disabled state uses `aria-disabled`
- **Focus Management**: Uses roving tabindex for focus management; disabled nodes have `tabindex="-1"`

## Exposed Methods (defineExpose)

| Property/Method | Type | Description |
| --- | --- | --- |
| `open` | `Ref<boolean>` | Whether the dropdown panel is expanded |
| `searchQuery` | `Ref<string>` | Current search keyword |
| `selectedNodes` | `ComputedRef<TreeNode[]>` | Selected nodes in multi-select mode (read-only) |
| `expandedIds` | `Ref<Set<string>>` | Currently expanded node IDs |
| `focus` | `() => void` | Focus the trigger |

## FAQ

**Q: Why can't some nodes be found during search filtering?**

A: Search filtering recursively matches nodes at all levels. When a child node matches, its ancestor path is automatically preserved to ensure visibility. If a node cannot be found, check that its `label` matches the search keyword. Search is case-insensitive fuzzy matching by default.

**Q: The `modelValue` type differs between single-select and multi-select modes. How do I handle this uniformly?**

A: In single-select mode, `modelValue` is `string | undefined`; in multi-select mode, it is `string[]`. In TypeScript projects, determine the type based on whether the `multiple` attribute is set. If you need to dynamically switch modes, consider using conditional types or defining separate ref variables.

**Q: How do I control the display height when the dropdown has many items?**

A: Use the `maxHeight` prop to control the maximum height of the dropdown list (default: `'15rem'`). When tree nodes exceed the maximum height, the list automatically shows a scrollbar. You can pass any valid CSS height value, such as `'200px'` or `'50vh'`.
