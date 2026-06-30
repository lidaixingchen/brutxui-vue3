---
title: TreeView
description: Recursive tree component supporting node expand/collapse, single selection, checkbox, icons, and custom indentation. Ideal for file systems, category hierarchies, and more.
translated: true
---

# TreeView

A recursive expandable hierarchical data visualization component with built-in folder/file icons, supporting keyboard navigation and controlled single/checkbox selection states.

## Demo

<ComponentPreview>
  <TreeViewDemo />
</ComponentPreview>

## Installation

<InstallationTabs componentName="tree-view" />

## Usage

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'button', label: 'Button.vue' },
            { id: 'input', label: 'Input.vue' },
        ],
    },
    { id: 'pkg', label: 'package.json' },
]

const selected = ref(null)
</script>

<template>
    <TreeView
        v-model="selected"
        :nodes="nodes"
        :default-expanded="['src']"
    />
</template>
```

### Checkbox Mode

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'button', label: 'Button.vue' },
            { id: 'input', label: 'Input.vue', disabled: true },
        ],
    },
]

const checkedIds = ref<string[]>(['button'])
</script>

<template>
    <TreeView
        v-model:checked-ids="checkedIds"
        :nodes="nodes"
        selection-mode="checkbox"
        :default-expanded="['src']"
    />
</template>
```

## Variants

`selectionMode` supports two selection modes:

| Variant | Description |
|------|------|
| `single` | Default single selection mode; clicking a node syncs the selected id via `v-model` |
| `checkbox` | Checkbox mode; each node renders a `Checkbox` with cascading selection -- checking a parent selects all descendants; when only some descendants are checked, the parent shows an indeterminate state (`aria-checked="mixed"`). Checked items are two-way bound via `v-model:checkedIds`. Nodes with `disabled: true` cannot be checked |

## Data Types

```ts
interface TreeNode {
    id: string            // Unique identifier
    label: string         // Display text
    icon?: string         // Node icon (reserved field, currently unused)
    children?: TreeNode[] // Child nodes (omit for leaf nodes)
    data?: unknown        // Custom attached data
    disabled?: boolean    // Whether disabled (cannot be checked in checkbox mode)
}
```

> Note: Node icons are currently rendered automatically by the component based on type -- folder nodes use `Folder` / `FolderOpen` icons, leaf nodes use `File` icons. No manual specification is needed.

## Exported Types

In addition to `TreeNode`, the component also exports the following types for TypeScript projects:

```ts
import type { SelectionMode, CheckState } from 'brutx-ui-vue'

type SelectionMode = 'single' | 'checkbox'
type CheckState = 'checked' | 'unchecked' | 'indeterminate'
```

## Props

| Prop | Type | Default | Description |
|------|------|--------|------|
| `nodes` | `TreeNode[]` | — | Tree data source |
| `modelValue` | `string \| null` | `null` | Currently selected node id (v-model) |
| `selectionMode` | `'single' \| 'checkbox'` | `'single'` | Selection mode: single or checkbox |
| `checkedIds` | `string[]` | `[]` | List of checked node ids in checkbox mode (v-model:checkedIds) |
| `defaultExpanded` | `string[]` | `[]` | List of initially expanded node ids |
| `class` | `string` | — | Custom CSS class for the root node |

## Events

| Event | Payload | Description |
|------|------|------|
| `update:modelValue` | `string \| null` | Fired when the selected node id changes |
| `update:checkedIds` | `string[]` | Fired when checked items change (checkbox mode) |
| `update:expanded` | `string[]` | Fired when the expanded node list changes |
| `select` | `TreeNode` | Fired when any node is clicked |
| `expand` | `[id: string, expanded: boolean]` | Fired when a node is expanded/collapsed |
| `check` | `[node: TreeNode, checked: boolean]` | Fired when a node is checked/unchecked (checkbox mode) |

## Accessibility

- **Keyboard Operation**: Follows WAI-ARIA TreeView role specification

| Key | Description |
|------|------|
| `ArrowUp` | Focus the previous visible node |
| `ArrowDown` | Focus the next visible node |
| `ArrowRight` | Expand the node if collapsed; if already expanded, focus the first child node |
| `ArrowLeft` | Collapse the node if expanded; if already collapsed, focus the parent node |
| `Enter` / `Space` | Select the node (single mode) or toggle check state (checkbox mode) |
| `Home` | Focus the first node |
| `End` | Focus the last node |

- **ARIA Attributes**: Uses `role="tree"` and `role="treeitem"` semantic markup; checkbox mode uses `aria-checked` attribute (`true` / `false` / `mixed`)
- **Focus Management**: Uses roving tabindex for focus management

## FAQ

**Q: In checkbox mode, why does the parent node become indeterminate?**

A: This is by design with cascading selection. When only some of a parent node's children are checked, the parent displays an indeterminate state (`aria-checked="mixed"`), indicating "partially selected". The parent only shows as fully checked when all children are checked. Conversely, checking a parent automatically checks all its descendants.

**Q: How do I expand specific nodes on initial load?**

A: Use the `defaultExpanded` prop to pass an array of node `id` values that should be initially expanded. For example, `:default-expanded="['src', 'components']"` will automatically expand those nodes when the component loads. Subsequent expand/collapse operations will trigger the `update:expanded` event.

**Q: What happens to disabled nodes in checkbox mode?**

A: Nodes with `disabled: true` cannot be checked in checkbox mode, and their checkbox will display as disabled. If a parent node is disabled, its children can still be independently checked. Disabled nodes do not affect click-to-select behavior in single mode (single mode does not use the `disabled` property).
