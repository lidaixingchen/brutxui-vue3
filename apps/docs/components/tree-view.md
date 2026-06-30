---
title: TreeView 树形目录
description: 递归树形组件，支持节点展开折叠、单选、图标、自定义缩进，适合文件系统、分类层级等场景。
---

# TreeView 树形目录

可递归展开的层级数据可视化组件，内置文件夹 / 文件图标，支持键盘导航与受控单选状态。

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

## TreeNode 类型

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
type SelectionMode = 'single' | 'checkbox'
type CheckState = 'checked' | 'unchecked' | 'indeterminate'
```

## 选择模式

`selectionMode` 支持 `single`（默认，单选）与 `checkbox`（复选）两种模式。

- `single`：点击节点时通过 `v-model` 同步选中 id，仅单选。
- `checkbox`：每个节点前渲染 `Checkbox`，支持级联勾选——父节点勾选则所有子孙节点全部勾选；子孙节点部分勾选时父节点呈半选状态（`aria-checked="mixed"`）。勾选项通过 `v-model:checkedIds` 双向绑定。`disabled` 为 `true` 的节点不可勾选。

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

## Props

### TreeView Props

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
| `update:modelValue` | `(id: string \| null)` | 选中节点 id 变更 |
| `update:checkedIds` | `(ids: string[])` | 勾选项变更（checkbox 模式） |
| `update:expanded` | `(ids: string[])` | 展开节点列表变更 |
| `select` | `(node: TreeNode)` | 点击任意节点时触发 |
| `expand` | `(id: string, expanded: boolean)` | 展开 / 折叠节点时触发 |
| `check` | `(node: TreeNode, checked: boolean)` | 勾选 / 取消勾选节点时触发（checkbox 模式） |

## 键盘导航

组件遵循 WAI-ARIA TreeView 角色规范，支持以下键盘操作：

| 按键 | 说明 |
|------|------|
| `ArrowUp` | 聚焦上一个可见节点 |
| `ArrowDown` | 聚焦下一个可见节点 |
| `ArrowRight` | 若节点未展开则展开；若已展开则聚焦第一个子节点 |
| `ArrowLeft` | 若节点已展开则折叠；若已折叠则聚焦父节点 |
| `Enter` / `Space` | 选中节点（单选模式）或切换勾选状态（复选模式） |
| `Home` | 聚焦第一个节点 |
| `End` | 聚焦最后一个节点 |
