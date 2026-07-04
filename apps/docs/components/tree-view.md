---
title: TreeView 树形目录
description: 递归树形组件，支持节点展开折叠、单选、复选、图标、自定义缩进，适合文件系统、分类层级等场景。
---

# TreeView 树形目录

可递归展开的层级数据可视化组件，内置文件夹 / 文件图标，支持键盘导航与受控单选、复选状态。

## 预览

<ComponentPreview>
  <TreeViewDemo />
</ComponentPreview>

## 安装

<InstallationTabs componentName="tree-view" />

## 用法

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

### 复选模式

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

## 变体

`selectionMode` 支持两种选择模式：

| 变体 | 说明 |
|------|------|
| `single` | 默认单选模式，点击节点时通过 `v-model` 同步选中 id |
| `checkbox` | 复选模式，每个节点前渲染 `Checkbox`，支持级联勾选——父节点勾选则所有子孙节点全部勾选；子孙节点部分勾选时父节点呈半选状态（`aria-checked="mixed"`）。勾选项通过 `v-model:checkedIds` 双向绑定。`disabled` 为 `true` 的节点不可勾选 |

## 数据类型

```ts
interface TreeNode {
    id: string            // 唯一标识
    label: string         // 显示文本
    icon?: string         // 节点图标（预留字段，当前未使用）
    children?: TreeNode[] // 子节点（省略则为叶节点）
    data?: unknown        // 自定义附加数据
    disabled?: boolean    // 是否禁用（checkbox 模式下不可勾选）
    isLeaf?: boolean      // 是否为叶节点（懒加载模式下用于判断是否可展开）
    loaded?: boolean      // 是否已加载（懒加载模式下标记子节点是否已加载完成）
    loading?: boolean     // 是否正在加载（懒加载模式下标记子节点加载状态）
    hidden?: boolean      // 是否隐藏（节点过滤模式下标记不匹配的节点）
}
```

> 说明：节点图标当前由组件内部自动根据类型渲染——文件夹节点使用 `Folder` / `FolderOpen` 图标，叶节点使用 `File` 图标，无需手动指定。

## 导出类型

除了 `TreeNode`，组件还导出以下类型供 TypeScript 项目使用：

```ts
import type { SelectionMode, CheckState } from 'brutx-ui-vue'

type SelectionMode = 'single' | 'checkbox'
type CheckState = 'checked' | 'unchecked' | 'indeterminate'
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `TreeNode[]` | — | 树形数据源 |
| `modelValue` | `string \| null` | `null` | 当前选中节点的 id（v-model） |
| `selectionMode` | `'single' \| 'checkbox'` | `'single'` | 选择模式：单选或复选 |
| `checkedIds` | `string[]` | `[]` | 复选模式下勾选的节点 id 列表（v-model:checkedIds） |
| `defaultExpanded` | `string[]` | `[]` | 初始展开的节点 id 列表 |
| `draggable` | `boolean` | `false` | 是否启用拖拽排序 |
| `allowDrag` | `(node: TreeNode) => boolean` | — | 判断节点是否可拖拽的函数，省略则所有节点均可拖拽 |
| `allowDrop` | `(node: TreeNode, target: TreeNode, dropType: 'before' \| 'after' \| 'inner') => boolean` | — | 判断是否允许放置到目标位置的函数 |
| `lazy` | `boolean` | `false` | 是否启用懒加载模式 |
| `load` | `(node: TreeNode) => Promise<TreeNode[]>` | — | 懒加载函数，展开未加载节点时自动调用 |
| `retryOnError` | `boolean` | `false` | 懒加载失败时是否允许重试（重置 loaded 状态） |
| `filterable` | `boolean` | `false` | 是否启用节点过滤 |
| `filterMethod` | `(query: string, node: TreeNode) => boolean` | — | 自定义过滤方法，省略时使用默认的 label 模糊匹配 |
| `class` | `string` | — | 根节点自定义样式类 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string \| null` | 选中节点 id 变更 |
| `update:checkedIds` | `string[]` | 勾选项变更（checkbox 模式） |
| `update:expanded` | `string[]` | 展开节点列表变更 |
| `select` | `TreeNode` | 点击任意节点时触发 |
| `expand` | `[id: string, expanded: boolean]` | 展开 / 折叠节点时触发 |
| `check` | `[node: TreeNode, checked: boolean]` | 勾选 / 取消勾选节点时触发（checkbox 模式） |
| `node-drag-start` | `[event: DragEvent, node: TreeNode]` | 拖拽开始时触发 |
| `node-drag-enter` | `[event: DragEvent, node: TreeNode]` | 拖拽进入节点区域时触发 |
| `node-drag-leave` | `[event: DragEvent, node: TreeNode]` | 拖拽离开节点区域时触发 |
| `node-drag-over` | `[event: DragEvent, node: TreeNode]` | 拖拽在节点上方移动时触发 |
| `node-drag-end` | `[event: DragEvent, node: TreeNode]` | 拖拽结束时触发 |
| `node-drop` | `[event: DragEvent, node: TreeNode, dropType: 'before' \| 'after' \| 'inner']` | 放置到目标节点时触发 |

## 可访问性

- **键盘操作**：遵循 WAI-ARIA TreeView 角色规范

| 按键 | 说明 |
|------|------|
| `ArrowUp` | 聚焦上一个可见节点 |
| `ArrowDown` | 聚焦下一个可见节点 |
| `ArrowRight` | 若节点未展开则展开；若已展开则聚焦第一个子节点 |
| `ArrowLeft` | 若节点已展开则折叠；若已折叠则聚焦父节点 |
| `Enter` / `Space` | 选中节点（单选模式）或切换勾选状态（复选模式） |
| `Home` | 聚焦第一个节点 |
| `End` | 聚焦最后一个节点 |

