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

## 常见问题

**Q: 复选模式下，为什么父节点变成了半选状态？**

A: 这是级联勾选的设计行为。当父节点的子节点中只有部分被勾选时，父节点会显示为半选状态（`aria-checked="mixed"`），表示"部分选中"。只有当所有子节点都被勾选时，父节点才会显示为完全勾选状态。反之，勾选父节点会自动勾选其所有子孙节点。

**Q: 如何在初始加载时展开特定节点？**

A: 使用 `defaultExpanded` 属性传入需要初始展开的节点 `id` 数组。例如 `:default-expanded="['src', 'components']"` 会在组件加载时自动展开这些节点。后续的展开/折叠操作会触发 `update:expanded` 事件。

**Q: 禁用的节点在复选模式下会怎样？**

A: 设置 `disabled: true` 的节点在复选模式下不可被勾选，其复选框会显示为禁用状态。如果父节点被禁用，其子节点仍然可以独立勾选。禁用节点不影响单选模式下的点击选中行为（单选模式不使用 `disabled` 属性）。
