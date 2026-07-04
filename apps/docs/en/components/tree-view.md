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
    isLeaf?: boolean      // Whether the node is a leaf (used in lazy mode to determine if expandable)
    loaded?: boolean      // Whether children have been loaded (marks lazy load completion)
    loading?: boolean     // Whether children are currently loading
    hidden?: boolean      // Whether the node is hidden (set by node filtering)
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
| `draggable` | `boolean` | `false` | Whether to enable drag-and-drop sorting |
| `allowDrag` | `(node: TreeNode) => boolean` | — | Function to determine if a node is draggable; all nodes are draggable if omitted |
| `allowDrop` | `(node: TreeNode, target: TreeNode, dropType: 'before' \| 'after' \| 'inner') => boolean` | — | Function to determine if a drop is allowed at the target position |
| `lazy` | `boolean` | `false` | Whether to enable lazy loading mode |
| `load` | `(node: TreeNode) => Promise<TreeNode[]>` | — | Lazy load function, called automatically when expanding an unloaded node |
| `retryOnError` | `boolean` | `false` | Whether to allow retry on lazy load failure (resets loaded state) |
| `filterable` | `boolean` | `false` | Whether to enable node filtering |
| `filterMethod` | `(query: string, node: TreeNode) => boolean` | — | Custom filter method; defaults to label fuzzy matching if omitted |
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
| `node-drag-start` | `[event: DragEvent, node: TreeNode]` | Fired when drag starts |
| `node-drag-enter` | `[event: DragEvent, node: TreeNode]` | Fired when drag enters a node area |
| `node-drag-leave` | `[event: DragEvent, node: TreeNode]` | Fired when drag leaves a node area |
| `node-drag-over` | `[event: DragEvent, node: TreeNode]` | Fired when drag moves over a node |
| `node-drag-end` | `[event: DragEvent, node: TreeNode]` | Fired when drag ends |
| `node-drop` | `[event: DragEvent, node: TreeNode, dropType: 'before' \| 'after' \| 'inner']` | Fired when dropped onto a target node |

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

## Drag and Drop Sorting

Enable `draggable` to allow nodes to be dragged and reordered. Use `allowDrag` and `allowDrop` to finely control drag behavior. When `v-model:nodes` is enabled, the component automatically reorders tree data on drop; otherwise, handle the `node-drop` event manually.

```vue
<script setup>
import { ref } from 'vue'
import { TreeView, moveNode } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes = ref<TreeNode[]>([
    {
        id: 'src',
        label: 'src',
        children: [
            { id: 'button', label: 'Button.vue' },
            { id: 'input', label: 'Input.vue' },
        ],
    },
    { id: 'pkg', label: 'package.json' },
])

function handleDrop(event: DragEvent, node: TreeNode, dropType: 'before' | 'after' | 'inner') {
    // If v-model:nodes is not used, call moveNode manually to reorder
    // nodes.value = moveNode(nodes.value, draggedNode, node, dropType)
}
</script>

<template>
    <TreeView
        v-model:nodes="nodes"
        :nodes="nodes"
        draggable
        :allow-drag="(node) => node.id !== 'pkg'"
        @node-drop="handleDrop"
    />
</template>
```

**Drag and Drop Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `draggable` | `boolean` | `false` | Whether to enable drag-and-drop sorting |
| `allowDrag` | `(node: TreeNode) => boolean` | — | Function to determine if a node is draggable; all nodes are draggable if omitted |
| `allowDrop` | `(node: TreeNode, target: TreeNode, dropType: 'before' \| 'after' \| 'inner') => boolean` | — | Function to determine if a drop is allowed at the target position |

**Drag Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `node-drag-start` | `[event: DragEvent, node: TreeNode]` | Fired when drag starts |
| `node-drag-enter` | `[event: DragEvent, node: TreeNode]` | Fired when drag enters a node area |
| `node-drag-leave` | `[event: DragEvent, node: TreeNode]` | Fired when drag leaves a node area |
| `node-drag-over` | `[event: DragEvent, node: TreeNode]` | Fired when drag moves over a node |
| `node-drag-end` | `[event: DragEvent, node: TreeNode]` | Fired when drag ends |
| `node-drop` | `[event: DragEvent, node: TreeNode, dropType: 'before' \| 'after' \| 'inner']` | Fired when dropped onto a target node |