- **ARIA 属性**：使用 `role="tree"` 和 `role="treeitem"` 语义化标记；复选模式下使用 `aria-checked` 属性（`true` / `false` / `mixed`）
- **焦点管理**：使用 roving tabindex 管理焦点

## 拖拽排序

启用 `draggable` 后节点可拖拽排序。通过 `allowDrag` 和 `allowDrop` 精细控制拖拽行为。启用 `v-model:nodes` 后，drop 时组件自动重排树数据；否则需手动处理 `node-drop` 事件。

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
    // 如果未使用 v-model:nodes，可手动调用 moveNode 重排
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

**拖拽相关 Props：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `draggable` | `boolean` | `false` | 是否启用拖拽排序 |
| `allowDrag` | `(node: TreeNode) => boolean` | — | 判断节点是否可拖拽，省略则所有节点均可拖拽 |
| `allowDrop` | `(node: TreeNode, target: TreeNode, dropType: 'before' \| 'after' \| 'inner') => boolean` | — | 判断是否允许放置到目标位置 |

**拖拽事件：**

| 事件 | 参数 | 说明 |
|------|------|------|
| `node-drag-start` | `[event: DragEvent, node: TreeNode]` | 拖拽开始时触发 |
| `node-drag-enter` | `[event: DragEvent, node: TreeNode]` | 拖拽进入节点区域时触发 |
| `node-drag-leave` | `[event: DragEvent, node: TreeNode]` | 拖拽离开节点区域时触发 |
| `node-drag-over` | `[event: DragEvent, node: TreeNode]` | 拖拽在节点上方移动时触发 |
| `node-drag-end` | `[event: DragEvent, node: TreeNode]` | 拖拽结束时触发 |
| `node-drop` | `[event: DragEvent, node: TreeNode, dropType: 'before' \| 'after' \| 'inner']` | 放置到目标节点时触发 |

**工具函数：**

```ts
import { moveNode } from 'brutx-ui-vue'

// 纯函数，用于手动重排树数据
const newNodes = moveNode(nodes, draggedNode, targetNode, 'before')
```

## 懒加载

启用 `lazy` 并提供 `load` 函数后，展开未加载节点时自动触发异步加载。组件内部通过 `loadingKeys` 防止并发请求，加载完成后自动标记 `loaded` 状态。

```vue
<script setup>
import { TreeView } from 'brutx-ui-vue'
import type { TreeNode } from 'brutx-ui-vue'

const nodes: TreeNode[] = [
    { id: 'root', label: '根目录', isLeaf: false },
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

**懒加载相关 Props：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `lazy` | `boolean` | `false` | 是否启用懒加载模式 |
| `load` | `(node: TreeNode) => Promise<TreeNode[]>` | — | 懒加载函数，展开未加载节点时自动调用 |
| `retryOnError` | `boolean` | `false` | 懒加载失败时是否允许重试 |

**TreeNode 懒加载字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `isLeaf` | `boolean` | 是否为叶节点，懒加载模式下用于判断是否可展开 |
| `loaded` | `boolean` | 是否已加载，标记子节点是否已加载完成 |
| `loading` | `boolean` | 是否正在加载，标记当前加载状态 |

## 节点过滤

启用 `filterable` 后，通过组件实例的 `filter` 方法触发过滤。过滤会递归计算匹配状态，匹配节点及其祖先节点显示，其余隐藏，匹配节点的父级自动展开。

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
        <input v-model="query" @input="handleSearch" placeholder="搜索节点..." />
        <TreeView
            ref="treeRef"
            :nodes="nodes"
            filterable
            :default-expanded="['src']"
        />
    </div>
</template>
```

**过滤相关 Props：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `filterable` | `boolean` | `false` | 是否启用节点过滤 |
| `filterMethod` | `(query: string, node: TreeNode) => boolean` | — | 自定义过滤方法，省略时使用默认的 label 模糊匹配 |

**Expose 方法：**

| 方法 | 参数 | 说明 |
|------|------|------|
| `filter` | `query: string` | 触发过滤，递归计算匹配状态，匹配节点及祖先显示，其余隐藏，匹配节点的父级自动展开 |

## 重载节点

通过组件实例的 `reloadNode` 方法可以重置指定节点的 `loaded` 状态并重新触发懒加载，适用于需要刷新子节点数据的场景。

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
    <button @click="refreshNode('src')">刷新 src 节点</button>
</template>
```

**Expose 方法：**

| 方法 | 参数 | 说明 |
|------|------|------|
| `reloadNode` | `nodeKey: string` | 重置指定节点的 `loaded` 状态并重新触发懒加载 |

## 常见问题

**Q: 复选模式下，为什么父节点变成了半选状态？**

A: 这是级联勾选的设计行为。当父节点的子节点中只有部分被勾选时，父节点会显示为半选状态（`aria-checked="mixed"`），表示"部分选中"。只有当所有子节点都被勾选时，父节点才会显示为完全勾选状态。反之，勾选父节点会自动勾选其所有子孙节点。

**Q: 如何在初始加载时展开特定节点？**

A: 使用 `defaultExpanded` 属性传入需要初始展开的节点 `id` 数组。例如 `:default-expanded="['src', 'components']"` 会在组件加载时自动展开这些节点。后续的展开/折叠操作会触发 `update:expanded` 事件。

**Q: 禁用的节点在复选模式下会怎样？**

A: 设置 `disabled: true` 的节点在复选模式下不可被勾选，其复选框会显示为禁用状态。如果父节点被禁用，其子节点仍然可以独立勾选。禁用节点不影响单选模式下的点击选中行为（单选模式不使用 `disabled` 属性）。