**Utility Function:**

```ts
import { moveNode } from 'brutx-ui-vue'

// Pure function for manually reordering tree data
const newNodes = moveNode(nodes, draggedNode, targetNode, 'before')
```

## Lazy Loading

Enable `lazy` and provide a `load` function to automatically load children asynchronously when expanding unloaded nodes. The component uses `loadingKeys` internally to prevent concurrent requests and marks the `loaded` state upon completion.

```vue
<script setup>
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    { id: 'root', label: 'Root', isLeaf: false },
]

async function loadChildren(node: TreeNode): Promise<TreeNode[]> {
    const response = await fetch(`/api/children/${node.id}`)
    return response.json()
}
</script>

<template>
    <TreeView
        :nodes="nodes"
        lazy
        :load="loadChildren"
        retry-on-error
    />
</template>
```

**Lazy Loading Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lazy` | `boolean` | `false` | Whether to enable lazy loading mode |
| `load` | `(node: TreeNode) => Promise<TreeNode[]>` | — | Lazy load function, called automatically when expanding an unloaded node |
| `retryOnError` | `boolean` | `false` | Whether to allow retry on lazy load failure |

**TreeNode Lazy Loading Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `isLeaf` | `boolean` | Whether the node is a leaf; used in lazy mode to determine if expandable |
| `loaded` | `boolean` | Whether children have been loaded |
| `loading` | `boolean` | Whether children are currently loading |

## Node Filtering

Enable `filterable` and use the component instance's `filter` method to trigger filtering. Filtering recursively computes match state -- matched nodes and their ancestors are shown, the rest are hidden, and parent nodes of matched nodes are automatically expanded.

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const treeRef = ref()
const query = ref('')

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

function handleSearch() {
    treeRef.value?.filter(query.value)
}
</script>

<template>
    <div>
        <input v-model="query" @input="handleSearch" placeholder="Search nodes..." />
        <TreeView
            ref="treeRef"
            :nodes="nodes"
            filterable
            :default-expanded="['src']"
        />
    </div>
</template>
```

**Filtering Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filterable` | `boolean` | `false` | Whether to enable node filtering |
| `filterMethod` | `(query: string, node: TreeNode) => boolean` | — | Custom filter method; defaults to label fuzzy matching if omitted |

**Exposed Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `filter` | `query: string` | Triggers filtering; recursively computes match state, shows matched nodes and ancestors, hides the rest, auto-expands parent nodes of matches |

## Reload Node

Use the component instance's `reloadNode` method to reset a node's `loaded` state and re-trigger lazy loading. Useful for refreshing child node data.

```vue
<script setup>
import { ref } from 'vue'
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const treeRef = ref()

function refreshNode(nodeKey: string) {
    treeRef.value?.reloadNode(nodeKey)
}
</script>

<template>
    <TreeView
        ref="treeRef"
        :nodes="nodes"
        lazy
        :load="loadChildren"
    />
    <button @click="refreshNode('src')">Reload src Node</button>
</template>
```

**Exposed Methods:**

| Method | Parameters | Description |
|--------|------------|-------------|
| `reloadNode` | `nodeKey: string` | Resets the specified node's `loaded` state and re-triggers lazy loading |

## FAQ

**Q: In checkbox mode, why does the parent node become indeterminate?**

A: This is by design with cascading selection. When only some of a parent node's children are checked, the parent displays an indeterminate state (`aria-checked="mixed"`), indicating "partially selected". The parent only shows as fully checked when all children are checked. Conversely, checking a parent automatically checks all its descendants.

**Q: How do I expand specific nodes on initial load?**

A: Use the `defaultExpanded` prop to pass an array of node `id` values that should be initially expanded. For example, `:default-expanded="['src', 'components']"` will automatically expand those nodes when the component loads. Subsequent expand/collapse operations will trigger the `update:expanded` event.

**Q: What happens to disabled nodes in checkbox mode?**

A: Nodes with `disabled: true` cannot be checked in checkbox mode, and their checkbox will display as disabled. If a parent node is disabled, its children can still be independently checked. Disabled nodes do not affect click-to-select behavior in single mode (single mode does not use the `disabled` property).
